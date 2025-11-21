# Video Hosting Platform - Technical Reference Guide

## Project Overview
Building a video hosting platform for friends/family focused on gaming content. Think "YouTube + TikTok for gaming clips" with unique social features.

**Tech Stack:**
- Next.js 16.0.3 (frontend/backend) with App Router
- PostgreSQL (database) with Prisma 7.0.0 ORM
- Video.js 8.23.4 (video playback)
- NextAuth v5 (authentication)
- MinIO (S3-compatible storage)
- Tailwind CSS 4 (styling)
- FFmpeg (video processing - integrated)
- Socket.io 4.x (real-time features - integrated)

---

## Implementation Status

### ✅ Completed Features

#### 1. Database & ORM (Prisma)
- **Models Implemented (12 total):**
  - User: Authentication, profiles, avatars, bio
  - Video: Title, description, fileUrl, thumbnailUrl, videoType (CLIP/FULL), status, viewCount
  - Game: Game catalog with relationships to videos
  - Comment: Nested comments with videoTimestamp support
  - Like: User likes on videos
  - Tag: Custom tags and game-specific tags
  - VideoTag: Many-to-many relationship between videos and tags
  - WatchParty: Co-watching sessions with room codes
  - WatchPartyParticipant: Participants in watch parties
  - Follow: User follow relationships
  - Notification: System notifications
  - VideoView: View tracking with watch duration
- **Features:**
  - Soft delete support (deletedAt field)
  - Video clipping support (parentVideoId, clipStartTime, clipEndTime)
  - Proper indexes on foreign keys and common queries
  - Cascade deletes where appropriate

#### 2. Authentication & Authorization
- **NextAuth v5 Configuration:**
  - Credentials provider with bcryptjs password hashing
  - Session management with JWT
  - Custom session fields (username, id)
  - TypeScript declarations for session types
- **Auth Pages:**
  - Login page (`/login`) with gaming-themed UI
  - Register page (`/register`) with form validation
  - Middleware for protected routes
- **Security:**
  - Password hashing with bcryptjs
  - Protected API routes
  - Session-based authentication

#### 3. API Routes (32 endpoints)
- **Video Routes:**
  - `GET /api/videos` - List videos with filtering (videoType, game, user)
  - `POST /api/videos` - Create new video
  - `GET /api/videos/[id]` - Get single video with relations
  - `PATCH /api/videos/[id]` - Update video metadata
  - `DELETE /api/videos/[id]` - Soft delete video
  - `POST /api/videos/[id]/view` - Track video views
  - `GET /api/videos/[id]/comments` - List comments with nested replies
  - `POST /api/videos/[id]/comments` - Create comment with optional timestamp
  - `DELETE /api/videos/[id]/comments/[commentId]` - Delete comment
  - `POST /api/videos/[id]/like` - Like video
  - `DELETE /api/videos/[id]/like` - Unlike video
  - `GET /api/videos/[id]/clips` - Get clips from parent video
  - `POST /api/videos/[id]/clips` - Create and process clip with FFmpeg
  - `POST /api/videos/[id]/tags` - Add tags to video
  - `DELETE /api/videos/[id]/tags/[tagId]` - Remove tag from video
- **User Routes:**
  - `GET /api/users/[id]` - Get user profile with stats
  - `PATCH /api/users/[id]` - Update user profile
  - `GET /api/users/[id]/videos` - Get user's videos
  - `POST /api/users/[id]/follow` - Follow user
  - `DELETE /api/users/[id]/follow` - Unfollow user
  - `GET /api/users/[id]/followers` - Get followers list
  - `GET /api/users/[id]/following` - Get following list
- **Auth Routes:**
  - `POST /api/auth/register` - User registration
- **Upload Routes:**
  - `POST /api/upload` - Upload video with FFmpeg processing
- **Game Routes:**
  - `GET /api/games` - List all games with video counts
  - `POST /api/games` - Create new game
- **Watch Party Routes:**
  - `POST /api/watch-party` - Create new watch party
  - `GET /api/watch-party/[roomCode]` - Get watch party details
  - `POST /api/watch-party/[roomCode]/join` - Join watch party
- **Other Routes:**
  - `GET /api/search` - Search videos, users, and games
  - `POST /api/tags` - Create custom tags
  - `GET /api/socket` - Initialize Socket.io server (Pages API)
  - `GET /api/analytics` - Get user's video analytics and stats

#### 4. Frontend Pages & UI
- **Core Pages:**
  - `/` - Home page with video grid and filtering
  - `/watch/[id]` - Video watch page with player, comments, likes, watch party creation
  - `/upload` - Video upload page (protected)
  - `/login` - Login page
  - `/register` - Registration page
  - `/profile/[id]` - User profile with stats, videos, edit/follow functionality
  - `/clips` - Filtered page showing only clips
  - `/full-videos` - Filtered page showing only full videos
  - `/search` - Search results page with tabs (videos, users, games)
  - `/party/[roomCode]` - Watch party room with synchronized playback and chat
  - `/party/join` - Join watch party by entering room code
  - `/party/active` - Browse all active watch parties with live updates
  - `/analytics` - Video analytics dashboard (protected)
