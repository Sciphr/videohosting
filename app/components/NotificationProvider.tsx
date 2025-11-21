'use client'

import { useNotification } from '@/app/hooks/useNotification'

export default function NotificationProvider({ children }: { children: React.ReactNode }) {
  useNotification()
  return <>{children}</>
}
