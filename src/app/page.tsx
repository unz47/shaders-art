"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { WorkCard } from "@/components/WorkCard";
import { getWorks, type WorkSummary } from "@/lib/works";
import { worksHref } from "@/lib/worksQuery";

export default function Home() {
  const [works, setWorks] = useState<WorkSummary[]>([]);

  useEffect(() => {
    getWorks({ sort: "new", page: 1 }).then(({ items }) => setWorks(items));
  }, []);

  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="grid flex-1 grid-cols-1 content-start gap-x-sp-lg gap-y-8 px-sp-xl pb-sp-md pt-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {works.map((work) => (
          <WorkCard key={work.slug} work={work} />
        ))}
      </main>
      <div className="flex justify-center px-sp-xl pt-12">
        <Link href={worksHref({ sort: "new" })} className="text-sm text-text-secondary hover:text-text-primary">
          すべての作品を見る →
        </Link>
      </div>
      <Footer />
    </div>
  );
}