- **Layout Components:**
  - Root layout with Providers wrapper
  - Navigation component with search bar and watch party link
  - Gaming-themed dark UI with blue/purple accents
  - Responsive design with Tailwind CSS
- **Video Card Component:**
  - Thumbnail with hover opacity effect
  - Duration badge overlay on thumbnail
  - Video title (2-line clamp)
  - Uploader name/display name
  - View count with locale formatting (e.g., "1,234 views")
  - Upload time relative format (e.g., "2 days ago")
  - Game badge display
  - Hover ring effect for interactivity
  - Responsive grid layout (1-4 columns based on screen size)

#### 5. Video Player (Video.js)
- **Features:**
  - Custom gaming-themed CSS styling
  - Playback speed controls (0.5x to 2x)
  - Responsive and fluid player
  - Poster/thumbnail support
  - Automatic view tracking after 30 seconds
  - Player instance exposed for timestamp seeking
- **Integration:**
  - `VideoPlayer` component with cleanup on unmount
  - `onPlayerReady` callback for parent components
  - `onTimeUpdate` and `onEnded` event handlers
- **Video Page UI:**
  - Video title and metadata section
  - Uploader name with link to profile
  - Game badge display
  - Upload date (formatted as "Jan 1, 2024")
  - Tags display with hashtag styling
  - View count display
  - Video description (expandable text)
  - Parent video link for clips
  - Action buttons: Like, Share (copy link), Watch Party, Create Clip
  - Share button with "Copied!" feedback
  - Related clips section for full videos
- **Location:** `/components/VideoPlayer.tsx`, `/app/watch/[id]/page.tsx`

#### 6. Comments & Likes System
- **Comment Features:**
  - Nested/threaded comments (replies)
  - Timestamp comments that link to video moments
  - Click timestamp to jump to that moment in video
  - Delete functionality (auth required)
  - Real-time updates after posting
  - User avatars and display names
  - Relative timestamps (e.g., "2 hours ago")
- **Like Features:**
  - Toggle like/unlike with heart icon
  - Visual feedback (red when liked, gray when not)
  - Real-time like count updates
  - Optimistic UI updates
- **Components:**
  - `Comment.tsx` - Individual comment with timestamp badge
  - `CommentSection.tsx` - Comment list and form
  - `LikeButton.tsx` - Like toggle button

#### 7. Search Functionality
- **Search API:**
  - Full-text search across videos (title, description, tags, game name)
  - User search (username, displayName)
  - Game search (name)
  - Filtering by type (all, videos, users, games)
  - Pagination support (limit, offset)
- **Search UI:**
  - Search bar in navigation header
  - Search results page with tabs
  - Video cards in grid layout
  - User cards with avatar, stats, and bio
  - Game cards with video count
- **Location:** `/api/search/route.ts`, `/app/search/SearchPageClient.tsx`

#### 8. User Profiles
- **Profile Features:**
  - User avatar (default gradient if no avatar)
  - Display name and username
  - Bio/description
  - Stats: video count, follower count, following count
  - Grid of user's uploaded videos
  - Edit profile modal (for own profile)
  - Follow/unfollow button (for other users)
- **Edit Functionality:**
  - Update display name, bio, avatar URL
  - Real-time updates
  - Protected (users can only edit their own profile)
- **Components:**
  - `ProfileClient.tsx` - Client-side interactivity
  - `EditProfileModal.tsx` - Profile editing modal

#### 9. Video Filtering
- **Clips Page (`/clips`):**
  - Shows only videos with videoType=CLIP
  - Gaming-themed header
  - Grid layout with VideoCard components
- **Full Videos Page (`/full-videos`):**
  - Shows only videos with videoType=FULL
  - Same layout as clips page
  - Links to related clips displayed on watch page
- **Home Page Filtering:**
  - Default view shows all videos
  - Sorted by creation date (newest first)

#### 10. Video Clipping Tool with FFmpeg Processing
- **ClipCreator Component:**
  - Modal interface for creating clips from any video
  - Dual range sliders for precise start/end time selection
  - Real-time duration display with formatted timestamps
  - Preview functionality (plays selected range)
  - Title and description input
  - Validation (2 seconds min, 2 minutes max)
  - Custom gaming-themed slider styling
- **Clip Creation API:**
  - `POST /api/videos/[id]/clips` - Create and process clip
  - Validates time ranges and clip duration
  - Links clip to parent video via `parentVideoId`
  - Stores `clipStartTime` and `clipEndTime` in database
  - Creates notification for parent video owner
  - **Full FFmpeg integration with automatic processing**
