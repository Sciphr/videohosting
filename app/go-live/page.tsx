'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Stream {
  id: string
  title: string
  description: string | null
  streamKey: string
  status: 'OFFLINE' | 'LIVE' | 'ENDED'
  hlsUrl: string | null
  thumbnailUrl: string | null
  viewerCount: number
  peakViewerCount: number
  startedAt: string | null
  game: {
    id: string
    name: string
    slug: string
  } | null
}

export default function GoLivePage() {
  const router = useRouter()
  const [stream, setStream] = useState<Stream | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    fetchStream()
  }, [])

  const fetchStream = async () => {
    try {
      const res = await fetch('/api/stream')
      if (res.status === 401) {
        router.push('/login?callbackUrl=/go-live')
        return
      }
      if (res.ok) {
        const data = await res.json()
        setStream(data)
        setTitle(data.title)
        setDescription(data.description || '')
      }
    } catch (err) {
      console.error('Failed to fetch stream:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/stream', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      })
      if (res.ok) {
        const data = await res.json()
        setStream(data)
      }
    } catch (err) {
      console.error('Failed to save:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleRegenerateKey = async () => {
    if (!confirm('Are you sure? This will invalidate your current stream key.')) return

    try {
      const res = await fetch('/api/stream/key', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setStream(s => s ? { ...s, streamKey: data.streamKey } : null)
      }
    } catch (err) {
      console.error('Failed to regenerate key:', err)
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(null), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!stream) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Unable to load stream settings</h1>
          <Link href="/login" className="text-violet-400 hover:text-violet-300">
            Please log in to continue
          </Link>
        </div>
      </div>
    )
  }

  const serverUrl = typeof window !== 'undefined'
    ? `rtmp://${window.location.hostname}:1935/live`
    : 'rtmp://localhost:1935/live'

  return (
    <div className="min-h-screen p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Go Live</h1>
          <p className="text-gray-400 mt-1">Configure your stream settings</p>
        </div>
        {stream.status === 'LIVE' && (
          <Link
            href={`/live/${stream.id}`}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium animate-pulse"
          >
            <span className="w-3 h-3 bg-white rounded-full" />
            You're LIVE
          </Link>
        )}
      </div>

      {/* Status Card */}
      <div className={`p-6 rounded-xl border ${
        stream.status === 'LIVE'
          ? 'bg-red-500/10 border-red-500/50'
          : 'bg-gray-900 border-gray-800'
      }`}>
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
            stream.status === 'LIVE' ? 'bg-red-500/20' : 'bg-gray-800'
          }`}>
            {stream.status === 'LIVE' ? (
              <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="8" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </div>
          <div>
            <div className="text-lg font-semibold text-white">
              {stream.status === 'LIVE' ? 'Currently Streaming' : 'Offline'}
            </div>
            <div className="text-gray-400">
              {stream.status === 'LIVE'
                ? `${stream.viewerCount} viewers`
                : 'Start streaming with OBS or similar software'}
            </div>
          </div>
        </div>
      </div>

      {/* Stream Settings */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 space-y-6">
        <h2 className="text-xl font-semibold text-white">Stream Info</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
              placeholder="My Awesome Stream"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
              placeholder="What's your stream about?"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-gray-700 text-white rounded-lg font-medium transition-colors"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Stream Key */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Stream Key</h2>
          <button
            onClick={handleRegenerateKey}
            disabled={stream.status === 'LIVE'}
            className="text-sm text-red-400 hover:text-red-300 disabled:text-gray-600 disabled:cursor-not-allowed"
          >
            Regenerate Key
          </button>
        </div>

        <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <p className="text-yellow-200 text-sm">
            Keep your stream key secret! Anyone with this key can stream to your channel.
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Server URL</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={serverUrl}
                readOnly
                className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white font-mono text-sm"
              />
              <button
                onClick={() => copyToClipboard(serverUrl, 'server')}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                {copied === 'server' ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Stream Key</label>
            <div className="flex gap-2">
              <input
                type={showKey ? 'text' : 'password'}
                value={stream.streamKey}
                readOnly
                className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white font-mono text-sm"
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                {showKey ? 'Hide' : 'Show'}
              </button>
              <button
                onClick={() => copyToClipboard(stream.streamKey, 'key')}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                {copied === 'key' ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* OBS Setup Guide */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 space-y-4">
        <h2 className="text-xl font-semibold text-white">Quick Setup (OBS)</h2>
        <ol className="list-decimal list-inside space-y-2 text-gray-300">
          <li>Open OBS Studio and go to <span className="text-white">Settings → Stream</span></li>
          <li>Set Service to <span className="text-white">Custom</span></li>
          <li>Paste the <span className="text-white">Server URL</span> above</li>
          <li>Paste your <span className="text-white">Stream Key</span></li>
          <li>Go to <span className="text-white">Settings → Output</span> and set:</li>
          <ul className="list-disc list-inside ml-4 mt-1 text-gray-400">
            <li>Video Bitrate: <span className="text-white">2500 Kbps</span> (recommended for Pi)</li>
            <li>Encoder: <span className="text-white">x264</span> or <span className="text-white">Hardware (if available)</span></li>
          </ul>
          <li>Go to <span className="text-white">Settings → Video</span> and set:</li>
          <ul className="list-disc list-inside ml-4 mt-1 text-gray-400">
            <li>Output Resolution: <span className="text-white">1280x720</span> (recommended for Pi)</li>
            <li>FPS: <span className="text-white">30</span></li>
          </ul>
          <li>Click <span className="text-white">Start Streaming</span>!</li>
        </ol>
      </div>
    </div>
  )
}
