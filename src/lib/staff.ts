import { supabaseServer } from "@/lib/supabase";

export type StaffOption = {
  id: string;
  name: string;
  email?: string | null;
};

const normalizeName = (name?: string | null) => {
  if (!name) return null;
  return name.trim();
};

export const getStaffOptions = async (): Promise<StaffOption[]> => {
  const sb = supabaseServer();
  const staff = await sb.from("staff").select("id, name, email").order("name");

  if (!staff.error && staff.data) {
    return staff.data
      .map((row) => ({
        id: String(row.id),
        name: normalizeName(row.name) ?? "Staff",
        email: row.email ?? null,
      }))
      .filter((row) => row.id);
  }

  const profiles = await sb
    .from("profiles")
    .select("id, full_name, email")
    .order("full_name");

  if (!profiles.error && profiles.data) {
    return profiles.data
      .map((row) => ({
        id: String(row.id),
        name: normalizeName(row.full_name) ?? "Staff",
        email: row.email ?? null,
      }))
      .filter((row) => row.id);
  }

  return [];
};
