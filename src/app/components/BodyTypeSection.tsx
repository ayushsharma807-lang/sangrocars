"use client";

import Link from "next/link";
import { useRef } from "react";

const bodyTypes = [
  {
    label: "SUV",
    href: "/listings?q=SUV",
    cards: [
      {
        name: "Mahindra XUV700",
        href: "/listings?q=Mahindra%20XUV700",
        variants: "+67 Variants",
        fuel: "Petrol",
        extra: "+1 More",
        seats: "6 Seater",
        groundClearance: "200 mm",
        price: "₹ 13.66 - 25.19 Lakh",
        emi: "₹ 28,352",
      },
      {
        name: "Hyundai Creta",
        href: "/listings?q=Hyundai%20Creta",
        variants: "+70 Variants",
        fuel: "Petrol",
        extra: "+1 More",
        seats: "5 Seater",
        groundClearance: "190 mm",
        price: "₹ 10.73 - 20.20 Lakh",
        emi: "₹ 22,265",
      },
      {
        name: "Kia Seltos",
        href: "/listings?q=Kia%20Seltos",
        variants: "+40 Variants",
        fuel: "Petrol",
        extra: "+1 More",
        seats: "5 Seater",
        groundClearance: "190 mm",
        price: "₹ 10.99 - 19.99 Lakh",
        emi: "₹ 22,813",
      },
      {
        name: "Toyota Fortuner",
        href: "/listings?q=Toyota%20Fortuner",
        variants: "+24 Variants",
        fuel: "Diesel",
        extra: "+1 More",
        seats: "7 Seater",
        groundClearance: "225 mm",
        price: "₹ 33.50 - 51.44 Lakh",
        emi: "₹ 62,118",
      },
    ],
  },
  {
    label: "Hatchback",
    href: "/listings?q=Hatchback",
    cards: [
      {
        name: "Maruti Swift",
        href: "/listings?q=Maruti%20Swift",
        variants: "+18 Variants",
        fuel: "Petrol",
        extra: "+1 More",
        seats: "5 Seater",
        groundClearance: "163 mm",
        price: "₹ 6.49 - 9.64 Lakh",
        emi: "₹ 13,522",
      },
      {
        name: "Hyundai i20",
        href: "/listings?q=Hyundai%20i20",
        variants: "+24 Variants",
        fuel: "Petrol",
        extra: "+1 More",
        seats: "5 Seater",
        groundClearance: "170 mm",
        price: "₹ 7.04 - 11.25 Lakh",
        emi: "₹ 14,668",
      },
      {
        name: "Tata Altroz",
        href: "/listings?q=Tata%20Altroz",
        variants: "+32 Variants",
        fuel: "Petrol",
        extra: "+2 More",
        seats: "5 Seater",
        groundClearance: "165 mm",
        price: "₹ 6.65 - 11.30 Lakh",
        emi: "₹ 13,851",
      },
      {
        name: "Toyota Glanza",
        href: "/listings?q=Toyota%20Glanza",
        variants: "+9 Variants",
        fuel: "Petrol",
        extra: "+1 More",
        seats: "5 Seater",
        groundClearance: "170 mm",
        price: "₹ 6.90 - 10.00 Lakh",
        emi: "₹ 14,371",
      },
    ],
  },
  {
    label: "Sedan",
    href: "/listings?q=Sedan",
    cards: [
      {
        name: "Honda City",
        href: "/listings?q=Honda%20City",
        variants: "+30 Variants",
        fuel: "Petrol",
        extra: "+1 More",
        seats: "5 Seater",
        groundClearance: "165 mm",
        price: "₹ 11.82 - 16.55 Lakh",
        emi: "₹ 24,535",
      },
      {
        name: "Hyundai Verna",
        href: "/listings?q=Hyundai%20Verna",
        variants: "+20 Variants",
        fuel: "Petrol",
        extra: "+1 More",
        seats: "5 Seater",
        groundClearance: "165 mm",
        price: "₹ 11.07 - 17.58 Lakh",
        emi: "₹ 22,998",
      },
      {
        name: "Skoda Slavia",
        href: "/listings?q=Skoda%20Slavia",
        variants: "+19 Variants",
        fuel: "Petrol",
        extra: "+1 More",
        seats: "5 Seater",
        groundClearance: "179 mm",
        price: "₹ 10.69 - 18.69 Lakh",
        emi: "₹ 22,183",
      },
      {
        name: "Volkswagen Virtus",
        href: "/listings?q=Volkswagen%20Virtus",
        variants: "+22 Variants",
        fuel: "Petrol",
        extra: "+1 More",
        seats: "5 Seater",
        groundClearance: "179 mm",
        price: "₹ 11.56 - 19.40 Lakh",
        emi: "₹ 24,000",
      },
    ],
  },
  {
    label: "Luxury",
    href: "/listings?price_mode=custom&min_price=4500000&sort=price_desc&page=1",
    cards: [
      {
        name: "BMW 3 Series",
        href: "/listings?q=BMW%203%20Series",
        variants: "+8 Variants",
        fuel: "Petrol",
        extra: "+1 More",
        seats: "5 Seater",
        groundClearance: "135 mm",
        price: "₹ 74.90 Lakh",
        emi: "₹ 1,39,251",
      },
      {
        name: "Mercedes-Benz C-Class",
        href: "/listings?q=Mercedes%20C-Class",
        variants: "+3 Variants",
        fuel: "Petrol",
        extra: "+1 More",
        seats: "5 Seater",
        groundClearance: "160 mm",
        price: "₹ 61.85 - 69.00 Lakh",
        emi: "₹ 1,14,962",
      },
      {
        name: "Audi A6",
        href: "/listings?q=Audi%20A6",
        variants: "+2 Variants",
        fuel: "Petrol",
        extra: "+1 More",
        seats: "5 Seater",
        groundClearance: "165 mm",
        price: "₹ 65.72 - 72.06 Lakh",
        emi: "₹ 1,22,133",
      },
      {
        name: "Toyota Camry",
        href: "/listings?q=Toyota%20Camry",
        variants: "+1 Variant",
        fuel: "Hybrid",
        extra: "+0 More",
        seats: "5 Seater",
        groundClearance: "145 mm",
        price: "₹ 46.17 Lakh",
        emi: "₹ 85,702",
      },
    ],
  },
  {
    label: "Automatic",
    href: "/listings?transmission=automatic",
    cards: [
      {
        name: "Hyundai Venue iVT",
        href: "/listings?q=Hyundai%20Venue&transmission=automatic",
        variants: "+16 Variants",
        fuel: "Petrol",
        extra: "+1 More",
        seats: "5 Seater",
        groundClearance: "195 mm",
        price: "₹ 10.79 - 13.62 Lakh",
        emi: "₹ 22,391",
      },
      {
        name: "Kia Sonet DCT",
        href: "/listings?q=Kia%20Sonet&transmission=automatic",
        variants: "+21 Variants",
        fuel: "Petrol",
        extra: "+2 More",
        seats: "5 Seater",
        groundClearance: "205 mm",
        price: "₹ 8.00 - 15.70 Lakh",
        emi: "₹ 16,606",
      },
      {
        name: "Honda City CVT",
        href: "/listings?q=Honda%20City&transmission=automatic",
        variants: "+11 Variants",
        fuel: "Petrol",
        extra: "+1 More",
        seats: "5 Seater",
        groundClearance: "165 mm",
        price: "₹ 13.16 - 16.74 Lakh",
        emi: "₹ 27,336",
      },
      {
        name: "Toyota Hyryder AT",
        href: "/listings?q=Toyota%20Hyryder&transmission=automatic",
        variants: "+13 Variants",
        fuel: "Hybrid",
        extra: "+1 More",
        seats: "5 Seater",
        groundClearance: "210 mm",
        price: "₹ 15.11 - 19.99 Lakh",
        emi: "₹ 31,381",
      },
    ],
  },
];

