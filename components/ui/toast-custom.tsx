import { useEffect } from 'react'
import { X, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Toast } from '@/hooks/use-toast-custom'

interface ToastProps {
  toast: Toast
  onRemove: (id: string) => void
}

const toastIcons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
}

const toastStyles = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
}

export function ToastItem({ toast, onRemove }: ToastProps) {
  const Icon = toastIcons[toast.type]
  
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id)
    }, toast.duration || 5000)
    
    return () => clearTimeout(timer)
  }, [toast.id, toast.duration, onRemove])

  return (
    <div
      className={cn(
        'p-4 rounded-lg border shadow-lg max-w-sm w-full transform transition-all duration-300 ease-in-out',
        toastStyles[toast.type]
      )}
    >
      <div className="flex items-start">
        <Icon className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          {toast.title && (
            <p className="text-sm font-semibold">{toast.title}</p>
          )}
          <p className="text-sm">{toast.message}</p>
        </div>
        <button
          onClick={() => onRemove(toast.id)}
          className="ml-3 flex-shrink-0 text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

interface ToastContainerProps {
  toasts: Toast[]
  onRemove: (id: string) => void
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  )
}
