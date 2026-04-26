import ServicePlaceholderPage from "@/app/components/ServicePlaceholderPage";

export default function InsurancePage() {
  return (
    <ServicePlaceholderPage
      title="Insurance"
      description="Vehicle insurance, policy renewals and claim support."
      note="This section will guide customers through new policies, renewals and claim support with SangroCars."
      primaryHref="/contact"
      primaryLabel="Get insurance support"
    />
  );
}
