'use client'

import { useGlobalToast } from '@/app/context/ToastContext'
import Toast from './Toast'

export default function GlobalToastContainer() {
  const { toasts, removeToast } = useGlobalToast()

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  )
}
