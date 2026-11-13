import { randomBytes } from "node:crypto";
import { ConditionalCheckFailedException } from "@aws-sdk/client-dynamodb";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { NextResponse, type NextRequest } from "next/server";
import { getDictionary } from "@/lib/i18n/server";
import { db, scanAllWorks, tableName, toPublicWork } from "@/lib/server/db";
import { getSession, isSameOriginRequest } from "@/lib/server/session";
import { slugify, validateSubmission } from "@/lib/submission";
import { parsePage, parseQuery, parseSort, queryWorks } from "@/lib/worksQuery";

// GET  /api/works?sort=new|popular|short&page=N&q=検索語 → { items, page, pageCount, total }
//      公開作品を(q があれば絞り込んで)並べて 24 件ずつ返す(lib/worksQuery)。一覧もホバー再生用に source を含む
// POST /api/works(要ログイン)→ 201 { slug }
// infra/functions/works.ts(API Gateway + Lambda版)から移植し、SSR と同じ Lambda で動かしている。

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const result = queryWorks(await scanAllWorks(), {
    sort: parseSort(params.get("sort")),
    page: parsePage(params.get("page")),
    q: parseQuery(params.get("q")),
  });
  return NextResponse.json({ ...result, items: result.items.map(toPublicWork) });
}

// 公開作品は詳細 URL と Gallery から閲覧できる。収蔵フラグは運営向けメタデータとして残す。
// 非公開作品は投稿者の認証済み authorId を照合し、一覧にも含めない。
export async function POST(request: NextRequest) {
  const t = await getDictionary();
  if (!isSameOriginRequest(request)) return NextResponse.json({ message: "forbidden" }, { status: 403 });
  // JSON 以外を受けない = 他サイトのフォームからの単純 POST を通さない
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return NextResponse.json({ message: t.api.jsonOnly }, { status: 415 });
  }

  const session = await getSession();
  if (!session) return NextResponse.json({ message: t.api.loginToPost }, { status: 401 });

  const body: unknown = await request.json().catch(() => null);
  const result = validateSubmission(body, t.submission);
  if (!result.ok) return NextResponse.json({ message: t.api.badSubmission, errors: result.errors }, { status: 400 });

  const submission = result.value;
  const base = slugify(submission.title);

  // slug は「タイトル由来 + ランダム 6 文字」。万一衝突したら作り直す(上書きはしない)
  for (let attempt = 0; attempt < 3; attempt++) {
    const slug = `${base}-${randomBytes(4).toString("hex").slice(0, 6)}`;
    try {
      await db.send(
        new PutCommand({
          TableName: tableName(),
          Item: {
            slug,
            title: submission.title,
            author: submission.author,
            authorId: session.sub,
            visibility: submission.visibility,
            bytes: submission.bytes,
            license: submission.license,
            // 静止サムネはまだ作っていない(詳細ページはライブ描画なので不要)
            thumbnail: "",
            collected: false,
            createdAt: new Date().toISOString(),
            description: submission.description,
            tags: submission.tags,
            source: submission.source,
          },
          ConditionExpression: "attribute_not_exists(slug)",
        }),
      );
      return NextResponse.json({ slug }, { status: 201 });
    } catch (error) {
      if (error instanceof ConditionalCheckFailedException) continue;
      throw error;
    }
  }
  return NextResponse.json({ message: t.api.postUnavailable }, { status: 503 });
}
