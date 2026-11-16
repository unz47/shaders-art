import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { localizeCourse } from "@/lib/learn/localize";
import { CourseIndex } from "./CourseIndex";

// /learn … 学習のコースの目次。全 30 回を 4 部に分けて並べる。進み具合(終えた回)はこのブラウザに
// 覚えてあるので、印と「続きから」はブラウザの部品(CourseIndex)で出す。

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return { title: `${t.learn.metaTitle} — shaders.art`, description: t.learn.intro };
}

export default async function LearnPage() {
  const course = localizeCourse(await getLocale());
  return (
    <div className="flex min-h-dvh flex-col">
      <Header showSearch={false} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-sp-xl pt-10">
        <CourseIndex course={course} />
      </main>
      <Footer />
    </div>
  );
}
