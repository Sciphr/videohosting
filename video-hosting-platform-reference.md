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
- FFmpeg (video processing - to be integrated)
- Socket.io (real-time features - to be integrated)

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

#### 3. API Routes (24 endpoints)
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
- **Other Routes:**
  - `GET /api/search` - Search videos, users, and games
  - `POST /api/tags` - Create custom tags

#### 4. Frontend Pages & UI
- **Core Pages:**
  - `/` - Home page with video grid and filtering
  - `/watch/[id]` - Video watch page with player, comments, likes
  - `/upload` - Video upload page (protected)
  - `/login` - Login page
  - `/register` - Registration page
  - `/profile/[id]` - User profile with stats, videos, edit/follow functionality
  - `/clips` - Filtered page showing only clips
  - `/full-videos` - Filtered page showing only full videos
  - `/search` - Search results page with tabs (videos, users, games)
- **Layout Components:**
  - Root layout with Providers wrapper
  - Navigation component with search bar
  - Gaming-themed dark UI with blue/purple accents
  - Responsive design with Tailwind CSS

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
- **Location:** `/components/VideoPlayer.tsx`

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

#### 10. Video Clipping Tool
- **ClipCreator Component:**
  - Modal interface for creating clips from any video
  - Dual range sliders for precise start/end time selection
  - Real-time duration display with formatted timestamps
  - Preview functionality (plays selected range)
  - Title and description input
  - Validation (5 seconds min, 2 minutes max)
  - Custom gaming-themed slider styling
- **Clip Creation API:**
  - `POST /api/videos/[id]/clips` - Create new clip
  - Validates time ranges and clip duration
  - Links clip to parent video via `parentVideoId`
  - Stores `clipStartTime` and `clipEndTime` in database
  - Creates notification for parent video owner
  - Status set to PROCESSING (ready for FFmpeg integration)
- **Collaborative Clipping:**
  - Any authenticated user can clip any video
  - Clips link back to original video and creator
  - "Clipped by" attribution stored in database
- **UI Integration:**
  - "Create Clip" button on all video watch pages
  - Parent video info banner displayed on clips
  - Shows clip time range from original video
  - Related clips section on full videos
  - Click parent video link to navigate to source
- **Components:**
  - `ClipCreator.tsx` - Main clipping interface
  - Custom CSS for range sliders in `globals.css`
- **Note:** Database structure ready for FFmpeg integration. Currently creates database entries; actual video extraction to be implemented with FFmpeg job queue.

### 🚧 In Progress / Planned

#### Watch Together Mode
- Socket.io integration
- Synchronized playback
- Real-time chat
- Room creation and joining

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
