#!/usr/bin/env bash
# ai-fix ジョブの前後の判定。2 つの使い方がある。
#
#   fix-gate.sh check  直してよい PR かを確かめ、修正役に渡す材料を fix-input/ に用意する。
#                      run=true/false、branch、attempt を GITHUB_OUTPUT に出す。
#   fix-gate.sh apply  修正役の変更を確かめてコミットし、PR のブランチに push する。
#
# 直すのは「同じリポジトリのブランチから出た、開いている PR で、最新のレビューが要修正、
# head がレビューしたコミットのまま、自動修正の回数が上限未満」のときだけ。
# 人間に回すパスを修正役が触っていたら push しない。
#
# 環境変数: REPO、PR_NUMBER、HEAD_SHA、GH_TOKEN、MAX_ATTEMPTS
#           apply では BRANCH、ATTEMPT、AI_FIX_TOKEN(push 用。ワークフローを起動できるトークン)
set -euo pipefail

dir=fix-input
marker='<!-- ai-fix -->'
mkdir -p "$dir"

out() { echo "$1" >>"${GITHUB_OUTPUT:-/dev/stdout}"; }

# 自動修正の結果を書くコメント(レビューのコメントとは別の 1 件)を上書きする。
post() {
  local body_file=$1 id
  id=$(gh api "repos/$REPO/issues/$PR_NUMBER/comments" --paginate \
    --jq ".[] | select(.user.login == \"github-actions[bot]\" and (.body | startswith(\"$marker\"))) | .id" | tail -n 1)
  if [ -n "$id" ]; then
    gh api -X PATCH "repos/$REPO/issues/comments/$id" -F body=@"$body_file" >/dev/null
  else
    gh api -X POST "repos/$REPO/issues/$PR_NUMBER/comments" -F body=@"$body_file" >/dev/null
  fi
}

# check で取った PR の情報から既定ブランチを読む。分からなければ失敗する(呼び出し側は
# `db=$(default_branch)` のように代入で受けること。そうすれば set -e で止まる)。
default_branch() {
  local branch
  branch=$(jq -r '.base.repo.default_branch // empty' "$dir/pr.json" 2>/dev/null || true)
  if [ -z "$branch" ]; then
    echo '::error::既定ブランチが分かりません。' >&2
    return 1
  fi
  echo "$branch"
}

skip() {
  echo "自動修正しません: $1"
  out run=false
  exit 0
}

check() {
  gh api "repos/$REPO/pulls/$PR_NUMBER" >"$dir/pr.json"
  [ "$(jq -r .state "$dir/pr.json")" = open ] || skip 'PR が開いていない'
  [ "$(jq -r .head.repo.full_name "$dir/pr.json")" = "$REPO" ] || skip 'fork からの PR'
  [ "$(jq -r .head.sha "$dir/pr.json")" = "$HEAD_SHA" ] || skip 'レビューのあとに push されている'
  # main を head にした PR を直すと、修正がレビューを通らずに main へ直接 push されてしまう。
  # push 用のトークンは管理者のものなので、ブランチ保護でも止まらない。
  db=$(default_branch)
  [ "$(jq -r .head.ref "$dir/pr.json")" != "$db" ] || skip 'head が既定ブランチ'

  # --paginate の --jq はページごとに評価されるので、ID を集めてから最後の 1 件を取り直す。
  review_id=$(gh api "repos/$REPO/issues/$PR_NUMBER/comments" --paginate \
    --jq '.[] | select(.user.login == "github-actions[bot]" and (.body | startswith("<!-- ai-review "))) | .id' | tail -n 1)
  [ -n "$review_id" ] || skip 'レビューのコメントが無い'
  gh api "repos/$REPO/issues/comments/$review_id" --jq .body >"$dir/review.md"
  head -n 1 "$dir/review.md" | grep -q ' state=changes -->$' || skip '最新のレビューが要修正ではない'

  # いったんファイルに受ける。パイプのまま grep -c || true にすると、gh api の失敗が握りつぶされて
  # 0 回と数え、上限を見ないまま修正役が走ってしまう。
  gh api "repos/$REPO/pulls/$PR_NUMBER/commits" --paginate --jq '.[].commit.message' >"$dir/commits.txt"
  attempts=$(grep -c '^AI-Fix-Attempt: ' "$dir/commits.txt" || true)
  if [ "$attempts" -ge "$MAX_ATTEMPTS" ]; then
    {
      echo "$marker"
      echo '## 自動修正: 上限に達しました'
      echo
      echo "自動修正を $attempts 回試しましたが、レビューを通りませんでした。ここから先は人間が見てください。"
    } >"$dir/comment.md"
    post "$dir/comment.md"
    skip '回数の上限'
  fi

  jq -r '"# \(.title)\n\n\(.body // "")"' "$dir/pr.json" >"$dir/pr.md"
  out run=true
  out "branch=$(jq -r .head.ref "$dir/pr.json")"
  out "attempt=$((attempts + 1))"
}

