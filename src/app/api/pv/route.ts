import { DEFAULT_LOCALE, splitLocalePath } from "@/lib/i18n/locale";
import { clientIp, isBot, monthlySalt, parsePageView, visitorId } from "@/lib/server/pageViews";

// POST /api/pv … アクセス解析(lib/server/pageViews)。ブラウザ(src/instrumentation-client.ts)が
// navigator.sendBeacon で { path, ref, src } を送ってくるので、CloudWatch Logs に "pv" の 1 行を出す。
// 記録できてもできなくても利用者には関係ないので、いつも 204 を返す。
// 日本語のページ(/ja/…)は、path には頭の /ja を外して入れ、言語は locale に分ける(ページごとの集計で 2 つの言語をまとめられるように)
export async function POST(request: Request) {
  try {
    const view = parsePageView(await request.text());
    const userAgent = request.headers.get("user-agent") ?? "";
    if (view && !isBot(userAgent)) {
      const { locale, path } = splitLocalePath(view.path);
      const salt = await monthlySalt(new Date());
      console.log(
        JSON.stringify({
          msg: "pv",
          path,
          // 参照元が無いときは項目ごと出さない(Logs Insights の ispresent(ref) で絞れるように)
          ...(view.ref ? { ref: view.ref } : {}),
          ...(view.src ? { src: view.src } : {}),
          // 見ていたページの言語(URL で決まる。lib/i18n/locale)
          locale: locale ?? DEFAULT_LOCALE,
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
