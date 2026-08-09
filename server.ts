import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

const app = express();
const PORT = 3000;

// Body parser
app.use(express.json({ limit: '15mb' }));

// In-memory store for generated graphics (for X share preview links)
// Key: graphicId, Value: { dataUrl: string, remoteUrl?: string, createdAt: number }
const graphicsStore = new Map<
  string,
  { dataUrl: string; remoteUrl?: string; createdAt: number }
>();

// Clean up graphics older than 24 hours periodically
setInterval(() => {
  const now = Date.now();
  for (const [id, record] of graphicsStore.entries()) {
    if (now - record.createdAt > 24 * 60 * 60 * 1000) {
      graphicsStore.delete(id);
    }
  }
}, 60 * 60 * 1000);

// API endpoint to store a generated graphic & return shareable URL
app.post('/api/upload', async (req, res) => {
  try {
    const { image } = req.body;
    if (!image || typeof image !== 'string') {
      return res.status(400).json({ error: 'Image data URL required' });
    }

    const id = Math.random().toString(36).substring(2, 12);

    // Try to upload to Cloudinary first for a durable public image URL.
    // Falls back to the in-memory data URL if Cloudinary isn't configured.
    let remoteUrl: string | undefined;
    if (isCloudinaryConfigured()) {
      try {
        const result = await cloudinary.uploader.upload(image, {
          folder: 'hhgoa-2026',
          public_id: id,
          resource_type: 'image',
          format: 'png',
          overwrite: true,
        });
        remoteUrl = result.secure_url;
        console.log('Uploaded graphic to Cloudinary', remoteUrl);
      } catch (err) {
        console.error('Cloudinary upload failed, using in-memory fallback', err);
      }
    }

    graphicsStore.set(id, {
      dataUrl: image,
      remoteUrl,
      createdAt: Date.now(),
    });

    const appUrl = process.env.APP_URL || `http://localhost:${PORT}`;
    const shareUrl = `${appUrl}/s/${id}`;

    res.json({ id, url: shareUrl, rawImageUrl: `${appUrl}/api/image/${id}.png` });
  } catch (err) {
    console.error('Upload error', err);
    res.status(500).json({ error: 'Failed to process image' });
  }
});

// Resolve the public image URL for a graphic (Cloudinary when available)
function imageUrlFor(id: string) {
  const record = graphicsStore.get(id);
  if (record?.remoteUrl) return record.remoteUrl;
  const appUrl = process.env.APP_URL || `http://localhost:${PORT}`;
  return `${appUrl}/api/image/${id}.png`;
}

// API endpoint to serve raw image PNG (redirects to Cloudinary when available)
app.get('/api/image/:id.png', (req, res) => {
  const id = req.params.id;
  const record = graphicsStore.get(id);

  if (!record) {
    return res.status(404).send('Image not found or expired');
  }

  if (record.remoteUrl) {
    res.writeHead(302, {
      Location: record.remoteUrl,
      'Cache-Control': 'public, max-age=86400',
    });
    return res.end();
  }

  const base64Data = record.dataUrl.replace(/^data:image\/\w+;base64,/, '');
  const imgBuffer = Buffer.from(base64Data, 'base64');

  res.writeHead(200, {
    'Content-Type': 'image/png',
    'Content-Length': imgBuffer.length,
    'Cache-Control': 'public, max-age=86400',
  });
  res.end(imgBuffer);
});

// Share landing page with dynamic OpenGraph meta tags for X previews
app.get('/s/:id', (req, res) => {
  const id = req.params.id;
  const record = graphicsStore.get(id);
  const appUrl = process.env.APP_URL || `http://localhost:${PORT}`;
  const imageUrl = imageUrlFor(id);

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>HH Goa 2026 — Builder Graphic</title>
      
      <!-- OpenGraph / X Social Meta Tags -->
      <meta property="og:title" content="HH Goa 2026 — Builder Graphic" />
      <meta property="og:description" content="I framed my profile for HH Goa 2026! #FrameInGoa" />
      <meta property="og:image" content="${imageUrl}" />
      <meta property="og:image:type" content="image/png" />
      <meta property="og:image:width" content="800" />
      <meta property="og:image:height" content="1100" />
      
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@HHGoa2026" />
      <meta name="twitter:title" content="HH Goa 2026 — Builder Graphic" />
      <meta name="twitter:description" content="I framed my profile for HH Goa 2026! #FrameInGoa" />
      <meta name="twitter:image" content="${imageUrl}" />

      <style>
        body {
          background-color: #08140e;
          color: #fef6e4;
          font-family: system-ui, sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          margin: 0;
          padding: 20px;
          box-sizing: border-box;
        }
        .container {
          max-width: 600px;
          text-align: center;
        }
        img {
          max-width: 100%;
          height: auto;
          border-radius: 16px;
          border: 3px solid #f3c048;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
          margin-bottom: 24px;
        }
        .btn {
          display: inline-block;
          background-color: #f3c048;
          color: #08140e;
          font-weight: bold;
          padding: 12px 24px;
          border-radius: 12px;
          text-decoration: none;
          margin: 6px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>HH Goa 2026 Builder Frame</h1>
        ${
          record
            ? `<img src="${imageUrl}" alt="HH Goa 2026 Graphic" />`
            : `<p>Graphic expired or not found. Create yours below!</p>`
        }
        <div>
          <a href="/" class="btn">Create Your Frame</a>
        </div>
      </div>
    </body>
    </html>
  `;

  res.send(html);
});

// Vite integration / Static distribution
async function main() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

main().catch(console.error);
