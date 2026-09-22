"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { WorkCard } from "@/components/WorkCard";
import { getWorks, type Work } from "@/lib/works";

export default function Home() {
  const [works, setWorks] = useState<Work[]>([]);

  useEffect(() => {
    getWorks("collection").then((items) => setWorks(items));
  }, []);

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
