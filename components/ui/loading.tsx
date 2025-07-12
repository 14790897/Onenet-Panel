import { cn } from "@/lib/utils"
import { RefreshCw, Loader2 } from "lucide-react"

interface LoadingProps {
  className?: string
  text?: string
  variant?: "spinner" | "refresh" | "dots"
  size?: "sm" | "md" | "lg"
}

export function Loading({ 
  className, 
  text = "加载中...", 
  variant = "spinner",
  size = "md" 
}: LoadingProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6", 
    lg: "w-8 h-8"
  }

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base"
  }

  const LoadingIcon = variant === "refresh" ? RefreshCw : Loader2

  if (variant === "dots") {
    return (
      <div className={cn("flex items-center justify-center gap-2", className)}>
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
        </div>
        {text && <span className={cn("text-gray-600", textSizeClasses[size])}>{text}</span>}
      </div>
    )
  }

  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      <LoadingIcon className={cn("animate-spin text-gray-400", sizeClasses[size])} />
      {text && <span className={cn("text-gray-600", textSizeClasses[size])}>{text}</span>}
    </div>
  )
}

export function LoadingCard({ children, loading, className }: { 
  children: React.ReactNode
  loading: boolean
  className?: string 
}) {
  if (loading) {
    return (
      <div className={cn("flex items-center justify-center py-8", className)}>
        <Loading />
      </div>
    )
  }
  
  return <>{children}</>
}

export function LoadingSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse bg-gray-200 rounded", className)} />
  )
}
