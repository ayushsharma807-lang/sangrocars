"use client";

import Link from "next/link";
import { useRef } from "react";

const bodyTypes = ["SUV", "Hatchback", "Sedan", "Luxury", "Automatic"];

const cards = [
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
];

export default function BodyTypeSection() {
  const sliderRef = useRef<HTMLDivElement>(null);

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
        <a className="cw-bodytype__link" href="/listings?type=used">
          SUV Cars →
        </a>
      </div>

      <div className="cw-bodytype__tabs">
        {bodyTypes.map((label, index) => (
          <button
            key={label}
            className={`cw-bodytype__tab${index === 0 ? " is-active" : ""}`}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>

      <div
        ref={sliderRef}
        className="cw-bodytype__scroll no-scrollbar"
        aria-label="Browse body type cards"
      >
        {cards.map((car) => (
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