- **FFmpeg Processing Pipeline:**
  - Downloads parent video from MinIO to temp directory
  - Extracts clip segment using FFmpeg with stream copy (`-c copy`)
  - Generates thumbnail from middle of clip
  - Uploads clip and thumbnail to MinIO
  - Updates database with new URLs and status=READY
  - Cleans up temporary files automatically
  - Fallback: If processing fails, clip entry remains with PROCESSING status
- **MinIO Integration:**
  - `lib/minio.ts` - Download/upload utilities
  - Supports extracting S3 keys from URLs
  - Automatic directory creation for uploads
  - Stream-based downloads for efficiency
- **FFmpeg Utilities:**
  - `lib/ffmpeg.ts` - Video processing functions
  - `extractClip()` - Fast clip extraction with stream copy
  - `generateThumbnail()` - Thumbnail generation at timestamp
  - `getVideoDuration()` - FFprobe duration detection
  - `checkFFmpegAvailability()` - System check utility
- **Collaborative Clipping:**
  - Any authenticated user can clip any video
  - Clips link back to original video and creator
  - "Clipped by" attribution stored in database
  - Each clip gets unique ID and dedicated storage
- **UI Integration:**
  - "Create Clip" button on all video watch pages
  - Parent video info banner displayed on clips
  - Shows clip time range from original video
  - Related clips section on full videos
  - Click parent video link to navigate to source
- **Components:**
  - `ClipCreator.tsx` - Main clipping interface
  - Custom CSS for range sliders in `globals.css`
- **Performance Notes:**
  - Stream copy (`-c copy`) makes extraction very fast (seconds, not minutes)
  - No re-encoding needed - preserves original quality
  - Suitable for Raspberry Pi deployment
  - For scale: Consider job queue (Bull/BullMQ) for async processing

#### 11. Video Upload System
- **Upload Form (`/upload`):**
  - File picker with drag & drop support
  - File preview with size display
  - Real-time upload progress bar (0-100%)
  - Metadata forms editable during upload
  - Support for MP4, MOV, AVI, WebM up to 2GB
- **Upload API (`POST /api/upload`):**
  - Multipart form data handling
  - File validation (type, size)
  - Automatic video processing with FFmpeg
  - Duration detection using FFprobe
  - Automatic thumbnail generation
  - Upload to MinIO storage
  - Database entry creation with all metadata
- **Progress Tracking:**
  - XMLHttpRequest with progress events
  - Visual progress bar showing percentage
  - Status messages (uploading vs processing)
  - No websockets needed - native browser events
- **Metadata Management:**
  - Title and description fields
  - Video type selection (CLIP/FULL) with visual cards
  - Game selection dropdown
  - Inline game creation (add new games on the fly)
  - Tag creation and management
  - Tags displayed as removable chips
  - All fields editable before submission
- **Game Management:**
  - `GET /api/games` - List all games
  - `POST /api/games` - Create new game
  - Inline creation during upload
  - Automatic dropdown refresh after creation
- **Tag Integration:**
  - Create/attach tags during upload
  - Tag input with Enter key support
  - Visual tag chips with remove buttons
  - Auto-create tags if they don't exist
  - Associate via VideoTag junction table
- **Processing Pipeline:**
  1. Validate file (type, size)
  2. Save to temp directory
  3. Detect video duration with FFprobe
  4. Generate thumbnail at 10% mark
  5. Upload video to MinIO
  6. Upload thumbnail to MinIO
  7. Create database entry
  8. Create/link tags
  9. Clean up temp files
  10. Redirect to video watch page
- **Error Handling:**
  - File type validation
  - Size limit enforcement (2GB max)
  - Processing error handling with cleanup
  - User-friendly error messages
- **Configuration:**
  - Body size limit set to 2GB in next.config.ts
  - Temp directory automatic cleanup
  - MinIO integration via lib/minio.ts

#### 12. Watch Parties (Watch Together Mode)
- **Watch Party System:**
  - Create watch parties from any video
  - Unique 8-character room codes for easy sharing
  - Real-time participant management
  - Host and participant roles
  - Active party status tracking
- **Socket.io Real-time Features:**
  - WebSocket connections via Socket.io server
  - Custom server endpoint at `/api/socket`
  - Event-driven architecture for real-time sync
  - Automatic reconnection handling
  - In-memory participant tracking
- **Synchronized Playback:**
  - Play/pause sync across all participants
  - Seek/scrub synchronization
  - Timestamp-based coordination
  - Ignore local events to prevent loops
  - Host and participants have equal control
- **Real-time Chat:**
  - Live text chat within watch parties
  - User identification (displayName/username)
  - Message timestamps
  - Chat history during session
  - Visual message bubbles with user info
  - Auto-scroll to bottom when new messages arrive
  - Smooth scrolling behavior
- **Participant Management:**
  - Real-time participant list
  - Join/leave notifications
  - Display name and username
  - Host badge for party creator
  - "You" badge for current user
  - Avatar placeholders with gradient backgrounds
