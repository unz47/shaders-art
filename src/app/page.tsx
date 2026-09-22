import { Header } from "@/components/Header";
import { WorkCard, type Work } from "@/components/WorkCard";

// Step 1: ここに 6 件ぶんの仮データを書く
const works: Work[] = [
  { slug: "plasma", title: "Plasma", author: "tomoya", bytes: 216, license: "CC0-1.0" },
  { slug: "frost-rings", title: "Frost Rings", author: "tomoya", bytes: 330, license: "CC0-1.0" },
  { slug: "voronoi", title: "Voronoi Snow", author: "tomoya", bytes: 526, license: "CC0-1.0" },
  { slug: "tunnel", title: "Silver Tunnel", author: "tomoya", bytes: 373, license: "CC0-1.0" },
  { slug: "clouds", title: "Snow Clouds", author: "tomoya", bytes: 555, license: "CC0-1.0" },
  { slug: "tiny", title: "Tiny", author: "tomoya", bytes: 81, license: "CC0-1.0" },
];

export default function Home() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-[1440px] px-sp-md py-sp-lg grid grid-cols-1 gap-sp-lg sm:grid-cols-2 lg:grid-cols-3">
        {works.map((work) => (
          <WorkCard key={work.slug} work={work} />
        ))}
      </main>
    </>
  );
}
