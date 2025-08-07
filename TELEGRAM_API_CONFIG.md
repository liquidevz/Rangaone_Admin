# Telegram API Configuration

## Environment Variable Usage

All Telegram bot APIs in `/dashboard/bot` are configured to use the `NEXT_PUBLIC_TELEGRAM_API_BASE_URL` environment variable.

### Configuration Files

#### 1. `lib/config.ts`
```typescript
export const config = {
  telegramApiBaseUrl: process.env.NEXT_PUBLIC_TELEGRAM_API_BASE_URL || "https://subscription-manager-tg-bot.onrender.com",
  // ... other config
}

export const TELEGRAM_API_BASE_URL = config.telegramApiBaseUrl
```

#### 2. `lib/api-telegram-bot.ts`
```typescript
import { TELEGRAM_API_BASE_URL } from "@/lib/config";

const getApiBaseUrl = () => {
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return '/api/telegram-proxy'; // Uses proxy in development
  }
  return TELEGRAM_API_BASE_URL; // Uses environment variable in production
};
```

#### 3. `next.config.mjs`
```javascript
{
  source: '/api/telegram-proxy/:path*',
  destination: `${process.env.NEXT_PUBLIC_TELEGRAM_API_BASE_URL || 'https://subscription-manager-tg-bot.onrender.com'}/:path*`,
}
```

### API Endpoints

All API endpoints now use the `/api` prefix:

#### Products API
- `GET /api/products` - List all products
- `POST /api/products` - Create a new product
- `PUT /api/products/{id}` - Update a product
- `DELETE /api/products/{id}` - Delete a product

#### Groups API
- `GET /api/groups` - List all Telegram groups
- `GET /api/groups/unmapped` - List unmapped Telegram groups

#### Subscriptions API
- `GET /api/subscriptions` - List subscriptions
- `POST /api/subscribe` - Create subscription
- `DELETE /api/subscriptions` - Cancel subscription
- `POST /api/subscriptions/{id}/cancel` - Cancel subscription by ID

#### Users API
- `GET /api/users` - List users

#### Webhook API
- `GET /api/telegram/webhook/test` - Test webhook

### Components Using Telegram API

All components in `/dashboard/bot` use the centralized API client:

- `components/telegram-products-tab-new.tsx` ✅
- `components/telegram-groups-tab.tsx` ✅
- `components/telegram-mapping-tab.tsx` ✅
- `components/telegram-subscriptions-tab.tsx` ✅
- `components/telegram-settings-tab.tsx` ✅

### Environment Variable Setup

To use a different Telegram API endpoint:

1. **Set the environment variable:**
   ```bash
   NEXT_PUBLIC_TELEGRAM_API_BASE_URL=https://your-telegram-api.com
   ```

2. **Restart the development server:**
   ```bash
   npm run dev
   ```

### Development vs Production

- **Development**: Uses proxy (`/api/telegram-proxy`) to avoid CORS issues
- **Production**: Uses `NEXT_PUBLIC_TELEGRAM_API_BASE_URL` directly

### Debug Information

In development, the console will show:
- `Telegram API Base URL: https://your-api-url.com`
- `Using proxy for development`

### Verification

All Telegram bot API calls go through:
1. `lib/api-telegram-bot.ts` (centralized client)
2. `lib/config.ts` (environment variable)
3. `next.config.mjs` (proxy configuration)

No direct API calls bypass this configuration. 