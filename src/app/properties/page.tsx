"use client";

import { useMemo, useState } from "react";
import ServiceLeadForm from "@/app/components/ServiceLeadForm";
import ServicePlatformShell from "@/app/components/ServicePlatformShell";

type PropertyTab = "Buy" | "Sell" | "Rent" | "Commercial";
type ViewMode = "grid" | "list";

type PropertyCard = {
  id: string;
  title: string;
  location: string;
  price: string;
  area: string;
  bedrooms: string;
  ownerTag: "Owner" | "Dealer";
  tab: PropertyTab;
  badge: string;
  image: string;
};

type PropertyFilters = {
  location: string;
  budget: string;
  propertyType: string;
  bedrooms: string;
  area: string;
};

const tabs: PropertyTab[] = ["Buy", "Sell", "Rent", "Commercial"];

const propertyCards: PropertyCard[] = [
  {
    id: "buy-1",
    title: "3BHK builder floor near Model Town",
    location: "Jalandhar",
    price: "₹82 lakh",
    area: "1,850 sq ft",
    bedrooms: "3 BHK",
    ownerTag: "Owner",
    tab: "Buy",
    badge: "Ready to move",
    image:
      "https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "buy-2",
    title: "Villa with lawn near PAP Chowk",
    location: "Jalandhar",
    price: "₹1.26 Cr",
    area: "2,950 sq ft",
    bedrooms: "4 BHK",
    ownerTag: "Dealer",
    tab: "Buy",
    badge: "Site visit available",
    image:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "sell-1",
    title: "Residential plot in Urban Estate",
    location: "Ludhiana",
    price: "₹54 lakh",
    area: "1,350 sq ft",
    bedrooms: "Plot",
    ownerTag: "Dealer",
    tab: "Sell",
    badge: "Quick close",
    image:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "rent-1",
    title: "2BHK rental near PAP Chowk",
    location: "Jalandhar",
    price: "₹18,000 / month",
    area: "1,050 sq ft",
    bedrooms: "2 BHK",
    ownerTag: "Owner",
    tab: "Rent",
    badge: "Available now",
    image:
      "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "commercial-1",
    title: "Retail showroom on GT Road",
    location: "Phagwara",
    price: "₹1.6 Cr",
    area: "2,400 sq ft",
    bedrooms: "Commercial",
    ownerTag: "Dealer",
    tab: "Commercial",
    badge: "Frontage premium",
    image:
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80",
  },
];

function LeadModal({
  title,
  description,
  defaultMessage,
  onClose,
}: {
  title: string;
  description: string;
  defaultMessage: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-[28px] border border-slate-200 bg-white p-4 shadow-2xl sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              SangroCars properties desk
            </p>
            <h3 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-500"
          >
            Close
          </button>
        </div>
        <ServiceLeadForm
          serviceType="properties"
          title={title}
          description={description}
          submitLabel="Send request"
          defaultMessage={defaultMessage}
          messagePlaceholder="Share localities, budget, property type and visit timing."
        />
      </div>
    </div>
  );
}

