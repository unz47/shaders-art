import { NextResponse } from "next/server";
import { availableModels, getAiConfig } from "@/lib/server/ai";

// GET /api/ai/models → { models: string[] }
// いま選べるモデルの ID(lib/aiModels の一覧のうち、設定が済んでいるもの)。AI が設定されていなければ空。
// /edit の AI パネルがメニューに出すモデルを決めるのに使う。設定はデプロイで変わるので、キャッシュさせない。
export async function GET() {
  const cfg = getAiConfig();
  return NextResponse.json(
    { models: cfg ? availableModels(cfg).map((model) => model.id) : [] },
    { headers: { "Cache-Control": "no-store" } },
  );
}
