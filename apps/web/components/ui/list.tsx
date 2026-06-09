import * as React from "react"
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const listItemVariants = cva(
  "flex w-full items-center justify-between text-left transition-colors outline-none select-none focus-visible:bg-muted disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "hover:bg-muted",
        ghost: "hover:bg-muted/50",
      },
      size: {
        default: "px-4 py-4 text-base",
        sm: "px-3 py-2.5 text-sm",
        lg: "px-5 py-5 text-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function ListItem({
  className,
  variant,
  size,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof listItemVariants>) {
  return (
    <ButtonPrimitive
      data-slot='list-item'
      className={cn(listItemVariants({ variant, size, className }))}
      {...props}
    />
  )
}

function ListItemLabel({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span data-slot='list-item-label' className={cn("font-medium", className)} {...props} />
}

function ListItemMeta({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      data-slot='list-item-meta'
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export { ListItem, ListItemLabel, ListItemMeta, listItemVariants }
