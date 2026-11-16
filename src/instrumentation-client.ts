// アクセス解析(issue #43)。ページを開いたときと、ページを移ったとき(App Router の遷移)に、
// パスと参照元のドメインだけを POST /api/pv に送る(数え方は lib/server/pageViews)。
// Cookie も端末に残す ID も使わない。クエリ(検索語など)と # の後ろ(/stage の下書きのコード)は送らない。
// ブラウザで「追跡しない」(Global Privacy Control / Do Not Track)を選んでいる人と、モックのときは送らない。

const enabled =
  process.env.NEXT_PUBLIC_API_MOCK !== "1" &&
  (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl !== true &&
  navigator.doNotTrack !== "1";

// 同じページの中でクエリだけが変わったとき(/works の検索やページ送り)は数えない
let lastPath: string | null = null;

function sendPageView(path: string, ref: string | null) {
  if (!enabled || path === lastPath) return;
  lastPath = path;
  navigator.sendBeacon("/api/pv", JSON.stringify({ path, ref }));
}

/** よそのサイトから来たときだけ、そのサイトのドメイン */
function externalReferrer(): string | null {
  if (!document.referrer) return null;
  const { host } = new URL(document.referrer);
  return host === location.host ? null : host;
}

try {
  sendPageView(location.pathname, externalReferrer());
} catch {
  // 記録できなくてもページは動かす
}

export function onRouterTransitionStart(url: string) {
  sendPageView(new URL(url, location.href).pathname, null);
}
