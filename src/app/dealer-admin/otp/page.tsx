import { redirect } from "next/navigation";

export default function DealerOtpPage() {
  redirect("/dealer-admin/login?error=otp_disabled");
}
