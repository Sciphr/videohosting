'use client'

import { SessionProvider } from 'next-auth/react'
import { ToastProvider } from './context/ToastContext'
import GlobalToastContainer from './components/GlobalToastContainer'
import NotificationProvider from './components/NotificationProvider'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ToastProvider>
        <GlobalToastContainer />
        <NotificationProvider>{children}</NotificationProvider>
      </ToastProvider>
    </SessionProvider>
  )
}
