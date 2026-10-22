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
このアカウントでは Bedrock の Claude が「is not available for this account」(403)で使えない(AWS サポートに解除を依頼する)。
使えるようになっても、東京のマントルにある Claude は Opus 4.8 / 4.7 / Haiku 4.5 まで(Opus 5.5 などは us-east-1 にしか無い)。

利用者はパネルの送信ボタンの左で、`src/lib/aiModels.ts` の一覧(Qwen3 Coder 480B / 30B、gpt-oss-120b、MiniMax M2.5、
Devstral 2、Kimi K2.5)からモデルを選べる。サーバーは一覧に無いモデルを受け付けず、選ばれていなければ `AI_MODEL` を使う。
一覧に足すときは、東京で呼べること(`aws bedrock get-foundation-model-availability`)と、コードブロックで答えられることを確かめる。

Claude(Haiku 5.5 / Sonnet 5.5 / Opus 5.5)は、Bedrock ではなく **Claude Platform on AWS**(Anthropic が運営し、請求は AWS)で呼ぶ
(このアカウントでは Bedrock の Claude が使えないため)。API キーは持たず、Bedrock と同じく AWS の認証情報(SigV4)で呼ぶ。
ワークスペース ID を設定するまでは、パネルのメニューに Claude は出ない(`GET /api/ai/models`)。使えるようにするには:

1. AWS コンソールの「Claude Platform on AWS」で Sign up する(AWS Marketplace の同意)。Anthropic の組織を作る
2. 東京(ap-northeast-1)にワークスペースを作り、ID(`wrkspc_…`)を控える。使いすぎないよう、ワークスペースの上限額も決めておく
3. アカウントで一度だけ `aws iam enable-outbound-web-identity-federation` を実行する
4. ローカル: `.env.local` に `ANTHROPIC_AWS_WORKSPACE_ID=wrkspc_…` を足して `pnpm dev` を起動し直す
5. 本番: `pnpm cdk deploy --all -c claudeWorkspaceId=wrkspc_…`(Lambda の環境変数と、そのワークスペースでの
   `aws-external-anthropic:CreateInference` の権限が付く)

推論が動く場所は日本に固定されない(既定は世界のどこか。リクエストごとに `inference_geo` で `us` にはできる)。

`AI_MODEL` が無いときは「AI はまだ設定されていません」と返る。`NEXT_PUBLIC_API_MOCK=1` なら AI もモック
(依頼文をコメントとして足すだけの提案)になる。

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