export default function PropertiesPage() {
  const [activeTab, setActiveTab] = useState<PropertyTab>("Buy");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [filters, setFilters] = useState<PropertyFilters>({
    location: "",
    budget: "",
    propertyType: "",
    bedrooms: "",
    area: "",
  });
  const [saved, setSaved] = useState<string[]>([]);
  const [compared, setCompared] = useState<string[]>([]);
  const [activeModal, setActiveModal] = useState<null | {
    title: string;
    description: string;
    defaultMessage: string;
  }>(null);

  const cards = useMemo(() => {
    return propertyCards.filter((property) => {
      if (property.tab !== activeTab) return false;
      const haystack = `${property.title} ${property.location} ${property.bedrooms}`.toLowerCase();
      const matchesLocation =
        !filters.location || haystack.includes(filters.location.toLowerCase());
      const matchesBudget =
        !filters.budget || property.price.toLowerCase().includes(filters.budget.toLowerCase());
      const matchesType =
        !filters.propertyType ||
        haystack.includes(filters.propertyType.toLowerCase()) ||
        property.badge.toLowerCase().includes(filters.propertyType.toLowerCase());
      const matchesBeds =
        !filters.bedrooms || property.bedrooms.toLowerCase().includes(filters.bedrooms.toLowerCase());
      const matchesArea =
        !filters.area || property.area.toLowerCase().includes(filters.area.toLowerCase());
      return matchesLocation && matchesBudget && matchesType && matchesBeds && matchesArea;
    });
  }, [activeTab, filters]);

  const toggleSave = (id: string) => {
    setSaved((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  const toggleCompare = (id: string) => {
    setCompared((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id].slice(-3),
    );
  };

  return (
    <>
      <ServicePlatformShell
        section="properties"
        title="Properties by SangroCars"
        subtitle="Search local inventory, switch between buy-rent-commercial workflows, save properties and schedule site visits through SangroCars."
        statusLabel="Matching live requests"
        statusTone="accent"
        quickStats={[
          { label: "Properties listed", value: "96", tone: "accent" },
          { label: "Saved searches", value: `${saved.length || 4}` },
          { label: "Visits this week", value: "18", tone: "success" },
          { label: "Compare queue", value: `${compared.length}/3` },
        ]}
        actions={
          <>
            <button
              type="button"
              onClick={() =>
                setActiveModal({
                  title: "Find Property",
                  description:
                    "Tell SangroCars your location, budget and requirement so the team can match properties and schedule visits.",
                  defaultMessage: `Find Property\nRequirement type: ${activeTab}`,
                })
              }
              className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
            >
              Find Property
            </button>
            <button
              type="button"
              onClick={() =>
                setActiveModal({
                  title: "List Your Property",
                  description:
                    "Share owner details and SangroCars will help list the property and handle buyer or tenant enquiries.",
                  defaultMessage: "List Your Property",
                })
              }
              className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900"
            >
              List Your Property
            </button>
          </>
        }
      >
        <div className="space-y-6">
          <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Search workflow
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                  Marketplace-style discovery
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold ${
                      activeTab === tab
                        ? "bg-slate-950 text-white"
                        : "border border-slate-200 bg-white text-slate-700"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                {[
                  { key: "location", placeholder: "Location" },
                  { key: "budget", placeholder: "Budget" },
                  { key: "propertyType", placeholder: "Property type" },
                  { key: "bedrooms", placeholder: "Bedrooms" },
                  { key: "area", placeholder: "Area sq ft" },
                ].map((field) => (
                  <input
                    key={field.key}
                    value={filters[field.key as keyof PropertyFilters]}
                    onChange={(event) =>
                      setFilters((current) => ({
                        ...current,
                        [field.key]: event.target.value,
                      }))
                    }
                    placeholder={field.placeholder}
                    className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 placeholder:text-slate-400 outline-none focus:border-slate-950"
                  />
                ))}
              </div>
              <div className="flex items-center justify-between gap-3 rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    View mode
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Switch between discovery layouts.
                  </p>
                </div>
                <div className="flex gap-2">
                  {(["grid", "list"] as ViewMode[]).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setViewMode(mode)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold ${
                        viewMode === mode
                          ? "bg-slate-950 text-white"
                          : "border border-slate-200 bg-white text-slate-700"
                      }`}
                    >
                      {mode === "grid" ? "Grid" : "List"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section
            className={`grid gap-4 ${
              viewMode === "grid"
                ? "xl:grid-cols-3 lg:grid-cols-2"
                : "grid-cols-1"
            }`}
          >
            {cards.map((property) => {
              const isSaved = saved.includes(property.id);
              const isCompared = compared.includes(property.id);
              return (
                <article
                  key={property.id}
                  className={`overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm ${
                    viewMode === "list" ? "grid lg:grid-cols-[340px_1fr]" : ""
                  }`}
                >
                  <div className="relative min-h-[240px] bg-slate-100">
                    <img
                      src={property.image}
                      alt={property.title}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                      <span className="rounded-full bg-slate-950/90 px-3 py-1 text-xs font-semibold text-white">
                        {property.badge}
                      </span>
                      <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-900">
                        {property.ownerTag}
                      </span>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4 flex gap-2">
                      {[1, 2, 3].map((thumb) => (
                        <div
                          key={thumb}
                          className="h-12 w-16 rounded-2xl border border-white/70 bg-white/20 backdrop-blur"
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-semibold tracking-tight text-slate-950">
                          {property.title}
                        </h3>
                        <p className="mt-2 text-sm text-slate-600">{property.location}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-semibold tracking-tight text-slate-950">
                          {property.price}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">{property.area}</p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      {[
                        { label: "Type", value: property.bedrooms },
                        { label: "Area", value: property.area },
                        { label: "Match score", value: "88%" },
                      ].map((item) => (
                        <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                            {item.label}
                          </p>
                          <p className="mt-2 text-sm font-semibold text-slate-950">{item.value}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => toggleSave(property.id)}
                        className={`rounded-full px-4 py-2 text-sm font-semibold ${
                          isSaved
                            ? "bg-slate-950 text-white"
                            : "border border-slate-200 bg-white text-slate-700"
                        }`}
                      >
                        {isSaved ? "Saved" : "Save Property"}
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleCompare(property.id)}
                        className={`rounded-full px-4 py-2 text-sm font-semibold ${
                          isCompared
                            ? "bg-sky-600 text-white"
                            : "border border-slate-200 bg-white text-slate-700"
                        }`}
                      >
                        {isCompared ? "Compared" : "Compare"}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setActiveModal({
                            title: "Schedule Site Visit",
                            description:
                              "Send your preferred time and SangroCars will coordinate a property visit.",
                            defaultMessage: `Schedule Site Visit\nProperty: ${property.title}\nLocation: ${property.location}`,
                          })
                        }
                        className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                      >
                        Schedule Site Visit
                      </button>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setActiveModal({
                            title: "Contact Owner",
                            description:
                              "SangroCars will help connect you with the property owner or dealer after qualification.",
                            defaultMessage: `Contact Owner\nProperty: ${property.title}\nLocation: ${property.location}`,
                          })
                        }
                        className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
                      >
                        Contact Owner
                      </button>
                      <button
                        type="button"
                        className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>

          <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <article className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                    Enquiry workflow
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                    How SangroCars closes property deals
                  </h2>
                </div>
              </div>
              <div className="mt-5 grid gap-3">
                {[
                  "Select requirement",
                  "Shortlist matches",
                  "Schedule visit",
                  "Close deal",
                ].map((step, index) => (
                  <div
                    key={step}
                    className="flex items-center gap-3 rounded-[24px] border border-slate-200 bg-slate-50 p-4"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-sm font-semibold text-slate-950">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{step}</p>
                      <p className="mt-1 text-sm text-slate-600">
                        {index === 0
                          ? "Tell us the city, budget, and property type."
                          : index === 1
                            ? "Receive a curated set of matching inventory."
                            : index === 2
                              ? "Book site visits with verified owners or dealers."
                              : "Negotiate, document, and close with SangroCars support."}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                    Owner workflow
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                    List your property with SangroCars
                  </h2>
                </div>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                  Photos supported via follow-up
                </span>
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {[
                  { label: "Property type", value: "Flat, plot, office, showroom" },
                  { label: "Location", value: "Locality, city, landmark" },
                  { label: "Expected price / rent", value: "Sale or monthly target" },
                  { label: "Photos upload", value: "Share on WhatsApp after callback" },
                ].map((item) => (
                  <div key={item.label} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{item.label}</p>
                    <p className="mt-2 text-sm text-slate-700">{item.value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setActiveModal({
                      title: "List Your Property",
                      description:
                        "Send owner details to SangroCars and we will help publish, qualify and follow up on enquiries.",
                      defaultMessage: "List Your Property",
                    })
                  }
                  className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
                >
                  Start owner submission
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setActiveModal({
                      title: "Schedule Site Visit",
                      description:
                        "Need help arranging a visit? SangroCars will coordinate with the owner or dealer.",
                      defaultMessage: `Schedule Site Visit\nRequirement type: ${activeTab}`,
                    })
                  }
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900"
                >
                  Schedule Site Visit
                </button>
              </div>
            </article>
          </section>
        </div>
      </ServicePlatformShell>

      {activeModal ? (
        <LeadModal
          title={activeModal.title}
          description={activeModal.description}
          defaultMessage={activeModal.defaultMessage}
          onClose={() => setActiveModal(null)}
        />
      ) : null}
    </>
  );
}
