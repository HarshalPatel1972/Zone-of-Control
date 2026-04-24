# Production Deployment Guide: Zone of Control

To deploy this Neo-Brutalist multiplayer engine to production (e.g., Vercel), follow these critical steps:

## 1. Networking Infrastructure
Standard Vercel/Next.js serverless functions **do not** support long-lived WebSocket connections (`socket.io`). To maintain real-time multiplayer in production, you have two primary options:

### Option A: External Signaling Server (Recommended)
Deploy the `server.js` file to a VPS (DigitalOcean, Railway, or Render) or a containerized environment (Fly.io).
1. Update `src/hooks/useMultiplayer.ts` to use an environment variable for the server URL:
   ```typescript
   const socket = io(process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || 'http://localhost:3001');
   ```
2. Set `NEXT_PUBLIC_SOCKET_SERVER_URL` in your Vercel project settings.

### Option B: Serverless Real-time Providers
Replace the Socket.io logic with a serverless-friendly provider:
- **Pusher**: Event-based pub/sub.
- **Ably**: Robust real-time infrastructure.
- **PartyKit**: Purpose-built for multiplayer Next.js apps.

## 2. Environment Variables
Ensure the following variables are configured in your production environment:
- `NEXT_PUBLIC_SOCKET_SERVER_URL`: The URL of your deployed signaling server.

## 3. Build & Optimization
- **Next.js 14+**: The project uses App Router. All interactive components (Canvas, Hooks) are correctly marked with `'use client'`.
- **Performance**: The engine is optimized to run at 60 FPS by decoupling network state from the rendering loop.

## 4. Vercel Deployment Checklist
1. Connect your GitHub repository to Vercel.
2. Ensure the Framework Preset is set to **Next.js**.
3. Add the `NEXT_PUBLIC_SOCKET_SERVER_URL` environment variable.
4. Deploy!

> [!IMPORTANT]
> If you are testing locally across multiple devices, ensure they are on the same network and use your machine's local IP (e.g., `192.168.x.x`) instead of `localhost` in the connection strings.
