import { Login } from "@/components/matchlab/Login";
import { safeReturn } from "@/lib/matchlab/server";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const query = await searchParams;
  return <Login next={safeReturn(query.next)} />;
}
