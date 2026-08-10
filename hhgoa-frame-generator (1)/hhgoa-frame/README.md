# HH Goa 2026 — Frame / ID Card Generator

Built for the HH Goa 2026 shortlisting task. Upload a photo, get a
branded HH Goa 2026 graphic back in a couple of seconds — no login,
one pass, mobile-friendly. Both formats from the brief are implemented:

- **Event Poster** — a full-bleed branded poster (matches the custom
  design brief) with string lights, the arced "HACKER HOUSE" wordmark,
  the pink "गोवा" badge, "BUILT IN GOA / FOR BUILDERS" tag, a "BUILDER
  IN GOA" stamp, and a sunrise/palm scene. The uploaded photo dissolves
  into the golden sun and side palm trees via a feathered edge (not a
  hard-edged box), with a warm color tint so it reads as part of the
  illustration rather than pasted on.
- **Builder ID Card** — a portrait badge with the photo, name, stack/role,
  and an auto-generated whimsical "builder title" (with a reroll button),
  laid out with the site's sunrise/palm motif.

Everything is drawn live with Canvas 2D — no template image assets — so
it always matches the exact brand colors/type instead of a logo pasted
on a generic badge.

## How it works

1. **Upload** — JPG/PNG/HEIC (HEIC/HEIF from iPhone is converted to JPEG
   client-side with `heic2any` before anything touches a canvas).
2. **Crop** — drag/zoom with `react-easy-crop`, so off-center or oddly
   cropped photos still land well inside the frame or card.
3. **Generate** — `lib/canvasDraw.ts` composites the cropped photo with
   the frame/card artwork on an in-memory `<canvas>`. This is instant,
   not a server round-trip.
4. **Download** — canvas is exported as a real PNG (`canvas.toBlob`),
   not just an on-screen render.
5. **Share to X** — the generated PNG is uploaded to Vercel Blob storage
   to get a public URL, which is passed to `/s?img=...`. That route sets
   `og:image`/`twitter:image` meta tags dynamically (`generateMetadata`
   in `app/s/page.tsx`), so the X link preview shows the actual graphic
   instead of a blank thumbnail. A pre-filled tweet intent opens with
   `#FrameInGoa` already in the caption.

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:3000. The generator itself (upload → crop →
download) works immediately with zero configuration. "Share to X" needs
the blob storage step below — without it, Download still works fine and
you can attach the PNG to a tweet manually.

## Deploying (Vercel)

1. Push this repo to GitHub and import it at vercel.com/new, **or**
   run `npx vercel` from this folder.
2. In the Vercel project, go to **Storage → Create Database → Blob**
   and connect it to the project. This automatically sets the
   `BLOB_READ_WRITE_TOKEN` environment variable used by
   `app/api/upload/route.ts`.
3. Redeploy. "Share to X" will now upload each generated graphic and
   link to a page with a working OG image preview.

You don't need any other env vars, a database, or a login system —
that's intentional, per the "no login wall, works in one pass" requirement.

### Not using Vercel Blob?

`app/api/upload/route.ts` just needs to return `{ url: "<public https url>" }`
for the uploaded PNG. Swap in Cloudinary's unsigned upload, S3 + a
public bucket, or any other object store — the rest of the app doesn't
care how the URL was produced.

## Known gotchas

- **Feathering uses pixel-alpha editing, not `destination-in` gradients.**
  The "normal" way to fade an image's edge to transparent on canvas is a
  gradient fill with `globalCompositeOperation = "destination-in"`. In
  testing that silently zeroed out the entire photo layer in some
  environments (offscreen `<canvas>`, some headless setups). `drawFeatheredPhoto`
  in `lib/canvasDraw.ts` instead edits the alpha channel directly via
  `getImageData`/`putImageData`, which is slower but deterministic
  everywhere. If you're extending the feathering (e.g. adding a bottom
  fade), keep using this approach rather than switching back to
  compositing-operation tricks.
- Canvas `ctx.font` needs the literal font-family name, not a CSS custom
  property — that's why fonts are loaded via a plain `<link>` tag in
  `layout.tsx` instead of `next/font`.

## Project structure

```
app/
  page.tsx          — the generator UI (upload/crop/fields/generate/share)
  layout.tsx         — loads Playfair Display / IBM Plex Mono / Inter
  globals.css         — brand tokens (green/gold/pink) + component styles
  api/upload/route.ts — stores the generated PNG, returns a public URL
  s/page.tsx          — share landing page with dynamic OG image meta
lib/
  canvasDraw.ts       — all Canvas 2D rendering (poster, ID card, feathered
                         photo compositing, string lights, sunrise/palm motifs)
  builderTitle.ts     — whimsical builder-title generator
```

## Brand reference

Colors, type, and motifs are pulled directly from hhgoa.com: deep forest
green background, gold/yellow display serif, hot-pink accent (used on
"गोवा" on the site), checkerboard ticket-style buttons, and the
sunrise-over-ocean illustration. See hhgoa.com's Brand Kit link for the
official assets if you want to swap in the real logo mark.

## Submission checklist (from the task doc)

- [x] Live working link — deploy per steps above, then paste the URL
      into the shortlisting form: https://forms.gle/jM5hTaGvsrfEfixPA
- [ ] Post the end result on X with **#FrameInGoa** — the app pre-fills
      this, but you still need to actually hit Tweet.
- Deadline: 11:59pm, 13 Aug 2026. One submission per team.
