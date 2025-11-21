'use client'

import { Toast as ToastType } from '@/app/hooks/useToast'

interface ToastProps {
  toast: ToastType
  onRemove: (id: string) => void
}

export default function Toast({ toast, onRemove }: ToastProps) {
  const bgColor = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    info: 'bg-blue-600',
    warning: 'bg-yellow-600',
  }[toast.type]

  const icon = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '⚠',
  }[toast.type]

  return (
    <div
      className={`${bgColor} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 mb-2 min-w-80`}
      role="alert"
    >
      <span className="text-lg font-bold">{icon}</span>
      <p className="flex-1">{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        className="text-white hover:opacity-80 transition-opacity"
      >
        ✕
      </button>
    </div>
  )
}
