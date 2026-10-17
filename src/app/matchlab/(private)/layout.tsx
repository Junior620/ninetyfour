import { redirect } from "next/navigation";
import Link from "next/link";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { Shell } from "@/components/matchlab/Shell";
import { requireLab, LabError, labConfig } from "@/lib/matchlab/server";
import { fr as t, errorMessage } from "@/lib/matchlab/messages";
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  let session;
  try {
    session = await requireLab();
  } catch (e) {
    if (e instanceof LabError && e.status === 401) redirect("/matchlab/login");
    return (
      <main className="ml-service-state">
        <h1>{t.brand}</h1>
        <p role="alert">
          {errorMessage(e instanceof LabError ? e.code : "INTERNAL_ERROR")}
        </p>
        <p>{t.admin.first}</p>
        <Link href="/matchlab/login">{t.auth.loginAgain}</Link>
        <Link href="/fr">{t.backSite}</Link>
      </main>
    );
  }
  // Season names only (RLS: any active member); the data graph stays loaded client-side.
  const seasons = await session.db
    .from("ml_seasons")
    .select("id,name")
    .order("starts_on", { ascending: false });
  return (
    <Shell
      member={session.member}
      email={session.user.email || "N91"}
      seasons={seasons.data ?? []}
      logo={existsSync(join(process.cwd(), "public/n91-lab-logo.png"))}
      localOnly={labConfig().url === "http://127.0.0.1:55321"}
    >
      {children}
    </Shell>
  );
}
