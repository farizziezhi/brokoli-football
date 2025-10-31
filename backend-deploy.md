# Backend Deployment Instructions

## Option 1: Deploy Backend ke Railway (Recommended)

1. **Buat account di Railway.app**
2. **Connect GitHub repository**
3. **Deploy dengan environment variables:**
   - FOOTBALL_API_KEY=your_key
   - FOOTBALL_DATA_API_KEY=your_key
   - NODE_ENV=production
   - PORT=3333

## Option 2: Deploy Backend ke Render.com

1. **Buat account di Render.com**
2. **New Web Service dari GitHub**
3. **Build Command:** `npm run build`
4. **Start Command:** `npm start`
5. **Add environment variables**

## Option 3: Gunakan Backend yang sudah ada

Update script.js dengan URL backend yang sudah running:
```javascript
const API_BASE_URL = 'https://your-backend-url.com/api';
```

## Current Setup

Frontend akan deploy ke Vercel sebagai static site.
Backend perlu di-deploy terpisah ke platform lain.