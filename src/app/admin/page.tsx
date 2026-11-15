import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/server";
import { AdminReports } from "./AdminReports";

// /admin … 運営が通報と非公開の作品を見るページ。運営かどうかは API(/api/admin/*)が毎回確かめる。
// 運営でなければ API が 404 を返すので、このページには何も出ない。ナビには出さない。
export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return { title: `${t.moderation.admin.title} — shaders.art`, robots: { index: false } };
}

export default function AdminPage() {
  return <AdminReports />;
}
