#!/usr/bin/env bash
# レビュー結果を PR のコメントに書き、ai-review ジョブを通すか落とすかを決める。
# 通すのは「approve で、blocker が無く、人間の確認が要るファイルを触っていない」ときだけ。
# 結果が読めないときも落とす(分からないときは閉じる)。
#
# 入力(環境変数): RESULT(Claude の構造化出力の JSON)、REPO、PR_NUMBER、HEAD_SHA、GH_TOKEN
# 入力(ファイル): review-input/human-required.txt(人間の確認が要る変更ファイルの一覧。空なら該当なし)
# DRY_RUN=1 のときはコメントを投稿せず、本文を標準出力に出す。
set -euo pipefail

MARKER='<!-- ai-review -->'
human_file=review-input/human-required.txt
comment_file=review-input/comment.md

result=${RESULT:-}
if ! jq -e '.verdict and (.findings | type == "array")' >/dev/null 2>&1 <<<"$result"; then
  result=''
fi

if [ -z "$result" ]; then
  state=incomplete
elif [ "$(jq -r '.verdict' <<<"$result")" = approve ] &&
  [ "$(jq '[.findings[] | select(.severity == "blocker")] | length' <<<"$result")" -eq 0 ]; then
  state=approved
else
  state=changes
fi

human_required=false
if [ -s "$human_file" ]; then
  human_required=true
fi

case "$state" in
  approved) heading='AI レビュー: OK' ;;
  changes) heading='AI レビュー: 要修正' ;;
  incomplete) heading='AI レビュー: 完走しませんでした' ;;
esac

{
  echo "$MARKER"
  echo "## $heading"
  echo
  echo "対象コミット: \`${HEAD_SHA:0:7}\`"
  echo
  if [ "$state" = incomplete ]; then
    echo 'レビューの結果を受け取れませんでした。Actions のログを確認してください。認証のシークレットが未設定の場合もここに来ます。'
  else
    jq -r '.summary' <<<"$result"
    if [ "$(jq '.findings | length' <<<"$result")" -gt 0 ]; then
      echo
      echo '### 指摘'
      echo
      jq -r '
        .findings
        | sort_by(if .severity == "blocker" then 0 else 1 end)
        | .[]
        | "- **\(if .severity == "blocker" then "要修正" else "提案" end)** `\(.file)\(if .line then ":\(.line)" else "" end)`: \(.body | gsub("\n"; "\n  "))"
      ' <<<"$result"
    fi
  fi
  if [ "$human_required" = true ]; then
    echo
    echo '### 人間の確認が必要'
    echo
    echo 'この PR は次のファイルを触っているので、AI の判定だけでは自動マージしません。'
    echo
    sed 's/.*/- `&`/' "$human_file"
  fi
} >"$comment_file"

if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then
  cat "$comment_file" >>"$GITHUB_STEP_SUMMARY"
fi

if [ "${DRY_RUN:-}" = 1 ]; then
  cat "$comment_file"
else
  # 前回のコメントがあれば上書きする(push のたびにコメントが増えないように)。
  existing=$(gh api "repos/$REPO/issues/$PR_NUMBER/comments" --paginate \
    --jq ".[] | select(.user.login == \"github-actions[bot]\" and (.body | startswith(\"$MARKER\"))) | .id" | tail -n 1)
  if [ -n "$existing" ]; then
    gh api -X PATCH "repos/$REPO/issues/comments/$existing" -F body=@"$comment_file" >/dev/null
  else
    gh api -X POST "repos/$REPO/issues/$PR_NUMBER/comments" -F body=@"$comment_file" >/dev/null
  fi
fi

if [ "$state" = incomplete ]; then
  echo '::error::レビューの結果を受け取れませんでした。'
  exit 1
fi
if [ "$state" = changes ]; then
  echo '::error::AI レビューが修正を求めています。PR のコメントを確認してください。'
  exit 1
fi
if [ "$human_required" = true ]; then
  echo '::error::AI レビューは OK ですが、人間の確認が必要なファイルを触っています。'
  exit 1
fi
echo 'AI レビュー OK。'
