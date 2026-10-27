import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { findLicense } from "@/lib/submission";

// /terms … 利用規約。作品のライセンス(#license)は YouTube と同じ考え方で、既定の「shaders.art 標準」は
// 著作権を作者に残し、ほかの人にはサイトの機能の中での利用だけを許す(lib/submission の LICENSES)。
// 投稿ダイアログと作品ページの License から #license に飛んでくる。
// 権利に関わる文書なので、本番で公開する前に専門家に確認してもらうこと(Notion の未解決の課題にも記載)。
// 文の途中で改行すると JSX が半角スペースを入れるので、日本語の文は 1 行に書く。
export const metadata: Metadata = {
  title: "利用規約 — shaders.art",
};

const UPDATED = "2026 年 10 月 24 日";

export default function TermsPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header showSearch={false} />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-10 px-sp-xl pt-10">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-medium text-text-primary">利用規約</h1>
          <p className="font-mono text-xs text-text-muted">最終更新: {UPDATED}</p>
          <P>
            この利用規約(以下「本規約」)は、shaders.art(以下「本サービス」)の利用条件を定めるものです。本サービスを利用する方(以下「利用者」)は、本規約に同意したものとみなします。
          </P>
        </div>

        <Section title="1. 本サービスについて">
          <P>
            本サービスは、GLSL のシェーダー作品を書いて動かし、投稿・展示できるサービスです。作品はログインせずに閲覧できます。作品の投稿、お気に入り、AI と作るの利用にはログインが必要です。
          </P>
        </Section>

        <Section title="2. アカウント">
          <List>
            <li>利用者は、自分のアカウントを自分の責任で管理します。</li>
            <li>作品に表示する作者名は自己申告です。他人になりすました作者名は使えません。</li>
          </List>
        </Section>

        <Section title="3. 投稿する作品">
          <List>
            <li>
              利用者は、自分が作った作品か、投稿する権利を持っている作品だけを投稿できます。ほかの人の作品をもとにする場合は、元の作品のライセンスに従ってください。
            </li>
            <li>
              運営者は、本規約に反する作品や、ほかの人の権利を侵害するおそれのある作品を、予告なく非公開にしたり削除したりできます。
            </li>
          </List>
        </Section>

        <Section id="license" title="4. 作品のライセンス">
          <H3>4.1 著作権</H3>
          <P>投稿された作品の著作権は作者に残ります。本サービスに投稿しても、運営者に著作権が移ることはありません。</P>

          <H3>4.2 運営者への許諾</H3>
          <P>
            作者は運営者に対して、本サービスを提供・改善・紹介するために必要な範囲で、作品を保存・複製・表示・配信し、作品から静止画や動画(サムネイルなど)を作ることを、無償で許諾します。この許諾は、どのライセンスの作品にも適用されます。
          </P>

          <H3 id="standard">4.3 shaders.art 標準</H3>
          <P>
            投稿するときの既定のライセンスです。「shaders.art 標準」の作品について、作者はほかの利用者に対して、本サービスの機能を通じた次の利用を無償で許諾します。
          </P>
          <List>
            <li>本サービス上で作品を見ること</li>
            <li>
              作品ページの「配信・埋め込み」の機能を通じて、配信の背景・壁紙・Web ページへの埋め込みとして作品を表示すること(収益化している配信やサイトでの表示を含みます)
            </li>
            <li>
              本サービスのリミックスの機能を使って、作品をもとにした新しい作品を作り、本サービスに投稿すること。リミックスには元の作品の作者とタイトルが表示され、リミックスも「shaders.art 標準」になります
            </li>
          </List>
          <P>
            本サービスの外で作品のコードを複製・改変・配布・販売するには、作者の許可が必要です。ただし、著作権法で認められた範囲の利用(個人的に手元で動かして学ぶことなど)は妨げません。
          </P>

          <H3>4.4 {findLicense("CC-BY-4.0")?.label}</H3>
          <P>
            「CC BY 4.0」の作品は、
            <ExternalLink href={findLicense("CC-BY-4.0")?.url}>クリエイティブ・コモンズ 表示 4.0 国際 ライセンス</ExternalLink>
            のもとで、本サービスの外も含めて誰でも利用できます。利用する人は、作者名とライセンスを表示します。このライセンスは、あとから取り消せません。
          </P>

          <H3>4.5 以前に選べたライセンス</H3>
          <P>
            以前は <ExternalLink href={findLicense("CC0-1.0")?.url}>CC0 1.0</ExternalLink> と{" "}
            <ExternalLink href={findLicense("CC-BY-NC-SA-4.0")?.url}>CC BY-NC-SA 4.0</ExternalLink>{" "}
            も選べました。これらの作品は、それぞれのライセンスの条件で利用できます。
          </P>

          <H3>4.6 作品を非公開にしたり削除したりしたとき</H3>
          <P>
            作品を非公開にしたり削除したりすると、それ以降、ほかの利用者は本サービスの機能を通じてその作品を利用できなくなります。すでに作られたリミックスや、CC BY などのライセンスのもとですでに受け取られた複製は、その時点のライセンスの条件で残ります。
          </P>
        </Section>

        <Section title="5. 禁止事項">
          <List>
            <li>法令や公序良俗に反する行為</li>
            <li>ほかの人の権利(著作権、肖像権など)を侵害する行為</li>
            <li>本サービスや利用者の端末に過度な負荷をかける作品の投稿や、本サービスへの過度なアクセス</li>
            <li>不正なアクセスや、ほかの人のアカウントの利用</li>
            <li>そのほか、本サービスの運営を妨げる行為</li>
          </List>
        </Section>

        <Section title="6. AI と作る">
          <List>
            <li>AI の提案は誤りを含むことがあります。提案を適用するかどうかは利用者が判断します。</li>
            <li>依頼の内容と作品のコードは、提案を作るために AI の提供元(Amazon Web Services など)に送られます。</li>
          </List>
        </Section>

        <Section title="7. 免責">
          <List>
            <li>
              本サービスは現状のまま提供されます。運営者は、本サービスが中断せずに動くことや、作品が特定の目的に合うことを保証しません。
            </li>
            <li>運営者は、本サービスの内容を変えたり、提供を止めたりすることがあります。</li>
          </List>
        </Section>

        <Section title="8. 本規約の変更">
          <P>運営者は、必要に応じて本規約を変更できます。変更後の本規約は、本サービス上に掲載した時点から効力を持ちます。</P>
        </Section>

        <Section title="9. 準拠法">
          <P>本規約は日本法に従って解釈します。</P>
        </Section>

        <p className="text-sm text-text-secondary">
          <Link href="/" className="underline underline-offset-2 hover:text-text-primary">
            Gallery に戻る
          </Link>
        </p>
      </main>
      <Footer />
    </div>
  );
}

// 固定ヘッダー(高さ 64px)の下に見出しが隠れないよう、#license などで飛んだときに余白を取る
function Section({ id, title, children }: { id?: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="flex scroll-mt-24 flex-col gap-3">
      <h2 className="text-lg font-medium text-text-primary">{title}</h2>
      {children}
    </section>
  );
}

function H3({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <h3 id={id} className="mt-2 scroll-mt-24 text-sm font-medium text-text-primary">
      {children}
    </h3>
  );
}

function P({ children }: { children: ReactNode }) {
  return <p className="text-sm leading-7 text-text-secondary">{children}</p>;
}

function List({ children }: { children: ReactNode }) {
  return <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm leading-7 text-text-secondary">{children}</ul>;
}

function ExternalLink({ href, children }: { href: string | undefined; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener" className="underline underline-offset-2 hover:text-text-primary">
      {children}
    </a>
  );
}
