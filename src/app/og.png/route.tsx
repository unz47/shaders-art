import { ImageResponse } from "next/og";

// /og.png … X・Discord・Slack などにリンクを貼ったときに出るカードの画像(1200×630)。
// ビルド時に 1 回だけ作って配る(force-static)。全ページで使う(lib/site の OG_IMAGE)。
// 作品ごとの画像は、シェーダーをサーバーで描けないので今は作らない。
// 文字は ImageResponse に入っている欧文フォントで描けるものだけにする(日本語のフォントを読み込まない)
export const dynamic = "force-static";

const ACCENT = "#9bdcf0";

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#070a12",
          color: "#e8ecf4",
          fontFamily: "sans-serif",
        }}
      >
        {/* 右: シェーダーの球(作品詳細のサンプルと同じ、上から光の当たった球) */}
        <div
          style={{
            position: "absolute",
            right: 90,
            top: 95,
            width: 440,
            height: 440,
            borderRadius: 9999,
            backgroundImage: "radial-gradient(circle at 34% 30%, #ffffff 0%, #c9d3e3 18%, #59647a 48%, #151a26 78%, #070a12 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 40,
            top: 45,
            width: 540,
            height: 540,
            borderRadius: 9999,
            backgroundImage: `radial-gradient(circle, rgba(155,220,240,0.16) 0%, rgba(155,220,240,0) 70%)`,
          }}
        />
        {/* 左: 名前と一言 */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 80px", width: 680 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div style={{ width: 44, height: 4, background: ACCENT }} />
            <div style={{ fontSize: 76, fontStyle: "italic", letterSpacing: -2 }}>shaders.art</div>
          </div>
          <div style={{ marginTop: 28, fontSize: 36, lineHeight: 1.35, color: "#c5cede" }}>
            Write GLSL in the browser. Watch it run. Share it.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 40, fontSize: 24, color: ACCENT, letterSpacing: 1 }}>
            <div>a museum of fragment shaders</div>
            <div>+ a free 30-lesson course from zero</div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
