import { cn } from "@/lib/utils"

function Spinner({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "animate-spin aspect-square size-4 rounded-full border-2 border-current border-t-transparent",
        className
      )}
      aria-label="読み込み中"
      {...props}
    />
  )
}

export { Spinner }
