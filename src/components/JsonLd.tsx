// 構造化データ(schema.org の JSON-LD)をページに埋める。検索エンジンや AI が、ページが何か(講座・作品など)を
// 読み取れるようにする。中身は lib/structuredData で作る。
// JSON の中の < を逃がして、作品名などに </script> が入っていてもスクリプトの外に出ないようにする(Next のドキュメントのとおり)
export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