- **Watch Party Pages:**
  - `/party/[roomCode]` - Watch party room with synchronized playback and chat
  - `/party/join` - Join party by entering room code
  - `/party/active` - Browse all active watch parties
  - "Watch Party" button on all video watch pages
  - "Watch Parties" link in main navigation (links to active parties)
- **Active Parties Discovery:**
  - Real-time list of all active watch parties
  - Shows video thumbnail, title, host, participant count
  - Live badge indicator for active sessions
  - One-click join from list
  - Auto-refreshes every 10 seconds
  - Empty state with helpful CTAs
- **Watch Party API:**
  - `POST /api/watch-party` - Create new party
  - `GET /api/watch-party/[roomCode]` - Get party details
  - `POST /api/watch-party/[roomCode]/join` - Join party
  - `GET /api/watch-party/active` - List all active parties with participant counts
- **UI Features:**
  - Room code copy-to-clipboard
  - Connection status indicator (green/red)
  - Two-column layout (video + chat | participants)
  - Gaming-themed purple accent colors
  - Responsive grid layout
  - Message input with send button
  - Participant count display
- **Technical Details:**
  - Socket.io events: `party:join`, `party:leave`, `party:play`, `party:pause`, `party:seek`, `party:chat-message`
  - TypeScript interfaces for type safety
  - Client and server event definitions
  - Player event listeners for user actions
  - Event flag to prevent infinite sync loops
  - Database tracking via WatchParty and WatchPartyParticipant models
- **User Experience:**
  - Seamless joining via room codes
  - No lag synchronization
  - Intuitive chat interface
  - Clear participant visibility
  - Easy party creation from any video
- **Components:**
  - `WatchPartyClient.tsx` - Main party interface
  - `pages/api/socket.ts` - Socket.io server
  - `lib/socket.ts` - Socket.io types and helpers
- **Performance Notes:**
  - WebSocket connections for low-latency sync
  - In-memory participant storage (consider Redis for scale)
  - Efficient event broadcasting to room members only
  - Automatic cleanup on disconnect

#### 13. Video Edit Metadata
- **Edit Functionality:**
  - Video owners can edit their video metadata after upload
  - Edit button shown only to video owner on watch page
  - Modal-based editing interface
  - Real-time updates after saving
- **Editable Fields:**
  - Title (required, max 100 chars)
  - Description (optional, max 1000 chars)
  - Game selection (with dropdown of existing games)
  - Tags (add/remove with chip UI)
- **Edit Modal UI:**
  - Clean modal overlay with form
  - Game dropdown with all available games
  - Tag input with Enter key support
  - Tag chips with remove buttons
  - Cancel and Save buttons
  - Loading state during save
  - Error handling and display
- **API Integration:**
  - Uses existing `PATCH /api/videos/[id]` endpoint
  - Updates title, description, gameId, and tags
  - Auto-creates tags if they don't exist
  - Returns updated video data
- **Components:**
  - `EditVideoModal.tsx` - Edit modal component
  - Edit button in `WatchPageClient.tsx`
- **User Experience:**
  - Page refreshes after successful save
  - All changes reflected immediately
  - Only video owner sees edit button
  - Validation prevents empty titles

#### 14. Video Analytics Dashboard
- **Analytics Page (`/analytics`):**
  - Protected page for authenticated users
  - Shows comprehensive video performance metrics
  - Auto-refreshes data on load
  - Clean, gaming-themed dashboard design
- **Total Stats Cards:**
  - Total Videos count
  - Total Views across all videos
  - Total Likes received
  - Total Comments received
  - Total Clips created from user's videos
  - Color-coded cards (blue, red, green, purple)
- **Views Chart (Last 30 Days):**
  - Bar chart showing daily view counts
  - Hover tooltips with exact counts and dates
  - Visual scaling based on max value
  - Responsive height and width
  - Built with native HTML/CSS (no chart library)
- **Top Performing Videos Table:**
  - Sortable list of top 10 videos by views
  - Columns: Title, Game, Views, Likes, Comments, Clips
  - Upload date for each video
  - "View" link to watch each video
  - Color-coded metrics matching stats cards
  - Responsive table layout
- **Analytics API (`GET /api/analytics`):**
  - Calculates totals from all user videos
  - Groups views by date for chart data
  - Returns top videos sorted by view count
  - Includes engagement metrics (likes, comments, clips)
  - Protected endpoint (requires authentication)
- **Data Included:**
  - Video performance metrics
  - Engagement statistics
  - Recent activity (30-day window)
  - Per-video breakdown
  - Game associations
- **UI Features:**
  - Loading spinner while fetching data
  - Error state handling
  - Empty state for new users
  - Direct links to videos from table
  - Clean, scannable layout
- **Navigation:**
  - "Analytics" link in main nav (auth required)
  - Easy access for content creators
  - Positioned next to Upload link

