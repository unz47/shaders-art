# shaders.art

GLSL を書いて動かせる実行環境と、作品を展示する「博物館」。

- 作品は `vec4 render(vec2 uv, vec2 p)` の本体だけを書く。uniform は `time` / `resolution` / `attention` / `mouse`
- `/edit` で書いてライブプレビューし、投稿前チェック(サイズ・フレーム時間・ループ上限)を通す
- フロントは Next.js(App Router)。作品 API は同じアプリの Route Handler(`/api/works`)で、DynamoDB を読む
- 本番は AWS。CloudFront(+WAF) → Lambda(OpenNext で SSR)→ DynamoDB。IaC は `infra/`(CDK)
  - Lambda の Function URL は IAM 認証。CloudFront の Lambda@Edge が署名して呼ぶので、CloudFront(WAF)を通らない直接アクセスはできない
- `/edit` の左下に「AI と作る」パネル(要ログイン)。推論は Amazon Bedrock(既定は Qwen3 Coder。パネルでモデルを選べる)で、
  Lambda の実行ロールで呼ぶので API キーは持たない。返答はストリーミングで返す(`POST /api/ai/edit`、SSE)

## 開発

```sh
pnpm install
pnpm dev
```

`pnpm verify`(型 + lint)が緑であることが完了条件。

既定では `/api` を叩く(`next dev` でも Route Handler が動くが、DynamoDB へのアクセス権と `TABLE_NAME` が要る)。
バックエンド無しで UI だけ触りたいときは `NEXT_PUBLIC_API_MOCK=1 pnpm dev` で MSW のモックに切り替わる。

ローカルで実際のログインと投稿まで試すときは、開発用 Cognito を一度作成する。
この独立スタックは localhost 専用で、本番スタックを変更しない。

```sh
cd infra
pnpm cdk --app "node bin/dev-auth.ts" deploy ShadersArtDevAuthStack
```

出力された `UserPoolId`、`UserPoolClientId`、`CognitoDomain` をプロジェクト直下の `.env.local` に設定する。
Cognito 側には `http://localhost:3000` がコールバック先として登録済み。設定後は `pnpm dev` を再起動する。

```sh
TABLE_NAME=...            # ShadersArtStack.TableName
COGNITO_USER_POOL_ID=...  # ShadersArtDevAuthStack.UserPoolId
COGNITO_CLIENT_ID=...     # ShadersArtDevAuthStack.UserPoolClientId
COGNITO_DOMAIN=...        # ShadersArtDevAuthStack.CognitoDomain
```

Cognito の設定が無いときは Sign in ボタンが出ず、投稿はできない(閲覧はできる)。

### AI と作る

ローカルで本物の Bedrock を呼ぶときは、ログインできる状態(上の Cognito の設定)に加えて `.env.local` に次を入れ、
Bedrock を呼べる AWS の認証情報(`AWS_PROFILE` など)で `pnpm dev` を起動する。呼び出しごとに料金がかかる。

```sh
AWS_REGION=ap-northeast-1
AI_MODEL=qwen.qwen3-coder-480b-a35b-v1:0
```

`AI_MODEL` が `anthropic.` で始まれば Claude を Messages API(bedrock-mantle、権限は `bedrock-mantle:CreateInference`)で、
それ以外は Converse API(権限は `bedrock:InvokeModelWithResponseStream`)で呼ぶ(`src/lib/server/ai.ts`)。
Claude のときだけ、安全性の判定で断られたときの切り替え先を `AI_FALLBACK_MODEL` で指定できる。
このアカウントでは bedrock-mantle の Claude がどれも「is not available for this account」(403)で使えない
(AWS サポートに解除を依頼する。利用目的の申請は済んでいる)。東京の bedrock-mantle には Sonnet 4.6 と 5 系が無い(404)。

利用者はパネルの送信ボタンの左で、`src/lib/aiModels.ts` の一覧(Qwen3 Coder 480B / 30B、gpt-oss-120b、MiniMax M2.5、
Devstral 2、Kimi K2.5、Claude Sonnet 4.6 / Haiku 4.5)からモデルを選べる。サーバーは一覧に無いモデルを受け付けず、
選ばれていなければ `AI_MODEL` を使う。一覧に足すときは、東京で呼べること(`aws bedrock get-foundation-model-availability`)と、
コードブロックで答えられることを確かめる。

Claude Sonnet 4.6 / Haiku 4.5 は、Bedrock の InvokeModel(bedrock-runtime)に Messages API の形で送る(`AnthropicBedrock`)。
日本国内で処理する推論プロファイル(`jp.anthropic.…`)を通すので、権限はプロファイルと、行き先(東京・大阪)の基盤モデルに付ける。
このアカウントの Bedrock で通る Claude はこの 2 つだけで、Opus と 5 系は 403 になる(Converse でも同じ)。

Claude(Haiku 5.5 / Sonnet 5.5 / Opus 5.5)は、Bedrock ではなく **Claude Platform on AWS**(Anthropic が運営し、請求は AWS)で呼ぶ
(このアカウントの Bedrock では 5 系が使えないため)。API キーは持たず、Bedrock と同じく AWS の認証情報(SigV4)で呼ぶ。
ワークスペース ID を設定するまでは、パネルのメニューにこの 3 つは出ない(`GET /api/ai/models`)。使えるようにするには:

