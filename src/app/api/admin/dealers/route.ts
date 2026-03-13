import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { supabaseServer } from "@/lib/supabase";
import { extractDealerCode, isValidDealerCode, withDealerCode } from "@/lib/dealerCode";

const randomSixDigit = () =>
  String(Math.floor(100000 + Math.random() * 900000));

const buildReturnUrl = (
  req: Request,
  action: "dealer_created" | "error",
  error?: string
) => {
  const url = new URL("/admin/dealers", req.url);
  url.searchParams.set("action", action);
  if (error) url.searchParams.set("error", error);
  return url;
};

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.redirect(new URL("/admin/login?error=unauthorized", req.url));
  }

  const form = await req.formData();
  const name = String(form.get("name") ?? "").trim();
  const requestedCode = String(form.get("dealer_code") ?? "")
    .replace(/\D/g, "")
    .slice(0, 6);

  if (!name) {
    return NextResponse.redirect(
      buildReturnUrl(req, "error", encodeURIComponent("Dealer name is required."))
    );
  }

  const sb = supabaseServer();
  const { data: existingRows, error: loadError } = await sb
    .from("dealers")
    .select("description")
    .limit(5000);

  if (loadError) {
    return NextResponse.redirect(
      buildReturnUrl(req, "error", encodeURIComponent(loadError.message))
    );
  }

  const usedCodes = new Set(
    ((existingRows ?? []) as { description?: string | null }[])
      .map((row) => extractDealerCode(row.description))
      .filter(Boolean)
  );

  let dealerCode = requestedCode;
  if (dealerCode && !isValidDealerCode(dealerCode)) {
    return NextResponse.redirect(
      buildReturnUrl(
        req,
        "error",
        encodeURIComponent("Dealer ID must be exactly 6 digits.")
      )
    );
  }

  if (dealerCode && usedCodes.has(dealerCode)) {
    return NextResponse.redirect(
      buildReturnUrl(
        req,
        "error",
        encodeURIComponent("That 6 digit dealer ID is already used.")
      )
    );
  }

  if (!dealerCode) {
    for (let tries = 0; tries < 20; tries += 1) {
      const candidate = randomSixDigit();
      if (!usedCodes.has(candidate)) {
        dealerCode = candidate;
        break;
      }
    }
  }

  if (!dealerCode) {
    return NextResponse.redirect(
      buildReturnUrl(
        req,
        "error",
        encodeURIComponent("Could not generate a unique 6 digit dealer ID.")
      )
    );
  }

  const payloads: Record<string, unknown>[] = [
    {
      name,
      description: withDealerCode(null, dealerCode),
    },
    {
      dealer_name: name,
      description: withDealerCode(null, dealerCode),
    },
    {
      name,
    },
  ];

  for (const payload of payloads) {
    const { error } = await sb.from("dealers").insert(payload);
    if (!error) {
      return NextResponse.redirect(buildReturnUrl(req, "dealer_created"));
    }
  }

  return NextResponse.redirect(
    buildReturnUrl(req, "error", encodeURIComponent("Could not create dealer."))
  );
}