type Props = {
  activeTab?: string;
};

export default function BodyTypeSection({ activeTab = "SUV" }: Props) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const activeGroup =
    bodyTypes.find((item) => item.label.toLowerCase() === activeTab.toLowerCase()) ??
    bodyTypes[0];

  const scrollByAmount = (direction: number) => {
    sliderRef.current?.scrollBy({ left: direction * 420, behavior: "smooth" });
  };

  return (
    <section className="cw-bodytype">
      <div className="cw-bodytype__header">
        <div>
          <p className="cw-bodytype__eyebrow">Browse by body type</p>
          <h2>New Cars by Body Type</h2>
        </div>
        <Link className="cw-bodytype__link" href={activeGroup.href}>
          {activeGroup.label} Cars →
        </Link>
      </div>

      <div className="cw-bodytype__tabs">
        {bodyTypes.map((item) => (
          <Link
            key={item.label}
            className={`cw-bodytype__tab${
              item.label.toLowerCase() === activeGroup.label.toLowerCase()
                ? " is-active"
                : ""
            }`}
            href={item.href}
          >
            {item.label}
          </Link>
        ))}
      </div>

      <div
        ref={sliderRef}
        className="cw-bodytype__scroll no-scrollbar"
        aria-label="Browse body type cards"
      >
        {activeGroup.cards.map((car) => (
          <Link key={car.name} href={car.href} className="cw-bodytype__card">
            <div className="cw-bodytype__media">
              <div className="cw-bodytype__image" aria-hidden="true">
                <svg viewBox="0 0 200 80" role="img" aria-hidden="true">
                  <path
                    d="M20 50c5-16 18-28 34-30l40-5c10-1 20 1 29 7l20 15h20c8 0 14 6 14 14v9H9v-9c0-7 5-13 11-13z"
                    fill="#111827"
                    opacity="0.85"
                  />
                  <circle cx="52" cy="62" r="10" fill="#111827" />
                  <circle cx="142" cy="62" r="10" fill="#111827" />
                </svg>
              </div>
            </div>

            <div className="cw-bodytype__body">
              <h3>{car.name}</h3>
              <span className="cw-bodytype__variants">{car.variants}</span>

              <div className="cw-bodytype__meta">
                <div className="cw-bodytype__meta-block">
                  <div className="cw-bodytype__meta-icon">⛽</div>
                  <div>{car.fuel}</div>
                  <div className="cw-bodytype__meta-link">{car.extra}</div>
                </div>
                <div className="cw-bodytype__meta-block is-bordered">
                  <div className="cw-bodytype__meta-icon">🪑</div>
                  <div>{car.seats}</div>
                </div>
                <div className="cw-bodytype__meta-block">
                  <div className="cw-bodytype__meta-icon">▭</div>
                  <div>{car.groundClearance}</div>
                </div>
              </div>

              <div className="cw-bodytype__pricing">
                <div>
                  <p>* Ex-Showroom</p>
                  <strong>{car.price}</strong>
                </div>
                <div className="cw-bodytype__emi">
                  <p>EMI starts at</p>
                  <strong>{car.emi}</strong>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="cw-bodytype__nav">
        <button
          type="button"
          className="cw-bodytype__arrow"
          onClick={() => scrollByAmount(-1)}
          aria-label="Scroll left"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M15 18l-6-6 6-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <button
          type="button"
          className="cw-bodytype__arrow"
          onClick={() => scrollByAmount(1)}
          aria-label="Scroll right"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M9 6l6 6-6 6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </section>
  );
}
