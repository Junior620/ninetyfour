"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { galleryItems } from "@/lib/data";
import { localized } from "@/lib/utils";
import type { Locale } from "@/types";

type MediaRow = (typeof galleryItems)[number] & {
  size: string;
  addedOn: string;
  usage: string;
};

export default function AdminMediaPage() {
  const t = useTranslations("dashboard.admin");
  const locale = useLocale() as Locale;
  const fileRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [items, setItems] = useState<MediaRow[]>(
    galleryItems.map((item, i) => ({
      ...item,
      size: `${1.2 + (i % 5) * 0.4} MB`,
      addedOn: `2026-0${(i % 6) + 1}-12`,
      usage: i % 3 === 0 ? "Hero" : i % 3 === 1 ? "News" : "Gallery",
    }))
  );
  const [editing, setEditing] = useState<MediaRow | null>(null);
  const [draft, setDraft] = useState({ title: "", usage: "Gallery" });

  const filtered = useMemo(() => {
    return items.filter((m) =>
      localized(m.title, locale).toLowerCase().includes(q.toLowerCase())
    );
  }, [items, q, locale]);

  function onImportFiles(files: FileList | null) {
    if (!files?.length) return;
    const next: MediaRow[] = [];
    Array.from(files).forEach((file, i) => {
      const url = URL.createObjectURL(file);
      next.push({
        id: `import-${Date.now()}-${i}`,
        title: { fr: file.name, en: file.name },
        category: "training",
        type: file.type.startsWith("video") ? "video" : "image",
        image: url,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        addedOn: new Date().toISOString().slice(0, 10),
        usage: "Gallery",
      });
    });
    setItems((prev) => [...next, ...prev]);
    toast(t("toastSaved"));
    if (fileRef.current) fileRef.current.value = "";
  }

  function openEdit(media: MediaRow) {
    setEditing(media);
    setDraft({
      title: localized(media.title, locale),
      usage: media.usage,
    });
  }

  function saveEdit() {
    if (!editing) return;
    const title = draft.title.trim();
    if (!title) return;
    setItems((prev) =>
      prev.map((m) =>
        m.id === editing.id
          ? {
              ...m,
              title: { ...m.title, [locale]: title },
              usage: draft.usage,
            }
          : m
      )
    );
    setEditing(null);
    toast(t("toastSaved"));
  }

  return (
    <DashboardLayout requiredRole="admin" title={t("media")}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("search")}
            className="h-10 min-w-[200px] flex-1 rounded-xl border border-[#E5E2D9] bg-white px-3 text-sm outline-none focus:border-gold/50"
          />
          <input
            ref={fileRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={(e) => onImportFiles(e.target.files)}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="h-10 rounded-xl bg-gold px-4 text-sm font-bold text-navy transition hover:translate-y-[-1px]"
          >
            {t("importMedia")}
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((media) => (
            <div
              key={media.id}
              className="overflow-hidden rounded-2xl border border-[#E5E2D9] bg-white transition hover:-translate-y-0.5"
            >
              <div className="relative aspect-square bg-[#F7F6F2]">
                <Image
                  src={media.image}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width:768px) 50vw, 25vw"
                  unoptimized={media.image.startsWith("blob:")}
                />
                <span className="absolute top-2 left-2 rounded-md bg-navy/80 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                  {media.type}
                </span>
              </div>
              <div className="space-y-2 p-3">
                <p className="line-clamp-1 text-sm font-semibold text-navy">
                  {localized(media.title, locale)}
                </p>
                <p className="text-xs text-text-muted">
                  {t("fileSize")}: {media.size} · {t("addedOn")} {media.addedOn}
                </p>
                <p className="text-xs text-text-muted">
                  {t("usage")}: {media.usage}
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(media.image);
                        toast(t("toastCopied"));
                      } catch {
                        toast(
                          locale === "fr"
                            ? "Impossible de copier le lien"
                            : "Unable to copy link"
                        );
                      }
                    }}
                    className="rounded-lg border border-[#E5E2D9] px-2 py-1 text-[11px] font-semibold"
                  >
                    {t("copyLink")}
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(media)}
                    className="rounded-lg border border-[#E5E2D9] px-2 py-1 text-[11px] font-semibold"
                  >
                    {t("edit")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!window.confirm(t("confirmDelete"))) return;
                      setItems((prev) => prev.filter((x) => x.id !== media.id));
                      toast(t("toastDeleted"));
                    }}
                    className="rounded-lg border border-[#E5E2D9] px-2 py-1 text-[11px] font-semibold text-red-700"
                  >
                    {t("delete")}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog
        open={!!editing}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-bold text-navy">{t("edit")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <label className="block text-sm">
              <span className="mb-1 block text-xs font-semibold text-text-muted">
                {locale === "fr" ? "Titre" : "Title"}
              </span>
              <input
                value={draft.title}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                className="h-10 w-full rounded-xl border border-[#E5E2D9] px-3"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-xs font-semibold text-text-muted">
                {t("usage")}
              </span>
              <select
                value={draft.usage}
                onChange={(e) => setDraft((d) => ({ ...d, usage: e.target.value }))}
                className="h-10 w-full rounded-xl border border-[#E5E2D9] px-3"
              >
                <option value="Hero">Hero</option>
                <option value="News">News</option>
                <option value="Gallery">Gallery</option>
              </select>
            </label>
            <button
              type="button"
              onClick={saveEdit}
              className="h-10 w-full rounded-xl bg-gold text-sm font-bold text-navy"
            >
              {locale === "fr" ? "Enregistrer" : "Save"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
