import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-3xl bg-[linear-gradient(180deg,rgba(247,240,255,0.82),rgba(238,230,245,0.92),rgba(241,231,219,0.92))] shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
