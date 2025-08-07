# CORS Error Troubleshooting Guide

## Problem
You're getting a CORS (Cross-Origin Resource Sharing) error when trying to access the Telegram Bot API from your local development server:

```
Access to fetch at 'https://subscription-manager-tg-bot.onrender.com/products' from origin 'http://localhost:3001' has been blocked by CORS policy
```

## What is CORS?
CORS is a security feature implemented by web browsers that restricts web pages from making requests to a different domain, protocol, or port than the one serving the web page, unless the server explicitly allows it.

## Solutions

### 1. ✅ Development Proxy (Implemented)
I've added a Next.js rewrite rule to proxy API calls in development:

**File: `next.config.mjs`**
- Proxies `/api/*` to `https://subscription-manager-tg-bot.onrender.com/*`
- The API library automatically uses the proxy when running on localhost

**How it works:**
- Development: `https://subscription-manager-tg-bot.onrender.com/api/products` → `https://subscription-manager-tg-bot.onrender.com/api/products`
- Production: Direct calls to `https://subscription-manager-tg-bot.onrender.com/products`

### 2. Server-Side CORS Configuration (Recommended for Production)
The backend server needs to be configured to allow requests from your frontend domain.

**Backend changes needed:**
```javascript
// Express.js example
const cors = require('cors');

app.use(cors({
  origin: [
    'http://localhost:3001',           // Development
    'https://your-frontend-domain.com' // Production
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

**Or for all origins (not recommended for production):**
```javascript
app.use(cors({
  origin: '*'
}));
```

### 3. Environment Variables Setup
Create a `.env.local` file in your project root:

```bash
# .env.local
NEXT_PUBLIC_TELEGRAM_API_BASE_URL=https://subscription-manager-tg-bot.onrender.com
```

### 4. Alternative: Use Server-Side API Routes
Create Next.js API routes to handle the requests server-side (no CORS issues):

**File: `app/api/telegram/products/route.ts`**
```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const response = await fetch('https://subscription-manager-tg-bot.onrender.com/products');
  const data = await response.json();
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const response = await fetch('https://subscription-manager-tg-bot.onrender.com/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await response.json();
  return NextResponse.json(data);
}
```

## Current Status
✅ **Fixed for Development**: The proxy solution is implemented and should work immediately  
⚠️ **Production**: You'll need to configure CORS on the backend server for production deployment

## Testing the Fix
1. Restart your development server: `npm run dev`
2. Try creating a product again
3. Check the browser network tab to see requests going to `/api/products`

## If Issues Persist

### 1. Check the Backend Server
Test the API directly to ensure it's working:
```bash
curl -X GET https://subscription-manager-tg-bot.onrender.com/products
curl -X POST https://subscription-manager-tg-bot.onrender.com/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","description":"Test product","price":10.99}'
```

### 2. Check Network Tab
In browser DevTools → Network tab, look for:
- The actual URL being called
- Response status codes
- CORS-related error messages

### 3. Temporary Browser Workaround (Development Only)
Start Chrome with disabled security (NOT for production):
```bash
# Windows
chrome.exe --user-data-dir=/tmp/foo --disable-web-security --disable-features=VizDisplayCompositor

# Mac
open -n -a /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --args --user-data-dir="/tmp/chrome_dev_test" --disable-web-security
```

## Production Deployment Checklist
- [ ] Configure CORS on backend server
- [ ] Update environment variables
- [ ] Test API calls from production domain
- [ ] Remove any development-only workarounds