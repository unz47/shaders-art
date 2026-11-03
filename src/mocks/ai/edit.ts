import { delay, http, HttpResponse } from "msw";
import { encodeSseEvent, validateAiEditRequest, type AiEditEvent } from "@/lib/aiEdit";
import { DEFAULT_AI_MODEL_ID } from "@/lib/aiModels";
import { sourceErrors } from "@/lib/submission";

// POST /api/ai/edit
// Bedrock を呼ばずに、本物と同じ形(SSE)で返す。提案は依頼文を先頭にコメントとして足すだけ。
// 「解説」「説明」「教えて」を含む依頼には、コードの提案なしで答える(質問への回答の確認用)。
export const aiEdit = http.post("/api/ai/edit", async ({ request }) => {
  const parsed = validateAiEditRequest(await request.json().catch(() => null));
  if (!parsed.ok) {
    return HttpResponse.json({ message: "依頼の内容に問題があります", errors: parsed.errors }, { status: 400 });
  }
  const { source, prompt, model } = parsed.value;
  const question = /解説|説明|教えて/.test(prompt);
  const proposed = question ? null : `// ${prompt.replace(/\s+/g, " ")}\n${source}`;
  const reply = question
    ? "モックの回答です。render は画素ごとに呼ばれ、uv と p から色を返します。"
    : "モックの提案です。依頼文をコメントとして先頭に足しました。";

  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: AiEditEvent) => controller.enqueue(encoder.encode(encodeSseEvent(event)));
      await delay(400); // 考えている時間のつもり
      for (let i = 0; i < reply.length; i += 4) {
        send({ type: "text", text: reply.slice(i, i + 4) });
        await delay(40);
      }
      send({
        type: "done",
        reply,
        source: proposed,
        errors: proposed === null ? [] : sourceErrors(proposed),
        model: model ?? DEFAULT_AI_MODEL_ID,
        usage: { inputTokens: 700 + source.length, outputTokens: 400 },
      });
      controller.close();
    },
  });
  return new HttpResponse(body, { headers: { "Content-Type": "text/event-stream; charset=utf-8" } });
});
