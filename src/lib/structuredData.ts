import type { Dictionary, Locale } from "@/lib/i18n";
import { plainText } from "@/lib/learn/describe";
import type { CourseOutline, LocalizedLesson } from "@/lib/learn/localize";
import { absoluteUrl, SITE_NAME, SITE_URL } from "@/lib/site";
import { findLicense, licenseUrl } from "@/lib/submission";
import type { Work } from "@/lib/works";

// 構造化データ(schema.org)。components/JsonLd でページに埋める。
//   トップ   … WebSite(サイト内検索の入口つき)
//   /learn   … Course(無料・オンライン・初心者向け)と、30 回分の LearningResource
//   各回     … LearningResource(Course の一部)とパンくず
//   作品     … SoftwareSourceCode(GLSL)とパンくず

const CONTEXT = "https://schema.org";

const PUBLISHER = { "@type": "Organization", name: SITE_NAME, url: SITE_URL } as const;

function course(locale: Locale, t: Dictionary) {
  return { "@type": "Course", name: t.learn.title, url: absoluteUrl(locale, "/learn"), provider: PUBLISHER } as const;
}

function breadcrumbs(items: { name: string; url: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({ "@type": "ListItem", position: i + 1, name: item.name, item: item.url })),
  };
}

/** ISO 8601 の時間(PT55M・PT26H など) */
function duration(minutes: number): string {
  return minutes % 60 === 0 ? `PT${minutes / 60}H` : `PT${minutes}M`;
}

export function websiteData(locale: Locale, t: Dictionary) {
  return {
    "@context": CONTEXT,
    "@type": "WebSite",
    name: SITE_NAME,
    url: absoluteUrl(locale, "/"),
    inLanguage: locale,
    description: t.meta.description,
    publisher: PUBLISHER,
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${absoluteUrl(locale, "/works")}?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

export function courseData(locale: Locale, t: Dictionary, outline: CourseOutline) {
  const lessons = outline.parts.flatMap((part) => part.lessons);
  const hours = Math.round(outline.minutes / 60);
  return {
    "@context": CONTEXT,
    ...course(locale, t),
    description: t.learn.intro,
    inLanguage: locale,
    isAccessibleForFree: true,
    educationalLevel: "Beginner",
    teaches: outline.parts.map((part) => part.title),
    timeRequired: duration(hours * 60),
    offers: { "@type": "Offer", category: "Free", price: 0, priceCurrency: "USD" },
    hasCourseInstance: { "@type": "CourseInstance", courseMode: "Online", courseWorkload: duration(hours * 60) },
    hasPart: lessons.map((lesson) => ({
      "@type": "LearningResource",
      position: lesson.number,
      name: lesson.title,
      description: lesson.summary,
      url: absoluteUrl(locale, `/learn/${lesson.slug}`),
      timeRequired: duration(lesson.minutes),
    })),
  };
}

export function lessonData(locale: Locale, t: Dictionary, lesson: LocalizedLesson, description: string) {
  const url = absoluteUrl(locale, `/learn/${lesson.slug}`);
  return {
    "@context": CONTEXT,
    "@graph": [
      {
        "@type": "LearningResource",
        name: lesson.title,
        description,
        url,
        inLanguage: locale,
        learningResourceType: "Lesson",
        educationalLevel: "Beginner",
        isAccessibleForFree: true,
        position: lesson.number,
        timeRequired: duration(lesson.minutes),
        teaches: lesson.goals.map(plainText),
        isPartOf: course(locale, t),
        publisher: PUBLISHER,
      },
      breadcrumbs([
        { name: SITE_NAME, url: absoluteUrl(locale, "/") },
        { name: "Learn", url: absoluteUrl(locale, "/learn") },
        { name: lesson.title, url },
      ]),
    ],
  };
}

export function workData(locale: Locale, work: Pick<Work, "slug" | "title" | "author" | "createdAt" | "description" | "source" | "license" | "tags">) {
  const url = absoluteUrl(locale, `/s/${work.slug}`);
  const license = findLicense(work.license);
  return {
    "@context": CONTEXT,
    "@graph": [
      {
        "@type": "SoftwareSourceCode",
        name: work.title,
        ...(work.description ? { description: work.description } : {}),
        url,
        author: { "@type": "Person", name: work.author },
        dateCreated: work.createdAt,
        programmingLanguage: "GLSL",
        runtimePlatform: "WebGL",
        ...(work.tags.length > 0 ? { keywords: work.tags.join(", ") } : {}),
        // 標準のライセンス(利用規約の #license)は、そのページの言語の利用規約を指す
        ...(license
          ? { license: license.url.startsWith("/") ? absoluteUrl(locale, license.url) : licenseUrl(license, locale) }
          : {}),
        text: work.source,
        isPartOf: { "@type": "WebSite", name: SITE_NAME, url: absoluteUrl(locale, "/") },
      },
      breadcrumbs([
        { name: SITE_NAME, url: absoluteUrl(locale, "/") },
        { name: work.title, url },
      ]),
    ],
  };
}
