import { cn } from "@/lib/utils";

export function ReporaMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-[10px] bg-accent text-accent-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.18)]",
        className,
      )}
    >
      <svg viewBox="0 0 32 32" className="size-5" fill="none">
        <path
          d="M10.5 23.5V8.5h6.1a4.5 4.5 0 0 1 0 9h-6.1"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="m17.3 17.5 5.2 6"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

export function ReporaLogo({
  showPreview = false,
  className,
}: {
  showPreview?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <ReporaMark />
      <span className="flex items-baseline gap-2">
        <span className="text-[15px] font-semibold tracking-[-0.035em] text-foreground">
          Repora
        </span>
        {showPreview ? (
          <span className="rounded border border-border px-1 py-px text-[8.5px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
            preview
          </span>
        ) : null}
      </span>
    </span>
  );
}
