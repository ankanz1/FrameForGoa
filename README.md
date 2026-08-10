# HH Goa 2026 Frame Generator

A Vite, React, and Express app for creating HH Goa 2026 profile frames and builder ID cards. Upload a photo, add builder details, generate the campaign artwork, preview it on an interactive 3D card, download a PNG, or share it to X.

## Features

- HH Goa PFP artwork rendered at 2048 x 2048.
- Background removal with `@imgly/background-removal`.
- Existing photo crop, zoom, and position controls.
- Dynamic builder ID-card artwork rendered at the existing 800 x 1100 card ratio.
- Interactive Three.js/Rapier 3D ID-card preview.
- PNG downloads for PFPs and builder cards.
- X sharing through the existing upload and public preview flow.
- Optional Cloudinary uploads for durable social preview images.

## Requirements

- Node.js 20 or newer
- pnpm

## Setup

```bash
pnpm install
```

Copy the environment template when using server-side sharing or Cloudinary:

```bash
Copy-Item .env.example .env
```

At minimum, set `APP_URL` for share links that need to be crawled by X. Cloudinary variables are optional. Without Cloudinary, generated uploads are stored in memory and are cleared when the server restarts.

## Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start the Vite development server through Express |
| `pnpm lint` | Run the TypeScript check without emitting files |
| `pnpm build` | Build the frontend and bundled production server |
| `pnpm start` | Start the bundled production server |
| `pnpm preview` | Preview the Vite production build |
| `pnpm clean` | Remove generated distribution files |

## Rendering Flow

The main canvas pipeline lives in `src/lib/canvasDraw.ts`:

1. The uploaded image is processed into a transparent subject.
2. The PFP renderer composes the fixed HH Goa artwork and preserves the selected photo position.
3. The ID-card renderer creates the flat front texture using the builder details.
4. The generated ID-card image is passed to the existing Three.js/Rapier card in `src/components/PhysicsCardPreview.tsx`.
5. The same generated canvas is used for preview, download, and sharing.

Background removal is isolated and cached in `src/services/removeBackground.ts`.

## Environment Variables

See `.env.example` for the complete list:

- `APP_URL`: Public base URL used in generated share links.
- `CLOUDINARY_CLOUD_NAME`: Optional Cloudinary cloud name.
- `CLOUDINARY_API_KEY`: Optional Cloudinary API key.
- `CLOUDINARY_API_SECRET`: Optional Cloudinary API secret.
- `GEMINI_API_KEY`: Reserved for Gemini integrations.

## Project Notes

The root project is the active Vite/Express application. The separate `hhgoa-frame-generator (1)/hhgoa-frame` directory is an independent Next.js project and has its own README and package configuration.
