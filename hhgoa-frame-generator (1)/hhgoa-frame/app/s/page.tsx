import type { Metadata } from "next";
import Link from "next/link";

type SearchParams = Promise<{
  img?: string;
  name?: string;
  kind?: string;
}>;

function isSafeImageUrl(url: string | undefined): url is string {
  if (!url) return false;
  try {
    const u = new URL(url);
    return u.protocol === "https:";
  } catch {
    return false;
  }
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const { img, name, kind } = await searchParams;
  const title = name
    ? `${name} is building at Hacker House Goa 2026`
    : "Hacker House Goa 2026";
  const description =
    kind === "card"
      ? "My builder ID card for Hacker House Goa 2026 — 28–31 Oct, Goa, India."
      : "My profile frame for Hacker House Goa 2026 — 28–31 Oct, Goa, India.";

  const images = isSafeImageUrl(img) ? [{ url: img, width: 1080, height: 1080 }] : [];

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: isSafeImageUrl(img) ? [img] : [],
    },
  };
}

export default async function SharePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { img, name, kind } = await searchParams;
  const safeImg = isSafeImageUrl(img) ? img : null;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-16 gap-8 text-center">
      <p className="eyebrow text-sm" style={{ color: "var(--hh-gold)" }}>
        Hacker House Goa · 28–31 Oct 2026
      </p>
      <h1 className="hh-display text-3xl md:text-5xl font-bold" style={{ color: "var(--hh-cream)" }}>
        {name ? `${name} is building at HH Goa` : "Someone is building at HH Goa"}
      </h1>

      {safeImg ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={safeImg}
          alt={kind === "card" ? "Builder ID card" : "Profile frame"}
          className="w-full max-w-md rounded-lg border"
          style={{ borderColor: "rgba(246,200,26,0.35)" }}
        />
      ) : (
        <p style={{ color: "var(--hh-cream)" }}>This graphic couldn&apos;t be found.</p>
      )}

      <Link
        href="/"
        className="hh-btn px-6 py-3 text-sm font-semibold rounded-sm"
      >
        Make your own →
      </Link>
    </main>
  );
}
