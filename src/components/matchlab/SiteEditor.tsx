"use client";
import { useCallback, useEffect, useState } from "react";
import { fr as t, errorMessage } from "@/lib/matchlab/messages";
import type { ArticleRecord, ArticleDocument } from "@/lib/matchlab/articles";
import {
  useLab,
  useMutation,
  api,
  Heading,
  Feedback,
  Empty,
  Status,
} from "./shared";
async function fetchArticles(id?: string) {
  const response = await fetch(
    `/api/matchlab/articles${id ? `?id=${id}` : ""}`,
    { cache: "no-store" },
  );
  const result = await response.json();
  if (!response.ok) throw new Error(result.code);
  return result;
}
export function SiteEditor() {
  const { data } = useLab();
  const [articles, setArticles] = useState<ArticleRecord[]>([]);
  const [selected, setSelected] = useState<ArticleRecord | null>(null);
  const [editing, setEditing] = useState(false);
  const [locale, setLocale] = useState<"fr" | "en">("fr");
  const [preview, setPreview] = useState(false);
  const [document, setDocument] = useState<ArticleDocument>({
    slug: "",
    title: { fr: "", en: "" },
    excerpt: { fr: "", en: "" },
    content: { fr: "", en: "" },
    category: "academy",
    date: new Date().toISOString().slice(0, 10),
    image: "/hero-3.jpeg",
  });
  const [revisions, setRevisions] = useState<
    { version: number; created_at: string }[]
  >([]);
  const [error, setError] = useState("");
  const mutation = useMutation();
  const canEdit = data.member.permissions.includes("site_editor");
  const canPublish = data.member.permissions.includes("site_publisher");
  const dirty =
    editing &&
    (!selected ||
      JSON.stringify(document) !==
        JSON.stringify({ ...selected.draft, slug: selected.slug }));
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty) event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  const load = useCallback(async (id?: string) => {
    const result = await fetchArticles(id);
    setArticles(result.articles);
    setRevisions(result.revisions);
  }, []);
  useEffect(() => {
    let active = true;
    fetchArticles()
      .then((result) => {
        if (active) {
          setArticles(result.articles);
          setRevisions(result.revisions);
        }
      })
      .catch((e) => {
        if (active) setError(errorMessage(e.message));
      });
    return () => {
      active = false;
    };
  }, []);
  const choose = (article: ArticleRecord) => {
    setSelected(article);
    setDocument({ ...article.draft, slug: article.slug });
    setEditing(true);
    setPreview(false);
    load(article.id).catch((e) => setError(errorMessage(e.message)));
  };
  const action = async (
    kind: "draft" | "publish" | "unpublish" | "restore",
    revision?: number,
  ) =>
    mutation.run(async () => {
      const result = await api("articles", {
        action: kind,
        id: selected?.id,
        version: selected?.version || 0,
        payload:
          kind === "draft" ? document : kind === "restore" ? { revision } : {},
      });
      setSelected(result);
      setDocument({ ...result.draft, slug: result.slug });
      await load(result.id);
    }, false);
  return (
    <>
      <Heading title={t.site.title}>
        {canEdit && (
          <button
            className="ml-button"
            onClick={() => {
              if (dirty && !window.confirm(t.unsaved)) return;
              setSelected(null);
              setEditing(true);
              setDocument({
                slug: "",
                title: { fr: "", en: "" },
                excerpt: { fr: "", en: "" },
                content: { fr: "", en: "" },
                category: "academy",
                date: new Date().toISOString().slice(0, 10),
                image: "/hero-3.jpeg",
              });
              setRevisions([]);
            }}
          >
            {t.site.new}
          </button>
        )}
      </Heading>
      <p className="ml-notice">{t.site.intro}</p>
      <Feedback error={error || mutation.error} success={mutation.success} />
      {editing ? (
        <section className="ml-card">
          <div className="ml-section-title">
            <h2>{selected?.draft.title.fr || t.site.new}</h2>
            <button
              className="ml-button secondary"
              onClick={() => {
                if (!dirty || window.confirm(t.unsaved)) setEditing(false);
              }}
            >
              {t.close}
            </button>
          </div>
          <div
            className="ml-tabbar"
            role="tablist"
            aria-label="Langue de l’article"
          >
            <button
              role="tab"
              aria-selected={locale === "fr"}
              onClick={() => setLocale("fr")}
            >
              Français
            </button>
            <button
              role="tab"
              aria-selected={locale === "en"}
              onClick={() => setLocale("en")}
            >
              English
            </button>
            <button onClick={() => setPreview((v) => !v)}>
              {t.site.preview}
            </button>
          </div>
          {preview ? (
            <div className="ml-preview">
              <h2>{document.title[locale]}</h2>
              <p>{document.excerpt[locale]}</p>
              <p>{document.content[locale]}</p>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                action("draft");
              }}
            >
              <fieldset disabled={!canEdit || mutation.busy}>
                <div className="ml-form-grid">
                  <label>
                    {t.site.slug}
                    <input
                      required
                      pattern="[a-z0-9]+(-[a-z0-9]+)*"
                      value={document.slug}
                      disabled={!!selected}
                      onChange={(e) =>
                        setDocument((d) => ({ ...d, slug: e.target.value }))
                      }
                    />
                  </label>
                  <label>
                    {t.site.category}
                    <select
                      value={document.category}
                      onChange={(e) =>
                        setDocument((d) => ({
                          ...d,
                          category: e.target
                            .value as ArticleDocument["category"],
                        }))
                      }
                    >
                      {[
                        "academy",
                        "matches",
                        "training",
                        "partners",
                        "events",
                      ].map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </label>
                  <label className="wide">
                    {t.site.titleLabel} · {locale.toUpperCase()}
                    <input
                      value={document.title[locale]}
                      onChange={(e) =>
                        setDocument((d) => ({
                          ...d,
                          title: { ...d.title, [locale]: e.target.value },
                        }))
                      }
                    />
                  </label>
                  <label className="wide">
                    {t.site.excerpt}
                    <textarea
                      value={document.excerpt[locale]}
                      onChange={(e) =>
                        setDocument((d) => ({
                          ...d,
                          excerpt: { ...d.excerpt, [locale]: e.target.value },
                        }))
                      }
                    />
                  </label>
                  <label className="wide">
                    {t.site.content}
                    <textarea
                      rows={12}
                      value={document.content[locale]}
                      onChange={(e) =>
                        setDocument((d) => ({
                          ...d,
                          content: { ...d.content, [locale]: e.target.value },
                        }))
                      }
                    />
                  </label>
                  <label>
                    {t.site.date}
                    <input
                      type="date"
                      value={document.date}
                      onChange={(e) =>
                        setDocument((d) => ({ ...d, date: e.target.value }))
                      }
                    />
                  </label>
                  <label>
                    {t.site.image}
                    <input
                      value={document.image}
                      onChange={(e) =>
                        setDocument((d) => ({ ...d, image: e.target.value }))
                      }
                    />
                  </label>
                </div>
                <div className="ml-actions">
                  <button className="ml-button">{t.save}</button>
                </div>
              </fieldset>
            </form>
          )}
          {selected && (
            <div className="ml-actions">
              {canPublish && (
                <>
                  <button
                    className="ml-button"
                    disabled={mutation.busy || dirty}
                    onClick={() => {
                      if (window.confirm(t.site.confirm)) action("publish");
                    }}
                  >
                    {t.site.publish}
                  </button>
                  {selected.published && (
                    <button
                      className="ml-button secondary"
                      disabled={mutation.busy}
                      onClick={() => {
                        if (window.confirm(t.site.confirmUnpublish))
                          action("unpublish");
                      }}
                    >
                      {t.site.unpublish}
                    </button>
                  )}
                </>
              )}
            </div>
          )}
          <h3>{t.site.history}</h3>
          {dirty && (
            <p className="ml-notice">
              Enregistrez le brouillon avant de publier. Les deux langues seront
              conservées.
            </p>
          )}
          {revisions.map((r) => (
            <div key={r.version} className="ml-cms-row">
              <span>
                #{r.version} · {r.created_at}
              </span>
              {canEdit && (
                <button
                  className="ml-button secondary"
                  onClick={() => {
                    if (!dirty || window.confirm(t.unsaved))
                      action("restore", r.version);
                  }}
                >
                  {t.site.restore}
                </button>
              )}
            </div>
          ))}
        </section>
      ) : (
        <div className="ml-card ml-cms-list">
          {articles.length ? (
            articles.map((a) => (
              <article className="ml-cms-row" key={a.id}>
                <div>
                  <h3>{a.draft.title.fr || a.slug}</h3>
                  <p>
                    {a.slug} · {t.version} {a.version}
                  </p>
                </div>
                <Status value={a.published ? "reviewed" : "draft"} />
                <button
                  className="ml-button secondary"
                  onClick={() => choose(a)}
                >
                  {t.edit}
                </button>
              </article>
            ))
          ) : (
            <Empty />
          )}
          {canEdit && canPublish && (
            <button
              className="ml-button secondary"
              disabled={mutation.busy}
              onClick={() =>
                mutation.run(async () => {
                  await api("articles", { action: "seed" });
                  await load();
                }, false)
              }
            >
              {t.site.import}
            </button>
          )}
        </div>
      )}
    </>
  );
}