#### 15. Gaming-Themed UI Overhaul with Dark Mode++
- **Global Design System:**
  - Dark Mode++ with neon color palette (cyan, pink, purple, blue, green, orange)
  - Custom CSS variables for consistent theming
  - Neon glow effects and animated borders
  - RGB gradient animations
  - Gaming HUD-style elements
  - Cyberpunk aesthetic throughout
- **Neon Color Variables:**
  - `--neon-cyan: #00ffff`
  - `--neon-pink: #ff006e`
  - `--neon-purple: #b026ff`
  - `--neon-blue: #0080ff`
  - `--neon-green: #39ff14`
  - `--neon-orange: #ff6600`
- **Custom CSS Utilities:**
  - Glow effects (`.glow-cyan`, `.glow-neon-blue`, `.glow-neon-pink`)
  - Neon borders (`.neon-border-cyan`, `.neon-border-purple`)
  - RGB gradients (`.bg-rgb-gradient`, `.bg-gaming-gradient`, `.bg-cyberpunk-gradient`)
  - Animated effects (`.animate-rgb-border`, `.animate-rgb-gradient`, `.animate-neon-flicker`)
  - Gaming HUD elements (`.hud-corner-accent`)
  - Neon text shadows (`.text-neon-cyan`, `.text-neon-pink`, `.text-neon-purple`)
- **Enhanced Navigation:**
  - Neon glow on GameClips logo with cyan accent
  - Logo glow intensifies on hover
  - Gradient Sign Up button with blue-to-purple gradient
  - Shadow effects on buttons (`.shadow-lg shadow-blue-500/50`)
  - Navigation border with purple glow
- **Home Page Redesign:**
  - **FeaturedHero Component:**
    - Large hero section for most-viewed video
    - Two-column layout (thumbnail + metadata)
    - Neon "FEATURED" badge with star icon
    - Gradient "Watch Now" CTA button with cyan-to-blue gradient
    - Hover effects with blue glow
    - Decorative blur orbs for depth
  - **ActiveWatchPartiesWidget Component:**
    - Live watch parties preview section
    - Shows top 3 active parties with LIVE badges
    - Purple gradient theme
    - Animated pulse on LIVE indicators
    - Grid layout with hover animations
  - **Trending Videos Section:**
    - 🔥 emoji with "Trending Now" header
    - Most-viewed videos grid
    - Color-coded by engagement
  - **Latest Uploads Section:**
    - ✨ emoji with "Latest Uploads" header
    - Newest content showcase
    - "View All" links for each section
- **Clips Page TikTok-Style Redesign:**
  - **ClipCard Component:**
    - Portrait aspect ratio (9:16) for vertical video format
    - Overlay gradient from bottom for readability
    - Neon "CLIP" badge in top-left
    - Content info overlaid on thumbnail
    - User avatar with gradient background
    - Compact stats display
    - Hover effects with cyan border glow and slight rotation
  - **Grid Layout:**
    - 2-6 columns responsive grid (more compact than regular videos)
    - Optimized for portrait thumbnails
    - TikTok-inspired card density
  - **Gaming Header:**
    - Cyan gradient header with gaming icons
    - "Epic moments in bite-sized format" tagline
    - Icon-enhanced title
- **Watch Page Innovations:**
  - **Two-Column Layout:**
    - Main content (video + info) in left column (2/3 width)
    - Sidebar with related content in right column (1/3 width)
    - Sticky sidebar for persistent access
  - **Related Clips Sidebar:**
    - Compact clip cards with thumbnails
    - Scrollable list (max 10 clips)
    - Purple border theme matching clips
    - Hover animations on each clip
    - "CLIP" badges on thumbnails
  - **Gaming Stats HUD Widget:**
    - Cyan-bordered stats card
    - HUD-style label formatting (uppercase, tracking-wide)
    - Color-coded metrics:
      - Views: White/Blue
      - Likes: Red
      - Comments: Green
      - Clips: Purple
    - Duration display
    - Compact, scannable layout
- **Analytics Gaming Dashboard:**
  - **Command Center Header:**
    - Large gradient header with cyan/purple theme
    - Icon-enhanced title
    - "SYS.ANALYTICS.V2" HUD-style system label
    - Decorative blur orbs
  - **HUD-Style Stats Cards:**
    - Animated pulse indicators (colored dots)
    - Neon borders matching metric color
    - Icon for each metric type
    - Gradient bottom accent bars
    - Color-coded by metric:
      - Videos: Gray
      - Views: Blue/Cyan
      - Likes: Red/Pink
      - Comments: Green/Emerald
      - Clips: Purple/Pink
    - Hover effects with glow intensification
  - **Enhanced Chart Visualization:**
    - Cyan gradient bars (from-cyan-600 to-blue-500)
    - Dark background container
    - Improved tooltips with borders and colors
    - Hover effects with shadow and top indicator
    - "CHART.VIEWS.30D" system label
  - **Leaderboard-Style Table:**
    - Rank column with gradient badges (purple-to-pink)
    - Purple theme throughout
    - Icon-enhanced column headers
    - Hover effects on rows (purple glow)
    - Color-coded metrics with inline icons
    - Gaming-style "View" buttons
    - "LEADERBOARD.TOP10" system label
