import ContactForm from "@/app/components/ContactForm";

const buildWhatsAppLink = () => {
  const raw =
    process.env.NEXT_PUBLIC_SUPPORT_PHONE ??
    process.env.NEXT_PUBLIC_SANGRO_PHONE ??
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  const message =
    process.env.NEXT_PUBLIC_WHATSAPP_MESSAGE ??
    "Hi, I want to contact SangroCars.";
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
};

const buildCallLink = () => {
  const raw =
    process.env.NEXT_PUBLIC_SUPPORT_PHONE ??
    process.env.NEXT_PUBLIC_SANGRO_PHONE ??
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";
  const digits = raw.replace(/\D/g, "");
  return digits ? `tel:${digits}` : "";
};

type Props = {
  id?: string;
  compact?: boolean;
  source?: string;
};

export default function ContactSection({ id, compact = false, source = "contact_section" }: Props) {
  const whatsappHref = buildWhatsAppLink();
  const callHref = buildCallLink();

  return (
    <section className={`cw-contact-section${compact ? " cw-contact-section--compact" : ""}`} id={id}>
      <div className="cw-contact-section__copy">
        <span className="cw-contact-section__kicker">Contact SangroCars</span>
        <h2>Contact SangroCars</h2>
        <p>
          Have a question about buying or selling a car? Our team is here to help.
        </p>
        <div className="cw-contact-details">
          <p><strong>Name:</strong> Ayush Sharma</p>
          <p><strong>Phone:</strong> 9041322997</p>
          <p><strong>Email:</strong> ayushsharma807@gmail.com</p>
          <p><strong>Location:</strong> Jalandhar, Punjab, India</p>
          <p><strong>WhatsApp:</strong> Available for quick responses</p>
          <p><strong>Support Email:</strong> support@sangrocars.in</p>
        </div>
        <div className="cw-contact-actions">
          {whatsappHref && (
            <a className="cw-header__btn cw-header__btn--whatsapp" href={whatsappHref} target="_blank" rel="noreferrer">
              WhatsApp SangroCars
            </a>
          )}
          {callHref && (
            <a className="cw-header__btn cw-header__btn--ghost" href={callHref}>
              Call SangroCars
            </a>
          )}
        </div>
      </div>
      <div className="cw-contact-section__form-card">
        <ContactForm source={source} />
      </div>
    </section>
  );
}
