# 🎤 Karaoke Playlist Manager

A Next.js application for managing a karaoke queue with YouTube video playback.

## Features

- **📺 Splash Page (`/splash`)**: Displays and automatically plays YouTube videos from the queue
  - Full-screen video player with YouTube IFrame API
  - Automatically advances to next video when current one finishes
  - Polls for new videos every 5 seconds
  - Shows current singer name and number of songs up next
  
- **➕ Add Page (`/add`)**: Simple form to add songs to the queue
  - Submit YouTube URL and your name
  - Videos are added to the end of the queue
  - Beautiful gradient UI with form validation

## How It Works

1. Videos are stored in a `queue.txt` file (one JSON object per line)
2. The splash page plays the first video in the queue
3. When a video finishes playing, it's automatically removed from the queue
4. The next video starts playing automatically
5. Users can add new videos via the `/add` page

## Getting Started

### Option 1: Docker (Recommended)

#### Using Docker Compose

```bash
docker-compose up
```

#### Using Docker directly

```bash
# Build the image
docker build -t karaoke-app .

# Run the container
docker run -p 3000:3000 karaoke-app
```

Open [http://localhost:3000](http://localhost:3000) - it will redirect to `/splash`

### Option 2: Local Development

#### Install Dependencies

```bash
npm install
```

#### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) - it will redirect to `/splash`

### Usage

1. **Main Display**: Navigate to `/splash` (or just `/`) to show the video player
2. **Add Songs**: Navigate to `/add` to submit new songs to the queue (or scan the QR code)

## API Endpoints

- `GET /api/queue/current` - Get current video and queue info
- `POST /api/queue/add` - Add a video to the queue
  ```json
  {
    "youtubeUrl": "https://www.youtube.com/watch?v=...",
    "userName": "John Doe"
  }
  ```
- `DELETE /api/queue/remove` - Remove current video from queue

## Project Structure

```
/pages
  /api/queue
    current.ts      # Get current video endpoint
    add.ts          # Add video endpoint
    remove.ts       # Remove video endpoint
  splash.tsx        # Video player page
  add.tsx           # Add song form page
  index.tsx         # Redirect to splash
  _app.tsx          # App wrapper
/lib
  queue.ts          # Queue management functions
/styles
  globals.css       # Global styles (Tailwind)
queue.txt           # Queue storage (auto-created)
```

## Queue File Format

The `queue.txt` file stores one JSON object per line:

```json
{"id":"uuid","youtubeUrl":"https://youtube.com/watch?v=xyz","videoId":"xyz","userName":"John","addedAt":"2025-12-15T10:30:00Z"}
```

## Supported YouTube URL Formats

- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://www.youtube.com/embed/VIDEO_ID`

## Technology Stack

- **Next.js** - React framework with API routes
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **YouTube IFrame API** - Video player control and event handling

## Building for Production

### Using Docker (Recommended)

```bash
docker-compose up -d
```

### Using Node.js directly

```bash
npm run build
npm start
```

## Notes

- Videos are removed from the queue after playing (no history tracking)
- The queue file is created automatically when the first video is added
- The splash page should be displayed on a screen/TV for karaoke participants
- The add page can be accessed by participants on their phones/devices