- **Animated Hover Effects:**
  - Video cards scale up 2% on hover
  - Blue glow shadow effect (`.shadow-xl shadow-blue-500/20`)
  - Border color transitions (gray → blue)
  - Image zoom inside cards (scale-110)
  - Play button overlay with backdrop blur
  - Smooth 300ms transitions
- **New Components:**
  - `FeaturedHero.tsx` - Home page hero section for featured video
  - `ActiveWatchPartiesWidget.tsx` - Live parties widget for home page
  - `ClipCard.tsx` - TikTok-style vertical cards for clips
- **Modified Components:**
  - `VideoCard.tsx` - Enhanced hover effects with glow and scale
  - `Navigation.tsx` - Neon effects on logo and buttons
  - `app/page.tsx` - Multi-section home layout
  - `app/clips/page.tsx` - Card-based grid with ClipCard
  - `app/watch/[id]/page.tsx` - Two-column layout with sidebar
  - `app/analytics/page.tsx` - Gaming dashboard theme throughout
  - `app/globals.css` - Extensive neon utilities and animations
- **Visual Design Elements:**
  - Decorative blur orbs for depth and atmosphere
  - System labels (HUD-style monospace identifiers)
  - Gradient overlays on backgrounds
  - Corner accents on gaming elements
  - Pulsing animations on live indicators
  - Smooth transitions throughout (300ms standard)
- **Color Coding Strategy:**
  - Blue/Cyan: Primary actions, views, data visualization
  - Purple/Pink: Secondary actions, clips, special content
  - Red: Likes, alerts, live indicators
  - Green: Comments, success states
  - Gray: Neutral content, video count

### 🚧 In Progress / Planned

#### Additional Features (Future)
- Video transcoding with FFmpeg
- Multi-resolution support (HLS/DASH)
- OCR stat detection
- Reaction recordings
- Auto-generated compilations
- Discord integration

---

## Core Features

### 1. Two Content Types
**Short Clips** (15 seconds - 2 minutes)
- Highlights, funny moments, clutch plays
- Fast-scrolling feed/grid view
- Autoplay/hover previews
- Quick consumption

**Full Videos** (10-30+ minutes)
- Full gameplay sessions, streams
- YouTube-like thumbnails with durations
- Can generate clips from these videos
- Links to related clips

### Upload Flow
Users choose when uploading:
- **Quick Clip** → Goes to highlights feed
- **Full Video** → Goes to full videos section + can be clipped later

---

## Video Player Options

### Recommended Players
1. **Video.js** (Best choice for starting)
   - Free, open-source
   - Highly customizable
   - Tons of plugins
   - Handles multiple formats

2. **Plyr**
   - Simpler, cleaner UI
   - Lightweight

3. **React Player**
   - Built for React/Next.js
   - Easy integration

---

## Video Storage & Processing

### Initial MVP Approach (No Transcoding)
- Accept videos at native resolution
- Store and playback as-is (no multi-resolution conversion)
- Simpler, works on Raspberry Pi
- Add transcoding later when you have a powerful server

### Storage Options
- **AWS S3** - Industry standard
- **Google Cloud Storage** - Good alternative
- **Cloudflare R2** - No egress fees
- **Bunny.net** - Cheapest option (~$0.005/min)

### Future: Video Transcoding
When you build your server, use FFmpeg to convert videos into multiple resolutions:
- 1080p, 720p, 480p, 360p, etc.
- Enables adaptive streaming (HLS/DASH)
- Users on slow connections get lower quality automatically

**Why YouTube transcodes:**
- A 1080p video file has fixed size/bitrate
- Can't magically stream faster without creating smaller versions
- Client-side downsampling would still use full bandwidth

---

## Video Clipping Feature

### How It Works
FFmpeg can extract video segments WITHOUT re-encoding (very fast):

```bash
ffmpeg -i input.mp4 -ss 00:00:10 -to 00:00:30 -c copy output.mp4
```

This extracts seconds 10-30 instantly using "stream copying"

### Architecture
1. **UI Component**
   - Video player with trim handles/range slider
   - Select start/end times
   - Preview the clip

2. **API Endpoint**
   - Receives: video ID, start time, end time
   - Runs FFmpeg command
   - Returns new clip

3. **Storage**
   - Save clip as new video entry in database
   - Link back to parent video
   - Store metadata (who clipped it, from which video, etc.)

### Features
- Users can clip their own videos
- Users can clip each other's videos (collaborative)
- Clips link back to full video for context
- Fast processing (seconds, not minutes)

---

## UI/UX Concepts

