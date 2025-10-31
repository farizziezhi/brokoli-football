# Football API Proxy

Backend API proxy untuk API-Football.com menggunakan AdonisJS v6.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy file environment:
```bash
cp .env.example .env
```

3. Tambahkan API key dari API-Football.com ke file `.env`:
```
FOOTBALL_API_KEY=your_api_key_here
```

4. Jalankan server:
```bash
npm run dev
```

## API Endpoints

### GET /api/predictions
Mendapatkan prediksi pertandingan.

**Query Parameters:**
- `fixture` (required): ID pertandingan

**Contoh:**
```
GET /api/predictions?fixture=215662
```

### GET /api/standings
Mendapatkan klasemen liga.

**Query Parameters:**
- `league` (required): ID Liga
- `season` (required): Tahun musim

**Contoh:**
```
GET /api/standings?league=39&season=2023
```

## Keamanan

- API key disimpan aman di environment variables
- CORS dikonfigurasi untuk frontend development (localhost:3000)
- Semua request ke API-Football menggunakan header yang diperlukan