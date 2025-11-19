import type { Metadata } from 'next'
import { SessionProvider } from 'next-auth/react'
import Navigation from '@/components/Navigation'
import './globals.css'

export const metadata: Metadata = {
  title: 'GameClips - Share Your Gaming Moments',
  description: 'A video hosting platform for friends and family focused on gaming content',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0f0f0f]">
        <SessionProvider>
          <Navigation />
          <main className="max-w-7xl mx-auto px-4 py-8">
            {children}
          </main>
        </SessionProvider>
      </body>
    </html>
  )
}
