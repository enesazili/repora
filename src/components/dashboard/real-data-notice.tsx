import Link from "next/link";
import { Panel } from "@/components/ui/panel";

export function RealDataNotice({ title, description, action }: { title: string; description: string; action: string }) {
  return <div className="space-y-6"><h1 className="text-2xl font-semibold text-foreground">{title}</h1><Panel className="max-w-2xl space-y-4 p-6"><p className="text-sm leading-6 text-muted-foreground">{description}</p><Link href="/repositories" className="inline-flex rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]">{action}</Link></Panel></div>;
}
