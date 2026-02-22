import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { requireDealer } from "@/lib/dealerAuth";
import { syncDealerInventory } from "@/lib/dealerSync";

const SYNC_SECRET = process.env.SYNC_SECRET ?? "";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ dealerId: string }> }
) {
  const { dealerId } = await params;
  const { searchParams } = new URL(req.url);
  const token = req.headers.get("x-sync-token") || searchParams.get("token") || "";
  const hasSecret = SYNC_SECRET && token === SYNC_SECRET;

  if (!hasSecret) {
    const auth = await requireDealer();
    if (!auth.ok || auth.dealer.id !== dealerId) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
  }

  const sb = supabaseServer();
  const { data: dealer, error: dErr } = await sb
    .from("dealers")
    .select("*")
    .eq("id", dealerId)
    .single();

  if (dErr || !dealer) {
    return NextResponse.json(
      { ok: false, error: "Dealer not found" },
      { status: 404 }
    );
  }

  const mode = (searchParams.get("mode") ?? "").toLowerCase();
  const result = await syncDealerInventory(dealer, mode || "auto");
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