1. AWS コンソールの「Claude Platform on AWS」で Sign up する(AWS Marketplace の同意)。Anthropic の組織を作る
2. 東京(ap-northeast-1)にワークスペースを作り、ID(`wrkspc_…`)を控える。使いすぎないよう、ワークスペースの上限額も決めておく
3. アカウントで一度だけ `aws iam enable-outbound-web-identity-federation` を実行する
4. ローカル: `.env.local` に `ANTHROPIC_AWS_WORKSPACE_ID=wrkspc_…` を足して `pnpm dev` を起動し直す
5. 本番: `pnpm cdk deploy --all -c claudeWorkspaceId=wrkspc_…`(Lambda の環境変数と、そのワークスペースでの
   `aws-external-anthropic:CreateInference` の権限が付く)

推論が動く場所は日本に固定されない(既定は世界のどこか。リクエストごとに `inference_geo` で `us` にはできる)。

`AI_MODEL` が無いときは「AI はまだ設定されていません」と返る。`NEXT_PUBLIC_API_MOCK=1` なら AI もモック
(依頼文をコメントとして足すだけの提案)になる。

#### AI の使用量と上限

1 人あたり **月 40 クレジット**と **1 日 20 回**まで(issue #43。日本時間の月初・0 時に戻る)。
クレジットは実際の原価で減る(1 クレジット = 原価 ¥0.5 相当。1 ドル = 150 円で換算。`src/lib/aiQuota.ts`)。
Qwen3 Coder ならおよそ 1 回 1、Claude Sonnet 4.6 なら 2〜14。途中で切れた・断られた依頼も、使ったトークンの分は数える。
利用者が途中で止めた依頼は、使ったトークンの数が届かないので、多めに見積もった分を数える(最初の反応からの時間 × 1 秒 100 トークン)。
モデルから最初の反応が 10 秒来なければ「混み合っています」で諦める(原価はかからないとみなし、回数だけ数える)。

これとは別に、**無料の人全体の原価が月 ¥3,000** に達したら、その月は無料の人の AI を止める(運営は使える)。
人が急に増えたり、アカウントを大量に作られたりしても、運営の負担がこの額で止まる。同時に頼まれると少し超えることがある。

| 環境変数 | 意味 |
|---|---|
| `AI_MONTHLY_CREDITS` / `AI_DAILY_REQUESTS` | 1 人あたりの上限を変える(既定 40 / 20) |
| `AI_FREE_MONTHLY_BUDGET_YEN` | 無料の人全体の、1 か月の原価の上限(円。既定 3000) |
| `AI_UNLIMITED_EMAILS` | 上限なしで使える人(運営)のメールアドレス。カンマ区切り。使用量は記録する |

本番では `pnpm cdk deploy --all -c aiUnlimitedEmails=you@example.com` で渡す(公開リポジトリなので cdk.json には書かない)。
ローカルで開発中に上限に当たらないよう、`.env.local` にも `AI_UNLIMITED_EMAILS` を入れておく。
`pnpm dev` も本番と同じ表を使うので、入れておかないと開発中の依頼が本番の「無料の人全体」の合計に入る。

使用量は作品と同じ DynamoDB の表に、ユーザーごと・月ごと(`ai-usage#<ユーザー ID>#2026-11`)・日ごと(`…#2026-11-01`)の行として残る
(依頼の回数 `requests`・クレジット `credits`・原価 `costMicroUsd`。古い行は TTL `expiresAt` で消える)。
無料の人全体の合計は `ai-usage#free#2026-11` の行。
依頼ごとの原価は CloudWatch Logs にも出るので、Logs Insights で集計できる(SSR Lambda のロググループで):

```
filter msg = "ai-edit"
| stats count(*) as requests, sum(costUsd) as usd, sum(credits) as credits by bin(1d), model
```

上限で断った回数は `"ai-blocked"`(`reason` は `monthly` / `daily` / `pool`)、モデルが反応しなかった回数は `"ai-timeout"`。
途中で止めた依頼は `"ai-edit"` の `stop` が `aborted` で、`estimated` に見積もったトークンの数が入る。

```
filter msg = "ai-blocked"
| stats count(*) as blocked, count_distinct(user) as users by bin(1d), reason
```

### 学習(/learn)

0 からシェーダーを学び、デモを作って投稿できるところまでのコース。全 30 回(4 部)、1 回 30〜60 分。ログインは要らず、
終えた回はブラウザ(localStorage)に覚える。ヘッダーのナビの Learn から入る。

- レッスンは `src/lib/learn/lessons/NN-slug.ts` に 1 回 1 ファイル。並び順と部の分け方は `src/lib/learn/course.ts`
- 本文は日本語と英語を並べて持つ(`{ ja, en }`)。サーバーで見る人の言語だけに絞ってからブラウザに渡す(`localize.ts`)
- ブロックは見出し・段落・箇条書き・補足・読み取り専用のコード・**書き換えられるコードとプレビュー(playground)**・
  **課題(exercise: 書き始めのコード・ヒント・見本)**。文の中で使える記法は `` `コード` ``・`**強調**`・`[リンク](/learn/slug)` だけ
- コードは字下げしたまま書いてよい(表示する前に取る)。コメントは `//ja: …` と `//en: …` を並べると、見る人の言語のほうだけが残る
  (行まるごとのコメントは日英を必ず 2 行の対にする。どちらの言語でも行番号が同じになるように。`source.ts`)
- コードは作品と同じルールを守る(`render` の形、`gl_FragCoord` 無し、`for` の上限は数値で 64 以下など)。
  `pnpm test` の `course.test.ts` が、日英のそろいと投稿の静的チェック(`sourceErrors`)を全部のコードに通す
- コンパイルできるかはブラウザでしか確かめられない。レッスンを直したら、そのページを開いて全部のプレビューが動くことを確かめる
- playground の「/edit で開く」は、コードを `/edit#src=…`(`/stage` と同じ圧縮)で渡す。`/edit` はそれを開き、
  それまでの下書きは「元に戻す」で戻せる

## デプロイ

```sh
cd infra
pnpm install
pnpm cdk deploy --all
```

`cdk deploy` の中で OpenNext のビルド(`next build` → Lambda 用バンドル)まで走る。
初回は `pnpm seed`(`TABLE_NAME` を出力から渡す)で仮データを入れる。

AI と作るの既定のモデルは `infra/lib/nextjs-site.ts` の `AI_MODEL`。Lambda には、それと `src/lib/aiModels.ts` の
一覧の全部を呼ぶ権限を渡す(一覧を変えたらデプロイし直す)。Claude にするときは、ap-northeast-1 で
そのモデルの利用契約を結んでおく(`aws bedrock create-foundation-model-agreement`)。

### 本番でログインを有効にする(初回だけ 2 段階)

Cognito のコールバック URL には本番のオリジンが要るが、CloudFront のドメインはデプロイするまで
決まらない(コンストラクト間で直接参照すると循環参照になる)。なので:

1. 一度 `cdk deploy --all` する。出力の `ShadersArtStack.SiteUrl` が本番のオリジン
2. `infra/cdk.json` の `context.siteUrl` にその値を書く(`https://dxxxx.cloudfront.net`、末尾スラッシュ無し)
3. もう一度 `cdk deploy --all` する

CloudFront のドメインは作り直さない限り変わらない。独自ドメインを当てたら `siteUrl` をそれに差し替える。

Cognito の確認メールは既定の送信元(1 日 50 通まで)で送っている。利用者が増えたら SES に切り替える。

## アクセス解析

外部のサービスは使わず、自前で記録する(issue #43。Cookie なし)。ブラウザ(`src/instrumentation-client.ts`)が
ページを開いた・移ったときにパスと参照元のドメインを `POST /api/pv` に送り、SSR Lambda が CloudWatch Logs に
`"pv"` の行を出す(`src/lib/server/pageViews.ts`)。

- 記録するもの: パス(クエリと `#` の後ろは除く)、よそのサイトから来たときのドメイン `ref`、言語 `locale`、
  `device`(mobile / desktop)、訪問者 `visitor`
- `visitor` は「その月だけの秘密の値 + IP アドレス + User-Agent」のハッシュ。IP アドレスそのものは残さない。
  秘密の値は作品と同じ表の `pv-salt#2026-11` の行で、月が終わると TTL で消える。なので**訪問者の数は 1 か月の中でしか数えられない**
  (月をまたいで足したり重ねたりはできない)
- ブラウザで Global Privacy Control / Do Not Track を選んでいる人と、`NEXT_PUBLIC_API_MOCK=1` のときは送らない
- SSR Lambda のログは 13 か月で消える(`infra/lib/nextjs-site.ts`)。記録の内容と期間は利用規約の「7. 利用状況の記録」に
  書いてあるので、変えたらそちらも直す

集計は Logs Insights で(SSR Lambda のロググループ `…ServerLogs…` を選ぶ):

```
# 日ごとのページビューと訪問者
filter msg = "pv"
| stats count(*) as views, count_distinct(visitor) as visitors by bin(1d)

# 月の訪問者(期間をその月の 1 日〜末日にする)
filter msg = "pv"
| stats count_distinct(visitor) as visitors

# よく見られているページ
filter msg = "pv"
| stats count(*) as views, count_distinct(visitor) as visitors by path
| sort views desc
| limit 50

# どこから来たか
filter msg = "pv" and ispresent(ref)
| stats count(*) as views, count_distinct(visitor) as visitors by ref
| sort views desc

# /stage(配信の背景・埋め込み)の使われ方
filter msg = "pv" and path like /^\/stage/
| stats count(*) as views, count_distinct(visitor) as visitors by bin(1d)

# 言語と端末
filter msg = "pv"
| stats count_distinct(visitor) as visitors by locale, device
```

`count_distinct` は件数が多いと近似値になる。
