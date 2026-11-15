import { ConditionalCheckFailedException, TransactionCanceledException } from "@aws-sdk/client-dynamodb";
import { BatchWriteCommand, DeleteCommand, GetCommand, TransactWriteCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { autoHideThreshold, type ReportedWork, type ReportInput, type ReportReason } from "@/lib/moderation";
import type { WorkVisibility } from "@/lib/submission";
import { db, isWorkItem, scanAllItems, tableName } from "./db";

// 通報・非公開・削除。作品と同じ表に、キーを `report#<作品の slug>#<ユーザー ID>` にした行として通報を入れる
// (お気に入りと同じ作り。作品の slug に # は入らないのでぶつからない)。1 人が同じ作品を通報できるのは 1 回。
// 作品の行には reportCount(通報した人の数)を持たせ、通報の行の追加と同じトランザクションで増やす。
// reportCount が autoHideThreshold に達したら hiddenBy = "reports" にして、運営が見るまで一覧と詳細から外す。

const KIND = "report";

export function reportKey(slug: string, userId: string): string {
  return `${KIND}#${slug}#${userId}`;
}

interface ReportRow {
  slug: string;
  kind: typeof KIND;
  userId: string;
  workSlug: string;
  reason: ReportReason;
  note: string;
  createdAt: string;
}

function isReportRow(item: Record<string, unknown>): item is Record<string, unknown> & ReportRow {
  return item.kind === KIND;
}

type WorkRow = Record<string, unknown> & { slug: string; authorId?: string; visibility?: string; hiddenBy?: string };

export async function getWorkRow(slug: string): Promise<WorkRow | null> {
  const { Item } = await db.send(new GetCommand({ TableName: tableName(), Key: { slug }, ConsistentRead: true }));
  return Item && isWorkItem(Item) ? (Item as WorkRow) : null;
}

export async function hasReported(userId: string, slug: string): Promise<boolean> {
  const { Item } = await db.send(
    new GetCommand({ TableName: tableName(), Key: { slug: reportKey(slug, userId) }, ProjectionExpression: "slug" }),
  );
  return Item !== undefined;
}

/**
 * 通報する。not-found = 作品が無いか、もう非公開(公開されていない作品は通報できない)。
 * own = 自分の作品。already = 前に通報済み(何も変えない)。
 */
export type ReportResult = "reported" | "already" | "not-found" | "own";

// 通報できる作品: 作品の行で、公開で、まだ非公開にされておらず、通報した本人の作品ではない
// (authorId の無い初期の作品もある。無い属性との <> は偽になるので、別に書く)
const REPORTABLE =
  "attribute_exists(slug) AND attribute_not_exists(kind) AND (attribute_not_exists(visibility) OR visibility = :public) AND attribute_not_exists(hiddenBy) AND (attribute_not_exists(authorId) OR authorId <> :me)";

export async function addReport(userId: string, slug: string, input: ReportInput): Promise<ReportResult> {
  // 理由を分けて返すために先に読む(実際に書けるかはトランザクションの条件で確かめる)
  const work = await getWorkRow(slug);
  if (!work) return "not-found";
  if (work.authorId === userId) return "own";

  try {
    await db.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Put: {
              TableName: tableName(),
              Item: {
                slug: reportKey(slug, userId),
                kind: KIND,
                userId,
                workSlug: slug,
                reason: input.reason,
                note: input.note,
                createdAt: new Date().toISOString(),
              } satisfies ReportRow,
              ConditionExpression: "attribute_not_exists(slug)",
            },
          },
          {
            Update: {
              TableName: tableName(),
              Key: { slug },
              UpdateExpression: "ADD reportCount :one",
              ConditionExpression: REPORTABLE,
              ExpressionAttributeValues: { ":one": 1, ":public": "public", ":me": userId },
            },
          },
        ],
      }),
    );
  } catch (error) {
    if (!(error instanceof TransactionCanceledException)) throw error;
    const reasons = (error.CancellationReasons ?? []).map((r) => r.Code);
    if (reasons[0] === "ConditionalCheckFailed") return "already";
    if (reasons[1] === "ConditionalCheckFailed") return "not-found";
    throw error;
  }

  // しきい値に達したら自動で非公開にする。同時に何人かが通報しても、条件で 1 回だけ書く
  try {
    await db.send(
      new UpdateCommand({
        TableName: tableName(),
        Key: { slug },
        UpdateExpression: "SET hiddenBy = :reports, hiddenAt = :now",
        ConditionExpression: "attribute_not_exists(hiddenBy) AND reportCount >= :threshold",
        ExpressionAttributeValues: { ":reports": "reports", ":now": new Date().toISOString(), ":threshold": autoHideThreshold() },
      }),
    );
  } catch (error) {
    if (!(error instanceof ConditionalCheckFailedException)) throw error;
  }
  return "reported";
}


