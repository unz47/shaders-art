// 「AI と作る」で選べるモデル。/edit の AI パネル(ブラウザ)、Route Handler(サーバー)、
// infra(Lambda に呼び出しを許すモデルの一覧)で共有する。どれも Amazon Bedrock(東京)の
// Converse API で呼ぶ(lib/server/ai.ts)。ここに無いモデルはサーバーが受け付けない。
// infra から Node の型の取り除き(strip-types)で読むので、import を持たない素の TypeScript にしておく。
//
// 候補は 2026-10 に同じ依頼(リングを 2 重に・夕焼け色に)を 1 回ずつ送って選んだ。
// GLM 4.7 は 150 秒待っても返らず、DeepSeek V3.2 は 13 秒かかったので外した。

export interface AiModel {
  /** Bedrock のモデル ID */
  id: string;
  label: string;
  maker: string;
  /** 選ぶときの一言 */
  note: string;
  /** 東京リージョンのオンデマンド料金(100 万トークンあたり USD、2026-10 時点) */
  price: { input: number; output: number };
}

export const AI_MODELS: readonly AiModel[] = [
  {
    id: "qwen.qwen3-coder-480b-a35b-v1:0",
    label: "Qwen3 Coder 480B",
    maker: "Qwen",
    note: "標準。コード向けで速い",
    price: { input: 0.54, output: 2.18 },
  },
  {
    id: "qwen.qwen3-coder-30b-a3b-v1:0",
    label: "Qwen3 Coder 30B",
    maker: "Qwen",
    note: "いちばん速くて安い。小さな直しに",
    price: { input: 0.18, output: 0.73 },
  },
  {
    id: "openai.gpt-oss-120b-1:0",
    label: "gpt-oss-120b",
    maker: "OpenAI",
    note: "考えてから答える。安い",
    price: { input: 0.18, output: 0.73 },
  },
  {
    id: "minimax.minimax-m2.5",
    label: "MiniMax M2.5",
    maker: "MiniMax",
    note: "考えてから答える",
    price: { input: 0.36, output: 1.44 },
  },
  {
    id: "mistral.devstral-2-123b",
    label: "Devstral 2",
    maker: "Mistral AI",
    note: "コード向け",
    price: { input: 0.48, output: 2.4 },
  },
  {
    id: "moonshotai.kimi-k2.5",
    label: "Kimi K2.5",
    maker: "Moonshot AI",
    note: "大きなモデル。少し高い",
    price: { input: 0.72, output: 3.6 },
  },
];

/** 何も選んでいないときのモデル */
export const DEFAULT_AI_MODEL_ID = "qwen.qwen3-coder-480b-a35b-v1:0";

export function findAiModel(id: string | null | undefined): AiModel | undefined {
  return AI_MODELS.find((model) => model.id === id);
}

/** 料金の目安を $・$$・$$$ の 3 段階で(出力の料金で決める。返答のほうがずっと長いため) */
export function priceTier(model: AiModel): 1 | 2 | 3 {
  if (model.price.output < 1) return 1;
  if (model.price.output < 3) return 2;
  return 3;
}