### Navigation Structure
- **Home** - Mixed feed of recent clips + videos
- **Highlights** - Clips only (TikTok-style)
- **Full Videos** - Sessions only (YouTube-style)
- **By Game** - Filter content by game title
- **By Friend** - Individual user channels

### Design Direction
**Gaming aesthetic:**
- Dark theme by default
- Neon accents or game-inspired colors
- Bold thumbnails with play overlays
- Show game title + username prominently

**Inspiration:**
- TikTok/Instagram Reels (for clips feed)
- Twitch (for gaming vibe)
- YouTube (for full videos section)
- But cleaner and friend-focused

---

## Unique Features Ideas

### 1. Collaborative Clip Creation
- Friend uploads 30-min video
- YOU can create clips from it
- "Remember when you whiffed that ult?" - clip it and @ them
- Builds shared highlight reel

### 2. Timestamp Comments
- Comment on specific moments in video
- "18:32 - dude what were you thinking??"
- Click timestamp to jump to that moment
- Better than YouTube's timestamp comments

### 3. Multi-POV Sync
- If multiple friends were in same game, link their videos
- Switch between perspectives during playback
- "Watch this teamfight from everyone's view"

### 4. Watch Together Mode (Co-watching)
Real-time synchronized viewing with friends

**Tech Implementation:**
- Use **Socket.io** for WebSocket communication
- One person (host) controls playback
- Their play/pause/seek events broadcast to everyone
- Live chat sidebar

**Basic Code Concept:**
```javascript
// Host presses play
socket.emit('videoControl', { 
  action: 'play', 
  timestamp: 45.2,
  roomId: 'video-123' 
});

// Other viewers receive and sync
socket.on('videoControl', (data) => {
  if (data.action === 'play') {
    videoPlayer.currentTime = data.timestamp;
    videoPlayer.play();
  }
});
```

**Features:**
- Create watch party with shareable link
- Real-time chat
- Synchronized playback
- Handle people joining mid-video

### 5. Scoreboard Overlay Detection (Advanced)
Automatically extract game stats from videos using OCR

**How It Works:**
1. **Frame Extraction** - Use FFmpeg to grab screenshot at specific timestamp:
```bash
ffmpeg -i gameplay.mp4 -ss 00:00:05 -frames:v 1 screenshot.jpg
```

2. **OCR** - Use Tesseract.js to read text from image:
```javascript
const { createWorker } = require('tesseract.js');
const worker = await createWorker('eng');
const { data: { text } } = await worker.recognize('screenshot.jpg');
```

3. **Parse Results** - Extract K/D/A, rank, etc. with regex:
```javascript
const kills = text.match(/Kills:\s*(\d+)/)?.[1];
const deaths = text.match(/Deaths:\s*(\d+)/)?.[1];
```

**Challenges:**
- Game-specific scoreboard positions
- OCR accuracy (~90-95%)
- Need configuration per game

**Recommendation:** Start with manual stat entry, add OCR later as "wow factor"

### 6. Reaction Recordings
- Watch friend's clip
- Record your reaction (webcam)
- Picture-in-picture overlay
- Like Twitch clip reactions

### 7. Clip Chains/Responses
- Clip as "response" to another clip
- "You think THAT was bad? Watch this..."
- Creates threaded clip conversations
- Unique social interaction

### 8. Auto-generated Compilations
- System auto-creates supercuts
- "All pentakills this month"
- "Best of [Friend] - 2025"
- Based on tags/metadata

### 9. Game State Tagging
Tag emotional moments:
- Clutch, Fail, Toxic, Wholesome, Rage
- Quick filters: "Show me all rage quits"
- Monthly "Hall of Shame" compilation

### 10. Discord Integration
- Auto-post new clips to Discord server
- Bot command to clip from Discord
- Sync reactions between platforms

### 11. Challenge/Bounty System
- "Best Baron steal this month"
- "$5 for funniest rage moment"
- Gamify clip curation

### 12. Background Music Library
- Add copyright-free music to clips
- Pre-set meme sound effects
- Built-in editing without external tools

---

## Database Schema Ideas

### Videos Table
```sql
- id
- user_id (uploader)
- title
- description
- file_path
- duration
- video_type (clip/full)
- parent_video_id (if it's a clip)
- game_title
- thumbnail_path
- view_count
- created_at
- updated_at
```

### Clips Table (if separate from videos)
```sql
- id
- parent_video_id
- clipped_by_user_id
- start_time
- end_time
- file_path
- created_at
```

### Comments Table
```sql
- id
- video_id
- user_id
- comment_text
- timestamp (null if general comment, specific time if timestamp comment)
- created_at
```

### Tags Table
```sql
- id
- video_id
- tag_type (game/emotion/custom)
- tag_value
```

### Watch Parties Table
```sql
- id
- video_id
- host_user_id
- room_code
- created_at
- active (boolean)
```

---

## Development Phases

### Phase 1: MVP (Start here)
- Basic video upload (native resolution only)
- Video.js player
- Simple grid/list view
- User accounts and authentication
- PostgreSQL database
- Store videos locally or on S3

