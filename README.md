# shaders.art

GLSL を書いて動かせる実行環境と、作品を展示する「博物館」。

- 作品は `vec4 render(vec2 uv, vec2 p)` の本体だけを書く。uniform は `time` / `resolution` / `attention` / `mouse`
- `/edit` で書いてライブプレビューし、投稿前チェック(サイズ・フレーム時間・ループ上限)を通す
- フロントは Next.js(App Router)。作品 API は同じアプリの Route Handler(`/api/works`)で、DynamoDB を読む
- 本番は AWS。CloudFront(+WAF) → Lambda(OpenNext で SSR)→ DynamoDB。IaC は `infra/`(CDK)

## 開発

```sh
pnpm install
pnpm dev
```

`pnpm verify`(型 + lint)が緑であることが完了条件。

既定では `/api` を叩く(`next dev` でも Route Handler が動くが、DynamoDB へのアクセス権と `TABLE_NAME` が要る)。
バックエンド無しで UI だけ触りたいときは `NEXT_PUBLIC_API_MOCK=1 pnpm dev` で MSW のモックに切り替わる。

## デプロイ

```sh
cd infra
pnpm install
pnpm cdk deploy --all
```

`cdk deploy` の中で OpenNext のビルド(`next build` → Lambda 用バンドル)まで走る。
初回は `pnpm seed`(`TABLE_NAME` を出力から渡す)で仮データを入れる。
