import { getAiLimits } from "./aiUsage";
import { getViewerBilling } from "./billing";
import { getSessionWithoutRefresh } from "./session";

// Server Component から「いま見ている人が Pro か」を知る(Learn の Pro の回)。
// クッキーを書き換えられないので、ID トークンの期限が切れている人はここでは Pro と分からない。
// その人には ProRecheck(ブラウザ)が API を通してクッキーを新しくし、Pro なら描き直す。
// 課金の記録を読めないとき(DynamoDB の障害など)は Pro でないとして扱い、案内を出す(本文は出さない)。
export async function viewerHasPro(): Promise<boolean> {
  const session = await getSessionWithoutRefresh();
  if (!session) return false;
  try {
    return (await getViewerBilling(session, getAiLimits().unlimitedEmails)).plan === "pro";
  } catch (error) {
    console.error("[viewer] billing", error);
    return false;
  }
}
