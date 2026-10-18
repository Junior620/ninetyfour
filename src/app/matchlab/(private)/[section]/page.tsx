import { notFound } from "next/navigation";
import { Workspace } from "@/components/matchlab/Workspace";
export default async function Page({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  if (
    ![
      "overview",
      "matches",
      "players",
      "player",
      "squad",
      "tactics",
      "analyze",
      "live",
      "reports",
      "analytics",
      "video",
      "ai",
      "exports",
      "site",
      "admin",
      "alerts",
    ].includes(section)
  )
    notFound();
  return <Workspace section={section} />;
}
