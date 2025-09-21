"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

export interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  variant?: "default" | "success"
}

// Use React.forwardRef to be consistent with shadcn/ui
// and to correctly handle the 'ref'.
const Progress = React.forwardRef<
  React.ComponentRef<typeof ProgressPrimitive.Root>,
  ProgressProps // <-- 1. Use your updated ProgressProps here
>(
  (
    // 2. Destructure 'variant' from props, and set a default
    { className, value, variant = "default", ...props },
    ref,
  ) => (
    <ProgressPrimitive.Root
      ref={ref} // 3. Pass the ref to the Root component
      data-slot="progress"
      className={cn(
        "bg-primary/20 relative h-2 w-full overflow-hidden rounded-full",
        className,
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        // 4. Use cn() to conditionally apply the correct color
        className={cn(
          "h-full w-full flex-1 transition-all",
          variant === "default" && "bg-primary",
          variant === "success" && "bg-green-600", // <-- This line adds your success color
        )}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  ),
)
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }