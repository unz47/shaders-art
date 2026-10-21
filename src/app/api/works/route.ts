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

export async function GET() {
  // 件数が少ないうちは Scan で十分。増えてきたら GSI を足して Query に切り替える
  const { Items } = await db.send(new ScanCommand({ TableName: tableName() }));
  const works = (Items ?? []) as Work[];

  // visibility が無い既存作品は公開扱いにして、移行前のデータをそのまま表示する。
  const publicWorks = works.filter((w) => w.visibility === undefined || w.visibility === "public");
  // Gallery は公開作品をすべて表示する。収蔵フラグは表示可否に使わない。
  const items = [...publicWorks].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(toPublicWork);

  return NextResponse.json({ items });
}

// 公開作品は詳細 URL と Gallery から閲覧できる。収蔵フラグは運営向けメタデータとして残す。
// 非公開作品は投稿者の認証済み authorId を照合し、一覧にも含めない。
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
  return NextResponse.json({ message: "一時的に投稿できませんでした。もう一度お試しください" }, { status: 503 });
}
