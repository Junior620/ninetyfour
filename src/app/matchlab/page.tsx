import { redirect } from "next/navigation";
import { requireLab, LabError } from "@/lib/matchlab/server";
export default async function Entry() {
  try {
    await requireLab();
  } catch (e) {
    if (e instanceof LabError && e.status === 401) redirect("/matchlab/login");
    redirect("/matchlab/overview");
  }
  redirect("/matchlab/overview");
}
