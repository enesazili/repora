import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ComingSoonLoading, ComingSoonView } from "@/components/layout/coming-soon-view";
import { ANALYTICS_NAV, getNavItemByFeature } from "@/config/navigation";

interface ComingSoonPageProps { params: Promise<{ feature: string }> }

export function generateStaticParams() {
  const params = ANALYTICS_NAV.filter((item) => !item.available).map((item) => ({ feature: item.href.replace("/coming-soon/", "") }));
  // Ensure at least one static param to satisfy Next.js requirement.
  // If no upcoming features exist, return a placeholder that will trigger a 404 via notFound().
  return params.length ? params : [{ feature: "placeholder" }];
}

export async function generateMetadata({ params }: ComingSoonPageProps): Promise<Metadata> {
  const { feature } = await params;
  const item = getNavItemByFeature(feature);
  if (!item) notFound();
  return { title: `${item.label} — Coming soon`, description: item.description };
}

export default function ComingSoonPage({ params }: ComingSoonPageProps) {
  return <Suspense fallback={<ComingSoonLoading/>}><ComingSoonContent params={params}/></Suspense>;
}

async function ComingSoonContent({ params }: ComingSoonPageProps) {
  const { feature } = await params;
  if (!getNavItemByFeature(feature)) notFound();
  return <ComingSoonView feature={feature}/>;
}
