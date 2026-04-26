import ServicePlaceholderPage from "@/app/components/ServicePlaceholderPage";

export default function FinancePage() {
  return (
    <ServicePlaceholderPage
      title="Finance Services"
      description="Vehicle finance, personal finance and loan support."
      note="This section will cover finance options, eligibility support and document guidance for faster approvals."
      primaryHref="/contact"
      primaryLabel="Request finance help"
    />
  );
}
