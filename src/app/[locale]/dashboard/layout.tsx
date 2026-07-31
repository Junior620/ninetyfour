import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return {
    robots: { index: false, follow: false },
  };
}

export default function DashboardSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
