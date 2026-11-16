import { TransactionCanceledException } from "@aws-sdk/client-dynamodb";
import { GetCommand, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import type { Work } from "@/lib/works";
import { db, isWorkItem, scanAllItems, tableName } from "./db";

// お気に入り。作品と同じ表に、キーを `favorite#<ユーザー ID>#<作品の slug>` にした行として入れる
// (表のキーは slug だけなので、作品の slug とぶつからない形にする。作品の slug に # は入らない)。
// 作品の行には favoriteCount(お気に入りの数)を持たせ、お気に入りの行の追加・削除と同じ
// トランザクションで増減させる。同じ人が何度押しても 1 つしか増えない。

const KIND = "favorite";

export function favoriteKey(userId: string, slug: string): string {
  return `${KIND}#${userId}#${slug}`;
}

interface FavoriteRow {
  slug: string;
  kind: typeof KIND;
  userId: string;
  workSlug: string;
  createdAt: string;
}

function isFavoriteRow(item: Record<string, unknown>): item is Record<string, unknown> & FavoriteRow {
  return item.kind === KIND;
}

/** 作品が無い・その人には見えない(他人の非公開作品)ときは null */
export type FavoriteResult = { favorited: boolean; favoriteCount: number } | null;

// お気に入りにできる作品: 作品の行で、公開か、その人自身の作品
const VISIBLE_WORK =
  "attribute_exists(slug) AND attribute_not_exists(kind) AND (attribute_not_exists(visibility) OR visibility = :public OR authorId = :me)";

async function favoriteCountOf(slug: string): Promise<number> {
  const { Item } = await db.send(
    new GetCommand({ TableName: tableName(), Key: { slug }, ConsistentRead: true, ProjectionExpression: "favoriteCount" }),
  );
  return typeof Item?.favoriteCount === "number" ? Item.favoriteCount : 0;
}

/** トランザクションが条件で止まったときの、項目ごとの理由("ConditionalCheckFailed" など) */
function cancelReasons(error: unknown): (string | undefined)[] | null {
  return error instanceof TransactionCanceledException ? (error.CancellationReasons ?? []).map((r) => r.Code) : null;
}

export async function addFavorite(userId: string, slug: string): Promise<FavoriteResult> {
  try {
    await db.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Put: {
              TableName: tableName(),
              Item: {
                slug: favoriteKey(userId, slug),
                kind: KIND,
                userId,
                workSlug: slug,
                createdAt: new Date().toISOString(),
              } satisfies FavoriteRow,
              ConditionExpression: "attribute_not_exists(slug)",
            },
          },
          {
            Update: {
              TableName: tableName(),
              Key: { slug },
              UpdateExpression: "ADD favoriteCount :one",
              ConditionExpression: VISIBLE_WORK,
              ExpressionAttributeValues: { ":one": 1, ":public": "public", ":me": userId },
            },
          },
        ],
      }),
    );
  } catch (error) {
    const reasons = cancelReasons(error);
    if (!reasons) throw error;
    if (reasons[1] === "ConditionalCheckFailed") return null;
    // お気に入りの行がすでにある = 押し直し。何も変えずに今の状態を返す
    if (reasons[0] !== "ConditionalCheckFailed") throw error;
  }
  return { favorited: true, favoriteCount: await favoriteCountOf(slug) };
}

export async function removeFavorite(userId: string, slug: string): Promise<FavoriteResult> {
  try {
    await db.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Delete: {
              TableName: tableName(),
              Key: { slug: favoriteKey(userId, slug) },
              ConditionExpression: "attribute_exists(slug)",
            },
          },
          {
            Update: {
              TableName: tableName(),
              Key: { slug },
              UpdateExpression: "ADD favoriteCount :minus",
              ConditionExpression: "attribute_exists(slug) AND attribute_not_exists(kind)",
              ExpressionAttributeValues: { ":minus": -1 },
            },
          },
        ],
      }),
    );
  } catch (error) {
    const reasons = cancelReasons(error);
    if (!reasons) throw error;
    if (reasons[1] === "ConditionalCheckFailed") return null;
    // お気に入りの行が無い = もう外れている。何も変えずに今の状態を返す
    if (reasons[0] !== "ConditionalCheckFailed") throw error;
  }
  return { favorited: false, favoriteCount: await favoriteCountOf(slug) };
}

/** その人のお気に入りの作品。新しくお気に入りにした順。見えなくなった作品(非公開になった他人の作品など)は除く */
export async function listFavoriteWorks(userId: string): Promise<Work[]> {
  const items = await scanAllItems();
  const works = new Map<string, Work>();
  for (const item of items) if (isWorkItem(item)) works.set(item.slug as string, item as unknown as Work);
  return items
    .filter(isFavoriteRow)
    .filter((row) => row.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((row) => works.get(row.workSlug))
    .filter((work): work is Work => {
      if (!work) return false;
      const owner = (work as Work & { authorId?: string }).authorId;
      return work.visibility === undefined || work.visibility === "public" || owner === userId;
    });
}
