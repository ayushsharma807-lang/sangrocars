import ServicePlaceholderPage from "@/app/components/ServicePlaceholderPage";

export default function CarsPage() {
  return (
    <ServicePlaceholderPage
      title="Used Cars"
      description="Buy and sell verified used cars with SangroCars."
      note="This section points visitors into the used-car marketplace while keeping the homepage focused on services."
      primaryHref="/listings"
      primaryLabel="Browse used cars"
    />
  );
}