apply() {
  local result=$dir/result.json
  local structured=''
  if [ -s "$result" ] && jq -e '.structured.summary' "$result" >/dev/null 2>&1; then
    structured=yes
  fi

  git -C pr-head add -A
  # --no-renames: 移動したファイルは移動元と移動先の両方を出す(移動先だけだと人間行きの判定をすり抜ける)。
  git -C pr-head diff --cached --name-only --no-renames >"$dir/changed.txt"

  grep -Ev '^(#|$)' .github/ai-review/human-required.txt >"$dir/patterns.txt"
  grep -E -f "$dir/patterns.txt" "$dir/changed.txt" >"$dir/forbidden.txt" || true

  {
    echo "$marker"
    if [ -z "$structured" ]; then
      echo "## 自動修正: 完走しませんでした($ATTEMPT 回目)"
      echo
      echo '修正役の結果を受け取れませんでした。Actions のログを確認してください。'
      reason=$(jq -r '.error // empty' "$result" 2>/dev/null || true)
      [ -n "$reason" ] && printf '\n理由: `%s`\n' "$reason"
    elif [ -s "$dir/forbidden.txt" ]; then
      echo "## 自動修正: push しませんでした($ATTEMPT 回目)"
      echo
      echo '修正役が、人間に回すファイルを書き換えました。安全のため push せず、人間に回します。'
      echo
      sed 's/.*/- `&`/' "$dir/forbidden.txt"
    elif [ ! -s "$dir/changed.txt" ]; then
      echo "## 自動修正: 直しませんでした($ATTEMPT 回目)"
      echo
      jq -r '.structured.summary' "$result"
    else
      echo "## 自動修正: 直して push しました($ATTEMPT 回目 / 上限 $MAX_ATTEMPTS 回)"
      echo
      jq -r '.structured.summary' "$result"
      echo
      echo '### 直したこと'
      echo
      jq -r '.structured.fixed[] | "- \(.)"' "$result"
    fi
    if [ -n "$structured" ] && [ "$(jq '.structured.not_fixed | length' "$result")" -gt 0 ]; then
      echo
      echo '### 直さなかった指摘'
      echo
      jq -r '.structured.not_fixed[] | "- \(.finding): \(.reason)"' "$result"
    fi
    if jq -e '.cost_usd' "$result" >/dev/null 2>&1; then
      echo
      jq -r '"<sub>モデル: \(.model // "既定") / 費用: $\(.cost_usd * 100 | round / 100) / \(.turns // "?") ターン</sub>"' "$result"
    fi
  } >"$dir/comment.md"

  if [ -n "$structured" ] && [ -s "$dir/changed.txt" ] && [ ! -s "$dir/forbidden.txt" ]; then
    # check でも止めているが、既定ブランチへの push だけは何があっても許さない。
    db=$(default_branch)
    if [ -z "$BRANCH" ] || [ "$BRANCH" = "$db" ]; then
      echo "::error::push 先が既定ブランチ(または空)なので push しません: '$BRANCH'"
      exit 1
    fi
    {
      echo "AI レビューの指摘を直す(自動修正 $ATTEMPT 回目)"
      echo
      jq -r '.structured.summary' "$result"
      echo
      echo "AI-Fix-Attempt: $ATTEMPT"
    } >"$dir/message.txt"
    # PR 側が置いたかもしれないフックは使わない(修正役は .git を触れないが、念のため)。
    git -C pr-head -c core.hooksPath=/dev/null \
      -c user.name='Claude (AI fix)' -c user.email='noreply@anthropic.com' \
      commit -q -F "$PWD/$dir/message.txt"
    # GITHUB_TOKEN で push すると CI と ai-review が起動しないので、専用のトークンで push する。
    if ! git -C pr-head -c core.hooksPath=/dev/null \
      push -q "https://x-access-token:${AI_FIX_TOKEN}@github.com/${REPO}.git" "HEAD:refs/heads/${BRANCH}"; then
      {
        echo "$marker"
        echo "## 自動修正: push できませんでした($ATTEMPT 回目)"
        echo
        echo '直しはしましたが、push に失敗しました。直している間にブランチへ別の push があった可能性があります。新しいコミットには改めてレビューが走ります。'
      } >"$dir/comment.md"
      post "$dir/comment.md"
      echo '::error::push に失敗しました。'
      exit 1
    fi
    post "$dir/comment.md"
    echo "push しました: $(git -C pr-head rev-parse --short HEAD)"
    return
  fi

  post "$dir/comment.md"
  if [ -z "$structured" ] || [ -s "$dir/forbidden.txt" ]; then
    echo '::error::自動修正できませんでした。PR のコメントを確認してください。'
    exit 1
  fi
  echo '変更が無いので push しません。'
}

case "${1:-}" in
  check) check ;;
  apply) apply ;;
  *)
    echo "usage: fix-gate.sh check|apply" >&2
    exit 2
    ;;
esac
