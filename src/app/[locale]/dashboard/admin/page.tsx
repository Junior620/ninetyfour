"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PlayerTable } from "@/components/dashboard/PlayerTable";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  mockPlayers,
  newsArticles,
  galleryItems,
  partners,
} from "@/lib/data";
import { localized } from "@/lib/utils";
import type { Locale } from "@/types";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  reviewed: "bg-blue-100 text-blue-800",
  accepted: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

export default function AdminDashboardPage() {
  const t = useTranslations("dashboard.admin");
  const locale = useLocale() as Locale;
  const [applications, setApplications] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await fetch("/api/admin/recruitments");
        const json = await res.json();
        if (!isMounted) return;
        setApplications(Array.isArray(json?.items) ? json.items : []);
      } catch {
        if (!isMounted) return;
        setApplications([]);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-8">
        <h1 className="text-2xl font-bold text-black-premium">{t("title")}</h1>

        <section id="players">
          <h2 className="mb-4 text-lg font-bold">{t("players")}</h2>
          <PlayerTable players={mockPlayers} locale={locale} />
        </section>

        <section id="applications">
          <h2 className="mb-4 text-lg font-bold">{t("applications")}</h2>
          <Card className="border-0 bg-white shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>{locale === "fr" ? "Lieu" : "Location"}</TableHead>
                    <TableHead>{locale === "fr" ? "Poste" : "Position"}</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">PDF</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((app) => {
                    const status = String(app.status ?? "").toLowerCase();
                    const badgeClass =
                      statusColors[status] ?? "bg-gray-100 text-gray-800";
                    const first = app.firstNames ?? app.firstName ?? "";
                    const last = app.lastName ?? "";
                    const location = app.city ?? app.school ?? app.address ?? "";
                    const position =
                      app.primaryPosition ?? app.position ?? "";

                    return (
                      <TableRow key={app.id}>
                        <TableCell className="font-medium">
                          {first} {last}
                        </TableCell>
                        <TableCell>{location}</TableCell>
                        <TableCell>{position}</TableCell>
                        <TableCell>
                          <Badge className={badgeClass}>{app.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {app.pdfSignedUrl ? (
                            <a
                              href={app.pdfSignedUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sm font-semibold text-navy hover:underline"
                            >
                              {locale === "fr" ? "Voir PDF" : "View PDF"}
                            </a>
                          ) : (
                            <span className="text-sm text-text-muted">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>

        <section id="articles">
          <h2 className="mb-4 text-lg font-bold">{t("articles")}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {newsArticles.slice(0, 3).map((article) => (
              <Card key={article.slug} className="border-0 bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="text-sm">
                    {localized(article.title, locale)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant="secondary">{article.category}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section id="media">
          <h2 className="mb-4 text-lg font-bold">{t("media")}</h2>
          <p className="text-sm text-text-muted">
            {galleryItems.length} {locale === "fr" ? "médias" : "media items"}
          </p>
        </section>

        <section id="partners">
          <h2 className="mb-4 text-lg font-bold">{t("partners")}</h2>
          <div className="flex flex-wrap gap-4">
            {partners.map((p) => (
              <Badge key={p.id} variant="outline" className="px-4 py-2 text-sm">
                {p.name}
              </Badge>
            ))}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
