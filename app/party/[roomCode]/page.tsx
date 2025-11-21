import { getServerSession } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import WatchPartyClient from './WatchPartyClient'

export default async function WatchPartyPage({
  params,
}: {
  params: { roomCode: string }
}) {
  const session = await getServerSession()

  if (!session?.user) {
    redirect(`/login?callbackUrl=/party/${params.roomCode}`)
  }

  // Fetch watch party details
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const res = await fetch(`${baseUrl}/api/watch-party/${params.roomCode}`, {
    cache: 'no-store',
    headers: {
      Cookie: `next-auth.session-token=${session.user.id}`,
    },
  })

  if (!res.ok) {
    if (res.status === 404) {
      notFound()
    }
    throw new Error('Failed to fetch watch party')
  }

  const watchParty = await res.json()

  return (
    <WatchPartyClient
      watchParty={watchParty}
      currentUser={{
        id: session.user.id,
        username: session.user.username,
        displayName: session.user.name || session.user.username,
      }}
    />
  )
}