### Phase 2: Core Features
- Video clipping tool
- Two content types (clips vs full videos)
- Game tagging
- Comments
- Basic search/filter

### Phase 3: Social Features
- Collaborative clipping
- Timestamp comments
- Watch together mode
- Discord integration

### Phase 4: Advanced Features
- OCR stat detection
- Reaction recordings
- Auto-compilations
- Multi-POV sync

### Phase 5: Optimization
- Video transcoding with FFmpeg
- Multiple resolutions
- Adaptive streaming (HLS/DASH)
- CDN integration

---

## Technical Notes

### FFmpeg Installation
**On Raspberry Pi/Linux:**
```bash
sudo apt update
sudo apt install ffmpeg
```

**Check version:**
```bash
ffmpeg -version
```

### Socket.io with Next.js
Need to create custom server for WebSocket support:

```javascript
// server.js
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(server);

  io.on('connection', (socket) => {
    console.log('User connected');
    
    socket.on('videoControl', (data) => {
      socket.to(data.roomId).emit('videoControl', data);
    });
  });

  server.listen(3000);
});
```

### Video.js Basic Setup
```bash
npm install video.js
```

```javascript
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

useEffect(() => {
  const player = videojs('my-video', {
    controls: true,
    autoplay: false,
    preload: 'auto'
  });

  return () => {
    if (player) {
      player.dispose();
    }
  };
}, []);

return (
  <video
    id="my-video"
    className="video-js"
    data-setup='{}'
  >
    <source src="/path/to/video.mp4" type="video/mp4" />
  </video>
);
```

---

## Performance Considerations

### For Raspberry Pi Development
**Can Handle:**
- Serving videos at native resolution
- Basic FFmpeg clipping (fast with -c copy)
- PostgreSQL database
- Next.js application
- Multiple concurrent users (small group)

**Cannot Handle Well:**
- Video transcoding (very slow)
- Many simultaneous video uploads
- Heavy OCR processing
- Large-scale traffic

**Recommendation:**
- Develop on Pi
- Deploy to cloud (DigitalOcean, AWS, etc.) for production
- Or upgrade to dedicated server for video processing

---

## Security Considerations

1. **File Upload Validation**
   - Verify file types (MP4, MOV, etc.)
   - Set max file size limits
   - Scan for malicious content

2. **Authentication**
   - Only friends/family can upload
   - Private by default or invite-only
   - Consider using NextAuth.js

3. **Storage Permissions**
   - Secure video file access
   - Generate temporary signed URLs for playback
   - Prevent direct file access

4. **Rate Limiting**
   - Limit uploads per user/day
   - Prevent spam/abuse

---

## Cost Estimates (Rough)

### MVP (Minimal costs)
- **Storage:** $5-20/month (S3/R2 for video files)
- **Hosting:** $5-10/month (if not using Pi)
- **Database:** Free (included with hosting) or $5/month
- **Total:** ~$10-30/month

### With Transcoding
- **Video Processing:** Variable ($1-5 per hour of video)
- **Bandwidth:** $10-50/month depending on views
- **Total:** $50-200/month with moderate usage

### Free Options
- Develop on Raspberry Pi (free hosting)
- Store videos locally initially (free storage)
- Use free PostgreSQL tiers
- Upgrade as you scale

---

## Resources & Libraries

### Essential
- **Next.js:** Framework
- **Video.js:** Video player
- **FFmpeg:** Video processing
- **Socket.io:** Real-time features
- **PostgreSQL:** Database

### Optional/Advanced
- **Tesseract.js:** OCR for stat detection
- **Multer:** File upload handling (Node.js)
- **AWS SDK:** If using S3
- **Sharp:** Image processing (thumbnails)
- **Bull/BullMQ:** Job queue for background processing

### Documentation Links
- Video.js: https://videojs.com/
- FFmpeg: https://ffmpeg.org/documentation.html
- Socket.io: https://socket.io/docs/
- Next.js: https://nextjs.org/docs

---

## Next Steps

1. **Start Simple**
   - Set up Next.js project
   - Implement basic video upload
   - Add Video.js player
   - Create simple video list

2. **Add Database**
   - PostgreSQL schema
   - Video metadata storage
   - User authentication

3. **Build Clipping Tool**
   - UI with range slider
   - FFmpeg integration
   - Save clips

4. **Expand Features**
   - Add gaming-specific features one at a time
   - Test with friend group
   - Iterate based on feedback

5. **Optimize & Scale**
   - Add transcoding when needed
   - Migrate to cloud if necessary
   - Implement advanced features

---

## Questions to Consider

- How many users initially? (affects infrastructure decisions)
- Storage limits per user?
- Public vs private videos?
- Moderation needed?
- Mobile app eventually?
- Integration with streaming software (OBS)?

---

*This document is a living reference - update as the project evolves!*
