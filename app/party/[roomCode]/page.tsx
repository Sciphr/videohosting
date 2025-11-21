import { getServerSession } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import WatchPartyClient from './WatchPartyClient'

export default async function WatchPartyPage({
  params,
}: {
  params: Promise<{ roomCode: string }>
}) {
  const { roomCode } = await params
  const session = await getServerSession()

  // Fetch watch party details directly from database
  // This avoids the server-to-server fetch authentication issue
  try {
    const watchParty = await prisma.watchParty.findUnique({
      where: { roomCode: roomCode.toUpperCase() },
      include: {
        video: {
          select: {
            id: true,
            title: true,
            fileUrl: true,
            thumbnailUrl: true,
            duration: true,
          }
        },
        host: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          }
        },
        participants: {
          where: {
            leftAt: null
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
              }
            }
          }
        }
      }
    })

    if (!watchParty) {
      notFound()
    }

    if (!watchParty.isActive || watchParty.endedAt) {
      redirect('/?message=watch-party-ended')
    }

    console.log('Watch party loaded from database:', watchParty.roomCode)

    // Allow unauthenticated users to join, but use guest info if not logged in
    const currentUser = session?.user
      ? {
          id: session.user.id,
          username: session.user.username,
          displayName: session.user.name || session.user.username,
        }
      : null

    return (
      <WatchPartyClient
        watchParty={watchParty}
        currentUser={currentUser}
        isAuthenticated={!!session?.user}
      />
    )
  } catch (error) {
    console.error('Error loading watch party:', error)
    throw new Error('Failed to load watch party')
  }
}
