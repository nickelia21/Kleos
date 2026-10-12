import { NextResponse } from "next/server";
import { spotPrice } from "@/lib/curve";
import { getVips } from "@/lib/store";

export const dynamic = "force-dynamic";

/** Read-only market summary (also used by smoke tests). */
export async function GET() {
  const vips = getVips().map((v) => ({
    id: v.id,
    slug: v.slug,
    name: v.name,
    category: v.category,
    price: spotPrice(v.curve, v.sharesOutstanding),
    sharesOutstanding: v.sharesOutstanding,
    reserve: v.reserve,
    totalVolume: v.totalVolume,
    indexScore: v.indexScore,
    curveBoughtPct: (v.sharesOutstanding / v.supplySoftCap) * 100,
  }));
  return NextResponse.json({ ok: true, vips });
}
