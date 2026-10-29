# Wedding Photo Platform

I built this for my own wedding. Every wedding ends the same way: hundreds of good photos sitting on guests' phones, spread across WhatsApp groups, and most of them never reach the couple. So I wanted one link and one QR code on the tables, where any guest could drop their photos without installing anything or creating an account.

It ran on the day, guests used it, and the photos landed in one shared album. This repo is that version, with a fictional couple in place of our names.

**Live demo:** https://wedding-photo-platform.vercel.app

## What guests see

- A gallery home page with each guest's photos grouped into their own album, plus a rotating slideshow of featured shots
- A two-step upload: type your name, pick who you're with (bride's family, groom's friends and so on), then add photos
- Photos are compressed in the browser before upload and show up in the gallery straight away
- A guest can delete their own photos for 24 hours after uploading, in case they posted the wrong one
- It installs to the home screen as a PWA and has a dark mode

## What the couple gets

- An admin dashboard behind a server-side login, with every photo, stats per guest, and delete controls
- Printable A4 QR tickets for the tables, six to a page
- Download everything as a single ZIP
- A read-only gallery link to share with people who couldn't come
- Email notifications when guests upload (via Resend)

## Problems worth mentioning

These are the ones that only showed up with real guests on real phones:

- **Big photos failed on upload.** Vercel's serverless functions cap request bodies at 4.5MB, so validating a full photo on the server gave guests a confusing error on anything larger, and Safari turned it into a meaningless message. The validation route only ever needed the first few bytes of the file to check its type, so now the browser sends just a 64-byte header slice. That made it safe to raise the upload limit.
- **Everyone at the venue shared one rate limit.** The limit was per IP address, but guests at the venue were all on the same WiFi, so a handful of busy uploaders could block everyone else. It now keys on each guest's own token and only falls back to IP when there isn't one.
- **Similar photos were rejected as duplicates.** Duplicate detection used a perceptual hash with a database-wide unique constraint, so burst shots, or two guests photographing the same moment, collided and failed. It now stores a SHA-256 of the actual file bytes and only treats an exact re-upload by the same guest as a duplicate. The failed upload also used to leave an orphaned file in storage, which is now cleaned up.
- **iOS Safari aborted the page.** The Supabase client opens a WebSocket even when realtime isn't in use, and the Content Security Policy blocked it. Adding the Supabase WebSocket origin to `connect-src` fixed it.
- **QR tickets spilled onto a second page.** Getting exactly six tickets onto an A4 sheet with nothing overflowing took fixed row heights and some careful arithmetic on millimetres.

## Security

- Admin authentication is server-side, with an httpOnly JWT cookie
- Row Level Security policies on Supabase stop anyone deleting photos through the public client
- Rate limiting on uploads through Upstash Redis
- EXIF data is stripped from photos before upload, so GPS location doesn't leak
- File types are checked from the file header, not the extension

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Supabase (Postgres, Storage, Row Level Security) · Upstash Redis · Resend · JSZip · deployed on Vercel

## Running it locally

You'll need Node.js 18 or newer and a Supabase project (the free tier is enough).

```bash
git clone https://github.com/DataByOlabiyi/wedding-photo-sharing.git
cd wedding-photo-sharing
npm install
```

Create a `.env.local` file in the project root with these values:

| Variable | What it's for |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon (public) key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key. Server-only, never expose it |
| `ADMIN_PASSWORD` | Password for the admin dashboard |
| `JWT_SECRET` | Long random string used to sign the admin session |
| `NEXT_PUBLIC_GALLERY_TOKEN` | Token for the shareable read-only gallery link |
| `RESEND_API_KEY` | Optional, for upload email notifications |
| `COUPLE_EMAIL` | Optional, where those notifications go |
| `NEXT_PUBLIC_URL` | Base URL, e.g. `http://localhost:3000` |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Optional, for rate limiting |

Then run the SQL files in `scripts/` against your Supabase database in order (the Supabase SQL editor works fine), and start the dev server:

```bash
npm run dev
```

The couple's names, date and site URL live in `lib/site-config.ts`.

## Routes

| Route | Purpose | Access |
| --- | --- | --- |
| `/` | Gallery home with guest albums | Public |
| `/upload` | Upload photos | Public |
| `/guest/[guestId]` | One guest's photos | Public |
| `/gallery/[token]` | Shareable read-only gallery | Token |
| `/admin` | Dashboard | Admin |
| `/admin/login` | Admin login | Public |
| `/admin/qr` | QR code and printable tickets | Admin |

## What's next

I'm turning this into a multi-tenant version, so any couple can sign up, create their own event and pay for it, instead of it being set up for one wedding. That work is happening separately and isn't in this repo yet.
