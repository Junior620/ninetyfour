"use client";

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
  mockApplications,
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
                    <TableHead>Ville</TableHead>
                    <TableHead>Poste</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockApplications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-medium">
                        {app.firstName} {app.lastName}
                      </TableCell>
                      <TableCell>{app.city}</TableCell>
                      <TableCell>{app.position}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[app.status]}>
                          {app.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
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
