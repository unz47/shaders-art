"use client";

import { useEffect, useState } from "react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Pagination } from "@/components/Pagination";
import { WorkCard } from "@/components/WorkCard";
import { getWorks, type WorkSummary } from "@/lib/works";

export default function Home() {
  const [works, setWorks] = useState<WorkSummary[]>([]);

  useEffect(() => {
    getWorks("collection").then((items) => setWorks(items));
  }, []);

  return (
    <>
      <Header />
      <main className="grid grid-cols-1 gap-sp-lg px-sp-xl pb-sp-md pt-8 sm:grid-cols-2 lg:grid-cols-3">
        {works.map((work) => (
          <WorkCard key={work.slug} work={work} />
        ))}
      </main>
      <Pagination itemCount={works.length} />
      <Footer />
    </>
  );
}
