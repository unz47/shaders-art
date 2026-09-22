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
    <main className="mx-auto max-w-[1440px] px-sp-md py-sp-lg">
      {/* Step 1: ここで works.map(...) して WorkCard を並べる */}
      {works.map((work) => (
        <WorkCard key={work.slug} work={work} />
      ))}
    </main>
  );
}
