import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

type ServiceLeadPayload = {
  service_type?: "finance" | "insurance" | "mutual_funds" | "properties" | "cars";
  name?: string;
  full_name?: string;
  phone?: string;
  email?: string;
  city?: string;
  message?: string;
  investment_goal?: string;
  investment_type?: string;
  monthly_sip_amount?: number | string;
  one_time_amount?: number | string;
  monthly_income?: number | string;
  existing_emi?: number | string;
  employment_type?: string;
  cibil_range?: string;
  loan_type?: string;
  desired_loan_amount?: number | string;
  estimated_eligible_amount?: number | string;
  estimated_interest_range?: string;
  approval_chance?: string;
  vehicle_type?: string;
  registration_number?: string;
  make?: string;
  model?: string;
  year?: number | string;
  fuel_type?: string;
  previous_policy_status?: string;
  claim_last_year?: string;
  policy_type?: string;
  estimated_premium_min?: number | string;
  estimated_premium_max?: number | string;
};

const ALLOWED_SERVICE_TYPES = new Set([
  "finance",
  "insurance",
  "mutual_funds",
  "properties",
  "cars",
]);

const ALLOWED_ORIGINS = new Set([
  "https://sangrocars.in",
  "https://www.sangrocars.in",
  "http://localhost:3000",
]);

const corsHeaders = (origin?: string | null) => {
  const headers = new Headers({
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  });

  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
  }

  return headers;
};

const normalizePhone = (value?: string) => {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits || null;
};

const parseOptionalNumber = (value: unknown) => {
  if (value === null || value === undefined || value === "") return null;
  const numeric = Number.parseFloat(String(value).replace(/,/g, ""));
  return Number.isFinite(numeric) ? numeric : null;
};

export async function OPTIONS(req: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(req.headers.get("origin")),
  });
}

export async function POST(req: Request) {
  const headers = corsHeaders(req.headers.get("origin"));
  const body = (await req.json().catch(() => null)) as ServiceLeadPayload | null;

  if (!body) {
    return NextResponse.json(
      { ok: false, error: "Invalid payload" },
      { status: 400, headers }
    );
  }

  const serviceType = String(body.service_type ?? "").trim();
  const fullName = String(body.full_name ?? body.name ?? "").trim();
  const name = fullName;
  const phone = normalizePhone(body.phone);
  const email = String(body.email ?? "").trim().toLowerCase() || null;
  const city = String(body.city ?? "").trim() || null;
  const message = String(body.message ?? "").trim() || null;
  const investmentGoal = String(body.investment_goal ?? "").trim() || null;
  const investmentType = String(body.investment_type ?? "").trim() || null;
  const monthlySipAmount = parseOptionalNumber(body.monthly_sip_amount);
  const oneTimeAmount = parseOptionalNumber(body.one_time_amount);
  const financeFields =
    serviceType === "finance"
      ? {
          full_name: fullName,
          monthly_income: parseOptionalNumber(body.monthly_income),
          existing_emi: parseOptionalNumber(body.existing_emi),
          employment_type: String(body.employment_type ?? "").trim() || null,
          cibil_range: String(body.cibil_range ?? "").trim() || null,
          loan_type: String(body.loan_type ?? "").trim() || null,
          desired_loan_amount: parseOptionalNumber(body.desired_loan_amount),
          estimated_eligible_amount: parseOptionalNumber(body.estimated_eligible_amount),
          estimated_interest_range: String(body.estimated_interest_range ?? "").trim() || null,
          approval_chance: String(body.approval_chance ?? "").trim() || null,
        }
      : {};
  const insuranceFields =
    serviceType === "insurance"
      ? {
          full_name: fullName,
          vehicle_type: String(body.vehicle_type ?? "").trim() || null,
          registration_number: String(body.registration_number ?? "").trim() || null,
          make: String(body.make ?? "").trim() || null,
          model: String(body.model ?? "").trim() || null,
          year: parseOptionalNumber(body.year),
          fuel_type: String(body.fuel_type ?? "").trim() || null,
          previous_policy_status: String(body.previous_policy_status ?? "").trim() || null,
          claim_last_year: String(body.claim_last_year ?? "").trim() || null,
          policy_type: String(body.policy_type ?? "").trim() || null,
          estimated_premium_min: parseOptionalNumber(body.estimated_premium_min),
          estimated_premium_max: parseOptionalNumber(body.estimated_premium_max),
        }
      : {};

  if (!ALLOWED_SERVICE_TYPES.has(serviceType)) {
    return NextResponse.json(
      { ok: false, error: "Invalid service type" },
      { status: 400, headers }
    );
  }

  if (!name || !phone) {
    return NextResponse.json(
      { ok: false, error: "Name and phone are required" },
      { status: 400, headers }
    );
  }

  try {
    const sb = supabaseServer();
    const { data: lead, error } = await sb
      .from("service_leads")
      .insert({
        service_type: serviceType,
        name,
        full_name: fullName || null,
        phone,
        email,
        city,
        message,
        investment_goal: investmentGoal,
        investment_type: investmentType,
        monthly_sip_amount: monthlySipAmount,
        one_time_amount: oneTimeAmount,
        ...financeFields,
        ...insuranceFields,
        status: "new",
      })
      .select("id")
      .single();

    if (error) {
      console.error("Service lead insert failed", {
        error: error.message,
        payload: {
          serviceType,
          name,
          phone,
          city,
          message,
          investmentGoal,
          investmentType,
          monthlySipAmount,
          oneTimeAmount,
          financeFields,
          insuranceFields,
        },
      });
      return NextResponse.json(
        { ok: false, error: "Could not save lead." },
        { status: 500, headers }
      );
    }

    if (serviceType === "mutual_funds" && lead?.id) {
      const { error: logError } = await sb.from("wealth_activity_logs").insert({
        lead_id: lead.id,
        activity_type: "lead_created",
        message: `New mutual fund lead: ${name}`,
        metadata: { phone, email, investmentGoal, investmentType, monthlySipAmount, oneTimeAmount },
      });
      if (logError) {
        console.error("Service lead activity log failed", logError);
      }
    }

    return NextResponse.json({ ok: true }, { headers });
  } catch (error) {
    console.error("Service lead insert crashed", error);
    return NextResponse.json(
      { ok: false, error: "Unexpected server error." },
      { status: 500, headers }
    );
  }
}
