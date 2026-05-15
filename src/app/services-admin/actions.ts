"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { supabaseServer } from "@/lib/supabase";
import { requirePortalRole } from "@/lib/servicesPortalAuth";

const parseAmount = (value: FormDataEntryValue | null) => {
  const text = String(value ?? "").trim();
  if (!text) return 0;
  const amount = Number(text);
  return Number.isFinite(amount) ? amount : 0;
};

const safeRedirect = (path: string, fallback: string) => {
  const value = path.trim();
  return value.startsWith("/") ? value : fallback;
};

const redirectWithMessage = (
  formData: FormData,
  fallbackPath: string,
  key: "success" | "error",
  message: string
) => {
  const path = safeRedirect(
    String(formData.get("redirect_to") ?? "").trim(),
    fallbackPath
  );
  const params = new URLSearchParams();
  params.set(key, message);
  redirect(`${path}?${params.toString()}`);
};

export async function createCustomerAction(formData: FormData) {
  try {
    await requirePortalRole("admin", "/services-admin/login");
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const phone = String(formData.get("phone") ?? "").trim();
    const password = String(formData.get("password") ?? "").trim();

    if (!name || !email || !password) {
      throw new Error("Name, email, and password are required.");
    }

    const sb = supabaseServer();
    const { data, error } = await sb.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      phone: phone || undefined,
      user_metadata: {
        name,
        phone,
        role: "customer",
        roles: ["customer"],
      },
      app_metadata: {
        role: "customer",
        roles: ["customer"],
      },
    });

    if (error || !data.user?.id) {
      throw new Error(error?.message || "Could not create customer.");
    }

    const { error: insertError } = await sb.from("profiles").upsert({
      id: data.user.id,
      name,
      phone,
      email,
      role: "customer",
    });

    if (insertError) {
      throw new Error(insertError.message);
    }

    revalidatePath("/services-admin/customers");
    revalidatePath("/services-admin");
    redirectWithMessage(formData, "/services-admin/customers", "success", "customer_created");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Could not create customer.";
    redirectWithMessage(formData, "/services-admin/customers", "error", message);
  }
}

export async function saveHoldingAction(formData: FormData) {
  try {
    await requirePortalRole("admin", "/services-admin/login");
    const id = String(formData.get("id") ?? "").trim();
    const payload = {
      customer_id: String(formData.get("customer_id") ?? "").trim(),
      fund_name: String(formData.get("fund_name") ?? "").trim(),
      scheme_code: String(formData.get("scheme_code") ?? "").trim(),
      folio_number: String(formData.get("folio_number") ?? "").trim() || null,
      units: parseAmount(formData.get("units")),
      invested_amount: parseAmount(formData.get("invested_amount")),
      sip_amount: parseAmount(formData.get("sip_amount")),
      last_updated: new Date().toISOString(),
    };

    if (!payload.customer_id || !payload.fund_name || !payload.scheme_code) {
      throw new Error("Customer, fund name, and scheme code are required.");
    }

    const sb = supabaseServer();
    const query = id
      ? sb.from("mutual_fund_holdings").update(payload).eq("id", id)
      : sb.from("mutual_fund_holdings").insert(payload);
    const { error } = await query;

    if (error) throw new Error(error.message);

    revalidatePath("/services-admin/mutual-funds");
    revalidatePath("/services-admin");
    revalidatePath("/services-portal");
    redirectWithMessage(formData, "/services-admin/mutual-funds", "success", id ? "holding_updated" : "holding_created");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Could not save holding.";
    redirectWithMessage(formData, "/services-admin/mutual-funds", "error", message);
  }
}

export async function updateRequestStatusAction(formData: FormData) {
  try {
    await requirePortalRole("admin", "/services-admin/login");
    const id = String(formData.get("id") ?? "").trim();
    const status = String(formData.get("status") ?? "").trim();
    if (!id || !status) {
      throw new Error("Request ID and status are required.");
    }

    const sb = supabaseServer();
    const { error } = await sb
      .from("service_requests")
      .update({ status })
      .eq("id", id);

    if (error) throw new Error(error.message);

    revalidatePath("/services-admin/requests");
    revalidatePath("/services-admin");
    revalidatePath("/services-portal");
    redirectWithMessage(formData, "/services-admin/requests", "success", "request_updated");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Could not update request.";
    redirectWithMessage(formData, "/services-admin/requests", "error", message);
  }
}

export async function saveInsurancePolicyAction(formData: FormData) {
  try {
    await requirePortalRole("admin", "/services-admin/login");
    const customerId = String(formData.get("customer_id") ?? "").trim();
    const policyName = String(formData.get("policy_name") ?? "").trim();
    const company = String(formData.get("company") ?? "").trim();
    const renewalDate = String(formData.get("renewal_date") ?? "").trim();
    const premiumAmount = parseAmount(formData.get("premium_amount"));
    const file = formData.get("document") as File | null;

    if (!customerId || !policyName || !company || !renewalDate) {
      throw new Error("Customer, policy, company, and renewal date are required.");
    }

    const sb = supabaseServer();
    let documentUrl: string | null = null;

    if (file && file.size > 0) {
      const extension = file.name.split(".").pop() || "pdf";
      const path = `${customerId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
      const buffer = Buffer.from(await file.arrayBuffer());
      const { error: uploadError } = await sb.storage
        .from("insurance-documents")
        .upload(path, buffer, {
          contentType: file.type || "application/octet-stream",
          upsert: false,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const { data } = sb.storage.from("insurance-documents").getPublicUrl(path);
      documentUrl = data.publicUrl;
    }

    const { error } = await sb.from("insurance_policies").insert({
      customer_id: customerId,
      policy_name: policyName,
      company,
      renewal_date: renewalDate,
      premium_amount: premiumAmount,
      document_url: documentUrl,
    });

    if (error) throw new Error(error.message);

    revalidatePath("/services-admin/insurance");
    revalidatePath("/services-portal");
    redirectWithMessage(formData, "/services-admin/insurance", "success", "policy_created");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Could not save insurance policy.";
    redirectWithMessage(formData, "/services-admin/insurance", "error", message);
  }
}

export async function saveLoanAction(formData: FormData) {
  try {
    await requirePortalRole("admin", "/services-admin/login");
    const payload = {
      customer_id: String(formData.get("customer_id") ?? "").trim(),
      loan_type: String(formData.get("loan_type") ?? "").trim(),
      total_amount: parseAmount(formData.get("total_amount")),
      emi: parseAmount(formData.get("emi")),
      due_date: String(formData.get("due_date") ?? "").trim() || null,
      status: String(formData.get("status") ?? "active").trim() || "active",
    };

    if (!payload.customer_id || !payload.loan_type) {
      throw new Error("Customer and loan type are required.");
    }

    const sb = supabaseServer();
    const { error } = await sb.from("loans").insert(payload);
    if (error) throw new Error(error.message);

    revalidatePath("/services-admin/loans");
    revalidatePath("/services-portal");
    redirectWithMessage(formData, "/services-admin/loans", "success", "loan_created");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Could not save loan.";
    redirectWithMessage(formData, "/services-admin/loans", "error", message);
  }
}
