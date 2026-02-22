import Link from "next/link";

type Props = {
  dealerId: string;
  dealerName?: string | null;
};

export default function DealerNav({ dealerId, dealerName }: Props) {
  return (
    <nav className="dealer-nav">
      <div className="dealer-nav__brand">
        <span>{dealerName ?? "Dealer Portal"}</span>
      </div>
      <div className="dealer-nav__links">
        <Link href="/dealer-admin">Dashboard</Link>
        <Link href="/dealer-admin/listings">Listings</Link>
        <Link href="/dealer-admin/whatsapp">WhatsApp Post</Link>
        <Link href="/dealer-admin/leads">Leads</Link>
        <Link href="/dealer-admin/profile">Profile</Link>
        <Link href={`/dealer/${dealerId}`} target="_blank" rel="noreferrer">
          Public page
        </Link>
      </div>
      <form method="post" action="/api/dealer/logout">
        <button className="btn btn--ghost" type="submit">
          Log out
        </button>
      </form>
    </nav>
  );
}
