import { type Locale } from "@/lib/i18n";
import { plainText } from "@/lib/learn/describe";
import { localizeCourse } from "@/lib/learn/localize";
import { absoluteUrl, SITE_NAME } from "@/lib/site";

// /llms.txt … AI(ChatGPT・Claude・Perplexity など)に、このサイトが何で、どこに何があるかを渡す目次(llmstxt.org の書き方)。
// 学習の全 30 回は英語と日本語の両方を並べる。中身はコースのデータ(lib/learn)から作るので、回を足せばここにも出る。
// ビルド時に 1 回だけ作る。
export const dynamic = "force-static";

function courseSection(locale: Locale): string {
  const course = localizeCourse(locale);
  return course.parts
    .map((part, i) => {
      const heading = locale === "ja" ? `### 第 ${i + 1} 部 ${part.title}` : `### Part ${i + 1}: ${part.title}`;
      const lessons = part.lessons.map((lesson) => {
        const minutes = locale === "ja" ? `${lesson.minutes} 分` : `${lesson.minutes} min`;
        return `- [${lesson.number}. ${lesson.title}](${absoluteUrl(locale, `/learn/${lesson.slug}`)}): ${plainText(lesson.summary)} (${minutes})`;
      });
      return [heading, plainText(part.description), "", ...lessons].join("\n");
    })
    .join("\n\n");
}

export function GET() {
  const en = localizeCourse("en");
  const hours = Math.round(en.minutes / 60);
  const body = `# ${SITE_NAME}

> ${SITE_NAME} is a gallery of GLSL fragment shaders that run live in the browser, with an editor for writing and publishing your own, and a free ${en.total}-lesson course (about ${hours} hours) that teaches shader programming from zero. No programming experience is needed, and viewing and learning need no sign-in. The site is in English and Japanese; Japanese pages live under /ja.

A work on ${SITE_NAME} is a single GLSL ES function, \`vec4 render(vec2 uv, vec2 p)\`. \`uv\` runs from (0, 0) at the bottom left to (1, 1) at the top right; \`p\` is centered on the screen, runs from -1 to 1 vertically, and is stretched horizontally to match the aspect ratio. The uniforms \`time\` (seconds), \`resolution\` (pixels) and \`mouse\` (in the same space as \`p\`) are declared by the site, and the site writes \`main\`.

## Learn shaders from zero (free course)

- [Course contents](${absoluteUrl("en", "/learn")}): ${en.total} lessons in ${en.parts.length} parts, about ${hours} hours. Every lesson has live code you can edit and exercises with hints and solutions; progress is saved in the browser.

${courseSection("en")}

## Gallery and editor

- [Gallery](${absoluteUrl("en", "/")}): today's pick, the most favorited works, and the newest works
- [All works](${absoluteUrl("en", "/works")}): every published work; sort by newest, most favorited, or shortest code, and search by title, author, tag, or description
- [Editor](${absoluteUrl("en", "/edit")}): write a shader, watch it run as you type, check its size and speed, and publish it

## 日本語: シェーダーを 0 から学ぶ(無料の講座)

- [コースの目次](${absoluteUrl("ja", "/learn")}): 全 ${en.total} 回、およそ ${hours} 時間。どの回も、書き換えるとその場で動くコードと、ヒントと見本つきの課題があります。

${courseSection("ja")}

## Optional

- [Terms of Service](${absoluteUrl("en", "/terms")})
- [Privacy Policy](${absoluteUrl("en", "/privacy")})
- [ギャラリー(日本語)](${absoluteUrl("ja", "/")})
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
