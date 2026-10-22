// 「AI と作る」で選べるモデル。/edit の AI パネル(ブラウザ)、Route Handler(サーバー)、
// infra(Lambda に呼び出しを許すモデルの一覧)で共有する。ここに無いモデルはサーバーが受け付けない。
// infra から Node の型の取り除き(strip-types)で読むので、import を持たない素の TypeScript にしておく。
// 呼び方は 2 通り(lib/server/ai.ts):
//   bedrock … Amazon Bedrock(東京)の Converse API。コードは返答中の ```glsl ブロックで受け取る
//   claude  … Claude Platform on AWS(Anthropic が運営し、請求は AWS)の Messages API。
//             ワークスペースを作って ANTHROPIC_AWS_WORKSPACE_ID を設定するまでは選べない
//             (このアカウントでは Bedrock の Claude が使えない制限があるため、こちらで呼ぶ)
//
// Bedrock の候補は 2026-10 に同じ依頼(リングを 2 重に・夕焼け色に)を 1 回ずつ送って選んだ。
// GLM 4.7 は 150 秒待っても返らず、DeepSeek V3.2 は 13 秒かかったので外した。

export interface AiModel {
  /** モデル ID(Bedrock の ID か、Claude Platform on AWS の ID) */
  id: string;
  label: string;
  maker: string;
  /** 選ぶときの一言 */
  note: string;
  /** オンデマンド料金(100 万トークンあたり USD、2026-10 時点。Bedrock は東京リージョン) */
  price: { input: number; output: number };
  via: "bedrock" | "claude";
}

export const AI_MODELS: readonly AiModel[] = [
  {
    id: "qwen.qwen3-coder-480b-a35b-v1:0",
    label: "Qwen3 Coder 480B",
    maker: "Qwen",
    note: "標準。コード向けで速い",
    price: { input: 0.54, output: 2.18 },
    via: "bedrock",
  },
  {
    id: "qwen.qwen3-coder-30b-a3b-v1:0",
    label: "Qwen3 Coder 30B",
    maker: "Qwen",
    note: "いちばん速くて安い。小さな直しに",
    price: { input: 0.18, output: 0.73 },
    via: "bedrock",
  },
  {
    id: "openai.gpt-oss-120b-1:0",
    label: "gpt-oss-120b",
    maker: "OpenAI",
    note: "考えてから答える。安い",
    price: { input: 0.18, output: 0.73 },
    via: "bedrock",
  },
  {
    id: "minimax.minimax-m2.5",
    label: "MiniMax M2.5",
    maker: "MiniMax",
    note: "考えてから答える",
    price: { input: 0.36, output: 1.44 },
    via: "bedrock",
  },
  {
    id: "mistral.devstral-2-123b",
    label: "Devstral 2",
    maker: "Mistral AI",
    note: "コード向け",
    price: { input: 0.48, output: 2.4 },
    via: "bedrock",
  },
  {
    id: "moonshotai.kimi-k2.5",
    label: "Kimi K2.5",
    maker: "Moonshot AI",
    note: "大きなモデル。少し高い",
    price: { input: 0.72, output: 3.6 },
    via: "bedrock",
  },
  {
    id: "claude-haiku-5-5",
    label: "Claude Haiku 5.5",
    maker: "Anthropic",
    note: "速くて安い",
    price: { input: 0.1, output: 0.5 },
    via: "claude",
  },
  {
    id: "claude-sonnet-5-5",
    label: "Claude Sonnet 5.5",
    maker: "Anthropic",
    note: "賢さと速さのバランス",
    price: { input: 2, output: 10 },
    via: "claude",
  },
  {
    id: "claude-opus-5-5",
    label: "Claude Opus 5.5",
    maker: "Anthropic",
    note: "いちばん賢い。高い",
    price: { input: 4, output: 20 },
    via: "claude",
  },
];

/** 何も選んでいないときのモデル */
export const DEFAULT_AI_MODEL_ID = "qwen.qwen3-coder-480b-a35b-v1:0";

export function findAiModel(id: string | null | undefined): AiModel | undefined {
  return AI_MODELS.find((model) => model.id === id);
}

/** 料金の目安を $〜$$$$ の 4 段階で(出力の料金で決める。返答のほうがずっと長いため) */
export function priceTier(model: AiModel): 1 | 2 | 3 | 4 {
  if (model.price.output < 1) return 1;
  if (model.price.output < 3) return 2;
  if (model.price.output < 15) return 3;
  return 4;
}
