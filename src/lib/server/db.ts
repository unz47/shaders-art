import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

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
