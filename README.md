# shaders.art

GLSL を書いて動かせる実行環境と、寄贈された作品を展示する「博物館」。

- 単一の WebGL コンテキストで全作品を描く `ShaderPool` が中核
- 作品は `vec4 render(vec2 uv, vec2 p)` だけを提出する。`shaders/` に Pull Request で寄贈
- バックエンド無し。ビルド時に manifest を生成し、静的サイトとして配信

## 開発

```sh
pnpm install
pnpm dev
```

`pnpm verify`(型 + lint)が緑であることが完了条件。