/** 運営が見る一覧: 通報があるか、非公開にされている作品。非公開のもの → 通報の多い順 */
export async function listReportedWorks(): Promise<ReportedWork[]> {
  const items = await scanAllItems();
  const reports = new Map<string, ReportRow[]>();
  for (const item of items) {
    if (!isReportRow(item)) continue;
    reports.set(item.workSlug, [...(reports.get(item.workSlug) ?? []), item]);
  }
  return items
    .filter(isWorkItem)
    .filter((work) => work.hiddenBy !== undefined || (typeof work.reportCount === "number" && work.reportCount > 0))
    .map((work) => ({
      slug: String(work.slug),
      title: String(work.title ?? ""),
      author: String(work.author ?? ""),
      createdAt: String(work.createdAt ?? ""),
      visibility: work.visibility as string | undefined,
      hiddenBy: work.hiddenBy as string | undefined,
      hiddenAt: work.hiddenAt as string | undefined,
      reportCount: typeof work.reportCount === "number" ? work.reportCount : 0,
      reports: (reports.get(String(work.slug)) ?? [])
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map(({ reason, note, createdAt }) => ({ reason, note, createdAt })),
    }))
    .sort((a, b) => Number(b.hiddenBy !== undefined) - Number(a.hiddenBy !== undefined) || b.reportCount - a.reportCount);
}

/** 運営が非公開にする。作品が無ければ false */
export async function hideWork(slug: string): Promise<boolean> {
  return updateWork(slug, {
    UpdateExpression: "SET hiddenBy = :operator, hiddenAt = :now",
    ExpressionAttributeValues: { ":operator": "operator", ":now": new Date().toISOString() },
  });
}

/**
 * 運営が確認して元に戻す。それまでの通報は片付け(行を消して数を 0 に)、
 * 同じ人がまた通報できるようにする。作品が無ければ false
 */
export async function restoreWork(slug: string): Promise<boolean> {
  const ok = await updateWork(slug, {
    UpdateExpression: "REMOVE hiddenBy, hiddenAt SET reportCount = :zero",
    ExpressionAttributeValues: { ":zero": 0 },
  });
  if (ok) await deleteRows((await scanAllItems()).filter((item) => isReportRow(item) && item.workSlug === slug));
  return ok;
}

/** 作者が公開・非公開を切り替える。作品が無いか本人の作品でなければ false */
export async function setVisibility(slug: string, authorId: string, visibility: WorkVisibility): Promise<boolean> {
  return updateWork(
    slug,
    {
      UpdateExpression: "SET visibility = :visibility",
      ExpressionAttributeValues: { ":visibility": visibility, ":me": authorId },
    },
    "authorId = :me",
  );
}

/**
 * 作品を消す。その作品へのお気に入りと通報の行も消す(残しても画面には出ないが、持ち続ける理由が無い)。
 * authorId を渡すと本人の作品のときだけ消す(運営が消すときは渡さない)。作品が無いか本人でなければ false
 */
export async function deleteWork(slug: string, authorId?: string): Promise<boolean> {
  try {
    await db.send(
      new DeleteCommand({
        TableName: tableName(),
        Key: { slug },
        ConditionExpression: `attribute_exists(slug) AND attribute_not_exists(kind)${authorId ? " AND authorId = :me" : ""}`,
        ...(authorId ? { ExpressionAttributeValues: { ":me": authorId } } : {}),
      }),
    );
  } catch (error) {
    if (error instanceof ConditionalCheckFailedException) return false;
    throw error;
  }
  const related = (await scanAllItems()).filter(
    (item) => (item.kind === "favorite" || item.kind === KIND) && item.workSlug === slug,
  );
  await deleteRows(related);
  return true;
}

async function updateWork(
  slug: string,
  update: { UpdateExpression: string; ExpressionAttributeValues: Record<string, unknown> },
  extraCondition?: string,
): Promise<boolean> {
  try {
    await db.send(
      new UpdateCommand({
        TableName: tableName(),
        Key: { slug },
        ...update,
        ConditionExpression: `attribute_exists(slug) AND attribute_not_exists(kind)${extraCondition ? ` AND ${extraCondition}` : ""}`,
      }),
    );
    return true;
  } catch (error) {
    if (error instanceof ConditionalCheckFailedException) return false;
    throw error;
  }
}

/** 行をまとめて消す(BatchWrite は 1 回 25 件まで。処理しきれなかった分は送り直す) */
async function deleteRows(rows: Record<string, unknown>[]): Promise<void> {
  for (let i = 0; i < rows.length; i += 25) {
    let requests: { DeleteRequest: { Key: Record<string, unknown> } }[] | undefined = rows
      .slice(i, i + 25)
      .map((row) => ({ DeleteRequest: { Key: { slug: row.slug } } }));
    for (let attempt = 0; requests && requests.length > 0 && attempt < 5; attempt++) {
      const res = await db.send(new BatchWriteCommand({ RequestItems: { [tableName()]: requests } }));
      requests = res.UnprocessedItems?.[tableName()] as typeof requests;
    }
  }
}
