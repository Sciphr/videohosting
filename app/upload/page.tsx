import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import UploadForm from '@/components/UploadForm'

export default async function UploadPage() {
  const session = await auth()

  if (!session) {
    redirect('/login?callbackUrl=/upload')
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Upload Video</h1>
        <p className="text-gray-400 mt-1">Share your gaming moments with friends</p>
      </div>

      <div className="bg-gray-900/50 rounded-lg p-6">
        <UploadForm />
      </div>
    </div>
  )
}
