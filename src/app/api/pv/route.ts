import { getLocale } from "@/lib/i18n/server";
import { clientIp, isBot, monthlySalt, parsePageView, visitorId } from "@/lib/server/pageViews";

// POST /api/pv … アクセス解析(lib/server/pageViews)。ブラウザ(src/instrumentation-client.ts)が
// navigator.sendBeacon で { path, ref } を送ってくるので、CloudWatch Logs に "pv" の 1 行を出す。
// 記録できてもできなくても利用者には関係ないので、いつも 204 を返す。
export async function POST(request: Request) {
  try {
    const view = parsePageView(await request.text());
    const userAgent = request.headers.get("user-agent") ?? "";
    if (view && !isBot(userAgent)) {
      const salt = await monthlySalt(new Date());
      console.log(
        JSON.stringify({
          msg: "pv",
          path: view.path,
          // 参照元が無いときは項目ごと出さない(Logs Insights の ispresent(ref) で絞れるように)
          ...(view.ref ? { ref: view.ref } : {}),
          locale: await getLocale(),
          // スマートフォンかどうか(MDN の勧める「Mobi」で見分ける)。シェーダーの重さを考える材料にする
          device: /Mobi/i.test(userAgent) ? "mobile" : "desktop",
          visitor: visitorId(salt, clientIp(request.headers), userAgent),
        }),
      );
    }
  } catch (error) {
    console.error("pv", error);
  }
  return new Response(null, { status: 204 });
}
