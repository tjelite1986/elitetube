# EliteTube

Självhostad mediaspelare byggd med Next.js 14. Streama lokala filer, direkta URL:er och YouTube/Vimeo via yt-dlp — allt i ett YouTube-inspirerat gränssnitt.

## Funktioner

- **Mediabiblotek** — lokala filer, direkta URL:er, YouTube/Vimeo via yt-dlp
- **Adult-sektion** — separat 18+-bibliotek med PIN-lås
- **Spellistor** — skapa och spela spellistor med auto-next
- **Tagg-kategorier** — filtrera innehåll efter taggar på start- och söksidor
- **Sort & filter** — sortera på nyaste/mest sedda/längst, filtrera på videolängd
- **Hover-preview** — förhandsgranska video vid hovring över kort
- **Likes/dislikes** — tumme upp/ned med procentbar
- **Import av spellistor** — importera hela YouTube-spellistor med ett klick
- **Admin-panel** — hantera media, källor, taggar och adult-inställningar
- **Bulk-hantering** — markera flera mediafiler, hämta metadata eller radera i bulk
- **Mobil-anpassad** — bottom nav, full-bredd thumbnails, responsiv layout
- **Docker-redo** — multi-stage Dockerfile med yt-dlp och ffmpeg

## Stack

- [Next.js 14](https://nextjs.org/) (App Router)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)
- [NextAuth.js](https://next-auth.js.org/)
- [yt-dlp](https://github.com/yt-dlp/yt-dlp)

## Kom igång

### Docker (rekommenderat)

1. Kopiera miljövariabelfilen och fyll i värden:

```bash
cp .env.example .env
```

2. Exempel på `docker-compose.yml`:

```yaml
services:
  elitetube:
    build: .
    container_name: elitetube
    restart: unless-stopped
    ports:
      - "3001:3001"
    volumes:
      - elitetube-data:/app/data
      - /path/to/your/media:/media:ro
    environment:
      - NEXTAUTH_SECRET=en-lång-slumpmässig-sträng
      - NEXTAUTH_URL=http://localhost:3001
      - ADMIN_PASSWORD=ditt-lösenord
      - DATABASE_PATH=/app/data/elitetube.db
      - MEDIA_PATH=/media

volumes:
  elitetube-data:
```

3. Starta:

```bash
docker compose up -d --build
```

Öppna `http://localhost:3001` och logga in med användaren `admin` och det lösenord du satte i `ADMIN_PASSWORD`.

### Lokal utveckling

Kräver Node.js 18+ och yt-dlp installerat.

```bash
npm install
cp .env.example .env.local
# Redigera .env.local med dina värden
npm run dev
```

Appen startar på `http://localhost:3001`.

## Miljövariabler

| Variabel | Beskrivning | Exempel |
|----------|-------------|---------|
| `NEXTAUTH_SECRET` | Hemlig nyckel för JWT-signering | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Publik URL till appen | `https://elitetube.example.com` |
| `ADMIN_PASSWORD` | Lösenord för admin-kontot | `mittlösenord` |
| `DATABASE_PATH` | Sökväg till SQLite-databasen | `/app/data/elitetube.db` |
| `MEDIA_PATH` | Rotsökväg för lokala mediafiler | `/media` |

## Mediakällor

Lägg till källor under **Admin → Hantera källor**:

- **Lokal sökväg** — mapp på servern som monteras in i Docker
- **SMB** — nätverksdelning (monteras externt och pekas på som lokal sökväg)
- **Extern URL** — direktlänk till mediafil eller yt-dlp-kompatibel URL

## Adult-innehåll

1. Sätt en PIN-kod under **Admin → Adult-inställningar**
2. Markera media som `18+` vid tillägg eller redigering
3. Adult-innehåll visas enbart under 18+-sektionen efter att PIN angetts

## Licens

Privat projekt — ej för distribution.
