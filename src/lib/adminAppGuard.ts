import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/adminAuth";

export const requireAdminApp = async () => {
  const auth = await requireAdmin();
  if (!auth.ok) {
    redirect("/admin-app/login?error=unauthorized");
  }
  return auth;
};
