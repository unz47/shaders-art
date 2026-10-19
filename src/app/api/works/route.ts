import { randomBytes } from "node:crypto";
import { ConditionalCheckFailedException } from "@aws-sdk/client-dynamodb";
import { PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { NextResponse, type NextRequest } from "next/server";
import type { Work } from "@/lib/works";
import { db, tableName, toPublicWork } from "@/lib/server/db";
import { getSession, isSameOriginRequest } from "@/lib/server/session";
import { slugify, validateSubmission } from "@/lib/submission";

// GET  /api/works?tab=collection|new → { items: Work[] }(一覧もホバー再生用に source を含む)
// POST /api/works(要ログイン)→ 201 { slug }
// infra/functions/works.ts(API Gateway + Lambda版)から移植し、SSR と同じ Lambda で動かしている。

export async function GET(request: NextRequest) {
  const tab = request.nextUrl.searchParams.get("tab") ?? "collection";
  // 件数が少ないうちは Scan で十分。増えてきたら GSI を足して Query に切り替える
  const { Items } = await db.send(new ScanCommand({ TableName: tableName() }));
  const works = (Items ?? []) as Work[];

  const filtered = tab === "collection" ? works.filter((w) => w.collected) : works;
  const items = [...filtered].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(toPublicWork);

  return NextResponse.json({ items });
}

// 投稿は即時公開(collected: false)。収蔵は運営が後から行う。
// 未収蔵作品は ShaderPool に入れない方針なので、Home(Collection)には出ない。
export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ message: "forbidden" }, { status: 403 });
  // JSON 以外を受けない = 他サイトのフォームからの単純 POST を通さない
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return NextResponse.json({ message: "Content-Type は application/json にしてください" }, { status: 415 });
  }

  const session = await getSession();
  if (!session) return NextResponse.json({ message: "投稿にはログインが必要です" }, { status: 401 });

  const body: unknown = await request.json().catch(() => null);
  const result = validateSubmission(body);
  if (!result.ok) return NextResponse.json({ message: "投稿内容に問題があります", errors: result.errors }, { status: 400 });

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
  return NextResponse.json({ message: "一時的に投稿できませんでした。もう一度お試しください" }, { status: 503 });
}
