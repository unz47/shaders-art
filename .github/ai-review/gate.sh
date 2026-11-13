#!/usr/bin/env bash
# ai-review ジョブの判定まわり。2 つの使い方がある。
#
#   gate.sh lookup  前回のコメントを探し、差分が前回と同じなら「判定を引き継ぐ」と出力する。
#                   rebase しただけの PR を読み直してトークンを使わないため。
#   gate.sh decide  判定を PR のコメントに書き、ジョブを通すか落とすかを決める。
#
# 通すのは「approve で、blocker が無く、人間の確認が要るファイルを触っていない」ときだけ。
# 結果が読めないときも落とす(分からないときは閉じる)。
#
# 環境変数: REPO、PR_NUMBER、HEAD_SHA、PATCH_ID(差分の git patch-id)、GH_TOKEN
#           decide では REUSE(lookup が出した値。true なら前回の判定を引き継ぐ)
# ファイル: review-input/result.json(review.mjs の出力)
#           review-input/human-required.txt(人間の確認が要る変更ファイルの一覧。空なら該当なし)
# DRY_RUN=1 のときは GitHub に触らない。前回のコメントは review-input/previous.md にあれば使い、
# 新しい本文は標準出力に出す。
set -euo pipefail

dir=review-input
result_file=$dir/result.json
human_file=$dir/human-required.txt
previous_file=$dir/previous.md
previous_id_file=$dir/previous-id.txt
comment_file=$dir/comment.md

# コメントの 1 行目に、どの差分をどう判定したかを埋めておく。
#   <!-- ai-review patch=<patch-id> state=<approved|changes|incomplete> -->
# 引き継ぎで信じるのは github-actions[bot] が書いたコメントだけ。PR 側がこれを偽造するには
# ワークフローを足す必要があり、その PR は .github/ を触るので人間行きになる。
marker_field() {
  sed -n "1s/^<!-- ai-review patch=\([0-9a-f]*\) state=\([a-z]*\) -->\$/\\$1/p" "$previous_file"
}

lookup() {
  : >"$previous_id_file"
  if [ "${DRY_RUN:-}" != 1 ]; then
    : >"$previous_file"
    id=$(gh api "repos/$REPO/issues/$PR_NUMBER/comments" --paginate \
      --jq '.[] | select(.user.login == "github-actions[bot]" and (.body | startswith("<!-- ai-review "))) | .id' | tail -n 1)
    if [ -n "$id" ]; then
      echo "$id" >"$previous_id_file"
      gh api "repos/$REPO/issues/comments/$id" --jq .body >"$previous_file"
    fi
  fi

  reuse=false
  if [ -s "$previous_file" ] && [ -n "${PATCH_ID:-}" ] && [ "$(marker_field 1)" = "$PATCH_ID" ]; then
    case "$(marker_field 2)" in
      approved | changes) reuse=true ;;
    esac
  fi
  echo "reuse=$reuse" >>"${GITHUB_OUTPUT:-/dev/stdout}"
}

post() {
  if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then
    cat "$comment_file" >>"$GITHUB_STEP_SUMMARY"
  fi
  if [ "${DRY_RUN:-}" = 1 ]; then
    cat "$comment_file"
    return
  fi
  # 前回のコメントがあれば上書きする(push のたびにコメントが増えないように)。
  id=$(cat "$previous_id_file" 2>/dev/null || true)
  if [ -n "$id" ]; then
    gh api -X PATCH "repos/$REPO/issues/comments/$id" -F body=@"$comment_file" >/dev/null
  else
    gh api -X POST "repos/$REPO/issues/$PR_NUMBER/comments" -F body=@"$comment_file" >/dev/null
  fi
}

human_section() {
  if [ -s "$human_file" ]; then
    echo
    echo '### 人間の確認が必要'
    echo
    echo 'この PR は次のファイルを触っているので、AI の判定だけでは自動マージしません。'
    echo
    sed 's/.*/- `&`/' "$human_file"
  fi
}

decide() {
  if [ "${REUSE:-}" = true ]; then
    state=$(marker_field 2)
    # 本文はそのまま、対象コミットの行だけ今のコミットに差し替える。
    sed "s/^対象コミット: .*/対象コミット: \`${HEAD_SHA:0:7}\`(差分が前回と同じなので、前回の判定を引き継ぎました)/" \
      "$previous_file" >"$comment_file"
  else
    result=''
    if [ -s "$result_file" ] &&
      jq -e '.structured | .verdict and (.findings | type == "array")' "$result_file" >/dev/null 2>&1; then
      result=$(jq -c '.structured' "$result_file")
    fi

    if [ -z "$result" ]; then
      state=incomplete
    elif [ "$(jq -r '.verdict' <<<"$result")" = approve ] &&
      [ "$(jq '[.findings[] | select(.severity == "blocker")] | length' <<<"$result")" -eq 0 ]; then
      state=approved
    else
      state=changes
    fi

    case "$state" in
      approved) heading='AI レビュー: OK' ;;
      changes) heading='AI レビュー: 要修正' ;;
      incomplete) heading='AI レビュー: 完走しませんでした' ;;
    esac

    {
      echo "<!-- ai-review patch=${PATCH_ID:-} state=$state -->"
      echo "## $heading"
      echo
      echo "対象コミット: \`${HEAD_SHA:0:7}\`"
      echo
      if [ "$state" = incomplete ]; then
        echo 'レビューの結果を受け取れませんでした。Actions のログを確認してください。API キーが未設定、またはクレジットが尽きた場合もここに来ます。'
        if [ -s "$result_file" ] && reason=$(jq -er '.error // empty' "$result_file" 2>/dev/null); then
          echo
          echo "理由: \`$reason\`"
        fi
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
      human_section
      if [ -s "$result_file" ] && jq -e '.cost_usd' "$result_file" >/dev/null 2>&1; then
        echo
        jq -r '"<sub>モデル: \(.model // "既定") / 費用: $\(.cost_usd * 100 | round / 100) / \(.turns // "?") ターン</sub>"' "$result_file"
      fi
    } >"$comment_file"
  fi

  post

  case "$state" in
    incomplete)
      echo '::error::レビューの結果を受け取れませんでした。'
      exit 1
      ;;
    changes)
      echo '::error::AI レビューが修正を求めています。PR のコメントを確認してください。'
      exit 1
      ;;
  esac
  if [ -s "$human_file" ]; then
    echo '::error::AI レビューは OK ですが、人間の確認が必要なファイルを触っています。'
    exit 1
  fi
  echo 'AI レビュー OK。'
}

case "${1:-}" in
  lookup) lookup ;;
  decide) decide ;;
  *)
    echo "usage: gate.sh lookup|decide" >&2
    exit 2
    ;;
esac
