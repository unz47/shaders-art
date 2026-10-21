# Design Brief: 投稿時のサムネイル自動生成

## Problem

投稿者は作品を登録できるが、投稿時にサムネイル画像は作られない。Gallery のカードに作品の見た目が出ず、投稿した作品が並んでも魅力が伝わりにくい。

## Solution

投稿時にエディタの WebGL プレビューから静止画を自動生成し、作品と一緒に保存する。投稿者に画像ファイルの用意やアップロードを求めず、既存の Gallery カードに作品のプレビューを表示する。

公開作品は誰でもサムネイルを見られる。非公開作品は投稿者本人だけが作品詳細とサムネイルを取得できる。

## Experience Principles

1. **投稿者の手間を増やさない** — サムネイルは登録操作の中で自動生成する。
2. **作品そのものを見せる** — サムネイルにはエディタで実行中の GLSL を使い、別の仮画像で代用しない。
3. **公開範囲を一貫させる** — 作品の公開設定を、詳細・一覧・画像取得のすべてで守る。

## Aesthetic Direction

- **Philosophy**: Gallery の既存カードとプレビューの描画をそのまま使う。
- **Tone**: 操作を増やさず、作品の描画に集中できる。
- **Reference points**: `/edit` の `ShaderEditorPreview` と Gallery の `ShaderThumbnail`。
- **Anti-references**: 汎用のアップロードフォーム、作品と無関係な既定画像。

## Existing Patterns

- **Typography / colors / spacing**: `@frost-ui/tokens` と Tailwind v4 を `src/app/globals.css` から読み込む。
- **Components**: `ShaderEditorPreview` が Three.js の WebGL 描画と実行状態を管理し、`ShaderThumbnail` が Gallery カードを描画する。
- **Submission**: `src/app/edit/page.tsx` → `src/lib/works.ts` → `POST /api/works`。
- **Persistence**: DynamoDB に作品メタデータと GLSL 本体を保存する。CDK の `NextjsSite` が Route Handler に DynamoDB 権限を付与する。
- **Visibility**: 公開作品は Gallery に表示し、非公開作品は投稿者だけが閲覧できる。既存作品で `visibility` が無いものは公開扱い。
- **Current thumbnail behavior**: 投稿 API は `thumbnail: ""` を保存する。既存の収蔵作品は `public/thumbs/` の静的ファイルを参照する。

## Component Inventory

| Component | Status | Notes |
| --- | --- | --- |
| `ShaderEditorPreview` | Modify | 投稿するコードの描画を、カード比率の静止画として安全に取り出せる API を追加する。 |
| `/edit` 投稿ダイアログ | Modify | 画像操作は追加せず、登録処理に生成画像を含める。画像生成に失敗した場合の表示を決める。 |
| `POST /api/works` | Modify | メタデータと画像を検証し、S3 と DynamoDB に保存する。 |
| `GET /api/works` / `GET /api/works/[slug]` | Modify | 新しい作品は画像 API の同一オリジン URL を返す。既存静的 URL は維持する。 |
| `GET /api/works/[slug]/thumbnail` | New | S3 から画像を返し、非公開作品では所有者を検証する。 |
| CDK thumbnail bucket | New | 非公開・暗号化・パブリックアクセス遮断の S3 バケットを追加する。 |
| `ShaderThumbnail` | Modify | 画像 API URL を表示し、画像が無い既存投稿は現在のホバープレビューを維持する。 |

## Key Interactions

1. 投稿者が `/edit` でコードを書き、プレビューを確認する。
2. 「公開する」または「非公開で登録」を押すと、プレビューから現在のコードの静止画を自動生成する。
3. 画像と投稿データが保存される。画像生成または保存が失敗した場合も作品投稿を失敗扱いにするか、画像無しで登録して再試行可能にするかを実装時に確定する。推奨は投稿を成立させ、既存のプレースホルダー／ホバープレビューへフォールバックすること。
4. Gallery は公開作品の静止サムネイルを表示する。ホバー時のライブプレビューは現在の動きを維持する。
5. 非公開作品では詳細 API とサムネイル API の両方が Cognito の所有者 ID を照合する。所有者以外には 404 を返す。

## Responsive Behavior

