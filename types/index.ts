export type VideoType = 'CLIP' | 'FULL'

export interface Video {
  id: string
  title: string
  description?: string | null
  filePath: string
  thumbnailPath?: string | null
  duration: number
  videoType: VideoType
  gameTitle?: string | null
  viewCount: number
  createdAt: Date
  updatedAt: Date
  userId: string
  user?: User
  parentVideoId?: string | null
  clippedById?: string | null
  clipStartTime?: number | null
  clipEndTime?: number | null
}

export interface User {
  id: string
  email: string
  username: string
  avatar?: string | null
  createdAt: Date
}

export interface Comment {
  id: string
  text: string
  timestamp?: number | null
  createdAt: Date
  userId: string
  user?: User
  videoId: string
}

export interface UploadFormData {
  title: string
  description: string
  videoType: VideoType
  gameTitle: string
}
