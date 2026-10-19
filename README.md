# shaders.art

GLSL を書いて動かせる実行環境と、作品を展示する「博物館」。

- 作品は `vec4 render(vec2 uv, vec2 p)` の本体だけを書く。uniform は `time` / `resolution` / `attention` / `mouse`
- `/edit` で書いてライブプレビューし、投稿前チェック(サイズ・フレーム時間・ループ上限)を通す
- フロントは Next.js(App Router)。作品 API は同じアプリの Route Handler(`/api/works`)で、DynamoDB を読む
- 本番は AWS。CloudFront(+WAF) → Lambda(OpenNext で SSR)→ DynamoDB。IaC は `infra/`(CDK)
  - Lambda の Function URL は IAM 認証。CloudFront の Lambda@Edge が署名して呼ぶので、CloudFront(WAF)を通らない直接アクセスはできない

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

## デプロイ

```sh
cd infra
pnpm install
pnpm cdk deploy --all
```

`cdk deploy` の中で OpenNext のビルド(`next build` → Lambda 用バンドル)まで走る。
初回は `pnpm seed`(`TABLE_NAME` を出力から渡す)で仮データを入れる。

### 本番でログインを有効にする(初回だけ 2 段階)

Cognito のコールバック URL には本番のオリジンが要るが、CloudFront のドメインはデプロイするまで
決まらない(コンストラクト間で直接参照すると循環参照になる)。なので:

1. 一度 `cdk deploy --all` する。出力の `ShadersArtStack.SiteUrl` が本番のオリジン
2. `infra/cdk.json` の `context.siteUrl` にその値を書く(`https://dxxxx.cloudfront.net`、末尾スラッシュ無し)
3. もう一度 `cdk deploy --all` する

CloudFront のドメインは作り直さない限り変わらない。独自ドメインを当てたら `siteUrl` をそれに差し替える。

Cognito の確認メールは既定の送信元(1 日 50 通まで)で送っている。利用者が増えたら SES に切り替える。
