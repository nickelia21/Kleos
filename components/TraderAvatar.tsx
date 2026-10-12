/* eslint-disable @next/next/no-img-element */

// Trader avatar: uploaded image if present, otherwise initials on a warm
// tint derived from the name — same visual family as the VIP avatars.

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const chars = (parts.length >= 2 ? parts[0][0] + parts[parts.length - 1][0] : (parts[0] ?? "?").slice(0, 2));
  return chars.toUpperCase();
}

function hueOf(name: string): number {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 360;
  return (h % 44) + 4; // stay in the brand's warm band
}

export function TraderAvatar({
  name,
  image,
  size = 40,
}: {
  name: string;
  image?: string | null;
  size?: number;
}) {
  const radius = Math.round(size * 0.28);
  if (image) {
    return (
      <img
        src={image}
        alt=""
        width={size}
        height={size}
        className="shrink-0 select-none object-cover"
        style={{ width: size, height: size, borderRadius: radius }}
      />
    );
  }
  const hue = hueOf(name);
  return (
    <span
      aria-hidden
      className="inline-flex items-center justify-center font-serif-brand shrink-0 select-none"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        fontSize: Math.round(size * 0.38),
        background: `hsl(${hue} 42% 20%)`,
        color: `hsl(${hue} 72% 72%)`,
      }}
    >
      {initialsOf(name)}
    </span>
  );
}
