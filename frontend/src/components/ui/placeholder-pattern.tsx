import { useId } from "react";
import { cn } from "@/components/ui/card";

interface PlaceholderPatternProps {
  className?: string;
}

export function PlaceholderPattern({ className }: PlaceholderPatternProps) {
  const patternId = useId();

  return (
    <svg
      className={cn("size-full stroke-neutral-900/10 dark:stroke-neutral-100/10 fill-none", className)}
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="100%"
    >
      <defs>
        <pattern
          id={patternId}
          width="16"
          height="16"
          patternUnits="userSpaceOnUse"
        >
          <path d="M-1 1l2-2M0 16L16 0M15 17l2-2" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" stroke="none" fill={`url(#${patternId})`} />
    </svg>
  );
}