- 保存画像は Gallery のカード比率に合わせた 320×174 ピクセルを基準に生成し、表示側は既存の `fill` レイアウトで拡縮する。
- デスクトップ／モバイルで生成処理を変えず、WebGL の描画サイズから独立した固定サイズにする。
- タッチ端末ではホバー再生が使えないため、保存済みサムネイルが必ず初期表示されることを確認する。

## Accessibility Requirements

- サムネイルは作品の視覚的プレビューとして扱い、カード内の作品タイトルをリンクの読み上げ可能な名前として維持する。
- 画像が無い場合もタイトル・作者などのテキスト情報を失わない。
- 画像生成エラーは色だけで示さず、投稿者に読める文で知らせる。自動生成のため追加フォーム操作は作らない。
- キーボード操作とタッチ操作で作品詳細へ遷移できる状態を維持する。

## Out of Scope

- 投稿後のサムネイル差し替え・再生成 UI。
- 手動画像アップロードや外部 URL 指定。
- 動画／アニメーション GIF の生成。
- 作品編集・削除機能。
- Gallery の並び順やページネーション変更。

## Implementation Plan

### 1. サムネイル生成を追加

- `ShaderEditorPreview` に capture request の受け渡しを追加し、現在の `source`、uniform、描画結果を使う。
- カードと同じ比率で 320×174 の画像を生成し、WebP を優先する。ブラウザーが WebP を生成できない場合のフォーマット／フォールバックを決める。
- Three.js の WebGL 描画バッファは通常フレーム後に保持されないため、単純な `canvas.toBlob()` が常に有効とは仮定しない。capture 時に offscreen `WebGLRenderTarget` へ描画して `readRenderTargetPixels` で読み出す方法を第一候補にし、上下反転と色空間を確認する。
- コンパイルエラー時は画像を生成しない。既存の静的チェック・フレーム時間チェックは変えない。

### 2. 画像保存と作品レコードを接続

- CDK に S3 バケットを追加し、暗号化、Block Public Access、削除保護を設定する。
- `NextjsSite` のサーバー Lambda に、画像の `PutObject` / `GetObject` 権限を付与する。公開配信用にバケットを直接公開しない。
- DynamoDB には `thumbnailKey` を追加し、画像バイナリは保存しない。旧 `thumbnail` の静的パスはそのままサポートする。
- POST API はログイン・same-origin・投稿規約に加えて画像 MIME とバイト上限を検証する。スラッグからサーバー側で S3 キーを組み立て、クライアント指定キーを信用しない。
- S3 保存と DynamoDB 書き込みの片方だけが成功した場合の整合性を決める。推奨は S3 を先に保存し、DynamoDB Put が失敗したら S3 オブジェクトを削除する。

### 3. 公開範囲を保った画像取得 API を追加

- `GET /api/works/[slug]/thumbnail` を追加する。
- レコードの `visibility` が `public` または未設定なら画像を返す。`private` は `getSession()` の `sub` と `authorId` が一致する場合だけ返す。
- 他人の非公開画像は作品詳細 API と同じく 404 にする。
- 公開画像はキャッシュ可能、非公開画像は `private, no-store` にする。
- `next/image` の最適化プロキシは認証 Cookie を転送しないため、この same-origin 認可 URL は `unoptimized` で直接読み込む。

### 4. 既存画面とデータの互換性

- 作品 API は `thumbnailKey` がある作品に `/api/works/{slug}/thumbnail` を返し、従来の `thumbnail` 値がある作品では従来値を返す。
- `thumbnailKey` が無い投稿済み作品は空サムネイル用プレースホルダーとホバー描画を維持する。バックフィルは行わない。
- 新規投稿成功時は詳細ページに移動し、公開範囲に応じてサムネイル取得 API が動く。

### 5. 確認項目

- 公開作品を投稿すると Gallery に静止サムネイルが表示され、カードのホバーでライブ描画に切り替わる。
- 非公開作品は投稿者の詳細ページだけでサムネイルが表示され、ログアウト状態・別アカウントでは作品／画像の両 API が 404 になる。
- GLSL コンパイルエラー、WebGL 非対応、画像エンコード失敗、S3 保存失敗で破損した画像や壊れた Gallery カードが残らない。
- 既存の `public/thumbs/*` と `thumbnail: ""` のレコードが引き続き表示できる。
- 画像サイズ上限、Content-Type、S3 の公開遮断、Lambda 権限、キャッシュヘッダーを確認する。
- デスクトップとタッチ端末でカード比率、画像の上下、色、欠落時の表示を確認する。
