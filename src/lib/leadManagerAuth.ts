import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE_NAME = "lead_manager_admin";

export const isLeadManagerAuthed = async () => {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value === "1";
};

export const requireLeadManager = async () => {
  if (!(await isLeadManagerAuthed())) {
    redirect("/lead-manager/login");
  }
};

export const leadManagerCookieOptions = () => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
});
