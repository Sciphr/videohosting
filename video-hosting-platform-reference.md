# Video Hosting Platform - Technical Reference Guide

## Project Overview
Building a video hosting platform for friends/family focused on gaming content. Think "YouTube + TikTok for gaming clips" with unique social features.

**Tech Stack:**
- Next.js (frontend/backend)
- PostgreSQL (database)
- Video.js or React Player (video playback)
- FFmpeg (video processing)
- Socket.io (real-time features)

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
