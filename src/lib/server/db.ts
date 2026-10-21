import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import type { Work } from "@/lib/works";

// Route Handler 間で 1 つのクライアントを使い回す(Lambda のインスタンス内で再利用される)
export const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export function tableName(): string {
  const name = process.env.TABLE_NAME;
  if (!name) throw new Error("TABLE_NAME が設定されていません");
  return name;
}

/**
 * 公開 API で返す形に整える。authorId(Cognito のユーザー ID)は持ち主の判定にだけ使い、
 * 外には出さない。表示名は投稿ごとの自己申告なので、ID を出すと別名の投稿が結び付いてしまう。
 */
export function toPublicWork<T extends object>(item: T): Omit<T, "authorId"> {
  return Object.fromEntries(Object.entries(item).filter(([key]) => key !== "authorId")) as Omit<T, "authorId">;
}

/**
 * 表の行を全部読む。作品とお気に入り(lib/server/favorites)が同じ表に入っている。
 * 件数が少ないうちは Scan で十分。1 回で読み切れなかったときは続きを読む。
 * 増えてきたら GSI を足して Query に切り替える。
 */
export async function scanAllItems(): Promise<Record<string, unknown>[]> {
  const items: Record<string, unknown>[] = [];
  let startKey: Record<string, unknown> | undefined;
  do {
    const page = await db.send(new ScanCommand({ TableName: tableName(), ExclusiveStartKey: startKey }));
    items.push(...(page.Items ?? []));
    startKey = page.LastEvaluatedKey;
  } while (startKey);
  return items;
}

/** 作品の行か。お気に入りなど作品以外の行は kind を持つ */
export function isWorkItem(item: Record<string, unknown>): boolean {
  return item.kind === undefined;
}

/** 作品を全部読む(並び替えとページ分けは lib/worksQuery) */
export async function scanAllWorks(): Promise<Work[]> {
  return (await scanAllItems()).filter(isWorkItem) as unknown as Work[];
}
