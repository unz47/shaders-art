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
 * 作品を全部読む。件数が少ないうちは Scan で十分(並び替えとページ分けは lib/worksQuery)。
 * 1 回で読み切れなかったときは続きを読む。増えてきたら GSI を足して Query に切り替える。
 */
export async function scanAllWorks(): Promise<Work[]> {
  const works: Work[] = [];
  let startKey: Record<string, unknown> | undefined;
  do {
    const page = await db.send(new ScanCommand({ TableName: tableName(), ExclusiveStartKey: startKey }));
    works.push(...((page.Items ?? []) as Work[]));
    startKey = page.LastEvaluatedKey;
  } while (startKey);
  return works;
}
