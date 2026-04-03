import { NextRequest, NextResponse } from "next/server";
import { getAppSettings } from "@/app/api/admin/settings/route";

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * GET /api/delivery-fee?lat=X&lng=Y
 * Returns the calculated delivery fee for a given location.
 * Public endpoint — no auth required.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get("lat") ?? "");
  const lng = parseFloat(searchParams.get("lng") ?? "");

  const settings = await getAppSettings();
  let fee = settings.delivery_fee_fixed;

  if (settings.delivery_fee_mode === "auto" && !isNaN(lat) && !isNaN(lng)) {
    const distKm = haversineKm(settings.kitchen_lat, settings.kitchen_lng, lat, lng);
    fee = settings.delivery_fee_base + Math.round(distKm * settings.delivery_fee_per_km);
  }

  return NextResponse.json({ data: { fee } });
}
