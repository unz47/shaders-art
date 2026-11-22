"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { Button } from "@frost-ui/react/atoms/button";
import { Label } from "@frost-ui/react/atoms/label";
import { Textarea } from "@frost-ui/react/atoms/textarea";
import { Alert, AlertDescription } from "@frost-ui/react/molecules/alert";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@frost-ui/react/organisms/dialog";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@frost-ui/react/organisms/menu";
import { useToast } from "@frost-ui/react/organisms/toast";
import { useI18n, useLocalize, usePagePath } from "@/lib/i18n/client";
import { REPORT_NOTE_MAX, REPORT_REASONS, type ReportReason } from "@/lib/moderation";
import { loginHref } from "@/lib/useSession";
import { deleteWork, moderateWork, reportWork, setWorkVisibility, type WorkDetail } from "@/lib/works";

// 作品ページの、作者・運営の操作(公開の切り替え・削除・運営の非公開)と、ほかの人の通報。
// 誰に何を出すかは API が返す viewer で決める(サーバー側でも同じ判定をしている)。

/** 作者か運営に出す「管理」メニュー。変えたら onChange に新しい作品を渡す */
export function WorkManageMenu({ work, onChange }: { work: WorkDetail; onChange: (work: WorkDetail) => void }) {
  const { t } = useI18n();
  const toast = useToast();
  const router = useRouter();
  const localize = useLocalize();
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const owner = work.viewer?.owner ?? false;
  const admin = work.viewer?.admin ?? false;
  if (!owner && !admin) return null;

  const fail = () => toast.add({ title: t.moderation.failed, description: t.moderation.retryLater, priority: "high" });

  async function run(action: () => Promise<void>, next: WorkDetail, title: string) {
    if (busy) return;
    setBusy(true);
    try {
      await action();
      onChange(next);
      toast.add({ title });
    } catch {
      fail();
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    setBusy(true);
    try {
      await deleteWork(work.slug);
      toast.add({ title: t.moderation.deleted });
      router.push(localize(owner ? "/me" : "/admin"));
    } catch {
      fail();
      setBusy(false);
      setConfirmDelete(false);
    }
  }

  const isPrivate = work.visibility === "private";
  return (
    <>
      <Menu>
        <MenuTrigger render={<Button variant="ghost" size="sm" disabled={busy} />}>{t.moderation.manage}</MenuTrigger>
        <MenuContent align="end">
          {owner && (
            <MenuItem
              onClick={() => {
                const visibility = isPrivate ? "public" : "private";
                void run(
                  () => setWorkVisibility(work.slug, visibility),
                  { ...work, visibility },
                  isPrivate ? t.moderation.madePublic : t.moderation.madePrivate,
                );
              }}
            >
              {isPrivate ? t.moderation.makePublic : t.moderation.makePrivate}
            </MenuItem>
          )}
          {admin &&
            (work.hiddenBy ? (
              <MenuItem
                onClick={() =>
                  void run(() => moderateWork(work.slug, "restore"), { ...work, hiddenBy: undefined }, t.moderation.admin.restored)
                }
              >
                {t.moderation.admin.restore}
              </MenuItem>
            ) : (
              <MenuItem
                onClick={() =>
                  void run(() => moderateWork(work.slug, "hide"), { ...work, hiddenBy: "operator" }, t.moderation.admin.hidden)
                }
              >
                {t.moderation.admin.hide}
              </MenuItem>
            ))}
          <MenuItem onClick={() => setConfirmDelete(true)}>{t.moderation.delete}</MenuItem>
        </MenuContent>
      </Menu>

      {/* 削除は元に戻せないので、確かめてから消す */}
      <Dialog
        open={confirmDelete}
        onOpenChange={(open) => {
          if (!busy) setConfirmDelete(open);
        }}
      >
        <DialogContent className="w-full max-w-md">
          <DialogTitle>{t.moderation.deleteTitle}</DialogTitle>
          <DialogDescription>{t.moderation.deleteDescription}</DialogDescription>
          <div className="mt-4 flex justify-end gap-2">
            <DialogClose render={<Button type="button" variant="ghost" size="sm" disabled={busy} />}>
              {t.moderation.cancel}
            </DialogClose>
            <Button variant="danger" size="sm" disabled={busy} onClick={() => void onDelete()}>
              {busy ? t.moderation.deleting : t.moderation.deleteConfirm}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** 作者以外に出す「通報」。ログインしていなければ、押すとログイン画面へ */
export function ReportButton({ work, onReported }: { work: WorkDetail; onReported: () => void }) {
  const { t } = useI18n();
  const toast = useToast();
  const pathname = usePagePath();
  const localize = useLocalize();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);

  const viewer = work.viewer;
  // viewer が無い = モックか古い API。作者・運営には出さない(運営は「管理」から非公開にできる)
  if (!viewer || viewer.owner || viewer.admin) return null;
  if (viewer.reported) {
    return (
      <Button variant="ghost" size="sm" disabled>
        {t.moderation.reported}
      </Button>
    );
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!reason || sending) return;
    setSending(true);
    try {
      await reportWork(work.slug, { reason, note });
      setOpen(false);
      onReported();
      toast.add({ title: t.moderation.thanks, description: t.moderation.thanksDescription });
    } catch {
      toast.add({ title: t.moderation.failed, description: t.moderation.retryLater, priority: "high" });
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          if (!viewer.signedIn) {
            // Route Handler へのフルページ遷移
            window.location.assign(loginHref(localize(pathname)));
            return;
          }
          setOpen(true);
        }}
      >
        {t.moderation.report}
      </Button>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!sending) setOpen(next);
        }}
      >
        <DialogContent className="w-full max-w-md">
          <DialogTitle>{t.moderation.reportTitle}</DialogTitle>
          <DialogDescription>{t.moderation.reportDescription}</DialogDescription>
          <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-3">
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1 text-sm font-medium text-text-primary">{t.moderation.reasonLegend}</legend>
              {REPORT_REASONS.map((choice) => (
                <label
                  key={choice}
                  className="flex cursor-pointer items-start gap-3 rounded-control border border-border-subtle p-3"
                >
                  <input
                    className="mt-1 accent-accent-default"
                    type="radio"
                    name="report-reason"
                    value={choice}
                    required
                    checked={reason === choice}
                    onChange={() => setReason(choice)}
                  />
                  <span className="flex flex-col gap-0.5">
                    <span className="text-sm text-text-primary">{t.moderation.reasons[choice].title}</span>
                    <span className="text-xs text-text-muted">{t.moderation.reasons[choice].description}</span>
                  </span>
                </label>
              ))}
            </fieldset>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="report-note">{t.moderation.noteField}</Label>
              <Textarea
                id="report-note"
                rows={3}
                maxLength={REPORT_NOTE_MAX}
                placeholder={t.moderation.notePlaceholder}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
            <div className="mt-2 flex justify-end gap-2">
              <DialogClose render={<Button type="button" variant="ghost" size="sm" disabled={sending} />}>
                {t.moderation.cancel}
              </DialogClose>
              <Button type="submit" variant="danger" size="sm" disabled={sending || !reason}>
                {sending ? t.moderation.sending : t.moderation.send}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** 運営か通報で非公開になっている作品を、作者と運営が開いたときの注意書き */
export function HiddenNotice({ work }: { work: WorkDetail }) {
  const { t } = useI18n();
  if (!work.hiddenBy) return null;
  return (
    <Alert variant="warning" className="mx-6 mt-3">
      <AlertDescription>
        {work.hiddenBy === "reports" ? t.moderation.hiddenByReports : t.moderation.hiddenByOperator}
      </AlertDescription>
    </Alert>
  );
}
