import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-3xl bg-[linear-gradient(180deg,rgba(244,236,226,0.96),rgba(232,224,212,0.92))] shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
