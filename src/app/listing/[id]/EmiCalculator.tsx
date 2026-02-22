"use client";

import { useMemo, useState } from "react";

type Props = {
  price: number | null;
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const formatMoney = (value: number) => `₹${Math.round(value).toLocaleString("en-IN")}`;

const calculateEmi = (
  principal: number,
  annualRate: number,
  months: number
) => {
  if (principal <= 0 || annualRate <= 0 || months <= 0) return 0;
  const monthlyRate = annualRate / 12 / 100;
  const factor = (1 + monthlyRate) ** months;
  return (principal * monthlyRate * factor) / (factor - 1);
};

export default function EmiCalculator({ price }: Props) {
  const maxPrice = Math.max(price ?? 1_000_000, 100_000);
  const [downPayment, setDownPayment] = useState(Math.round(maxPrice * 0.2));
  const [interest, setInterest] = useState(10.5);
  const [tenureMonths, setTenureMonths] = useState(60);

  const principal = useMemo(() => {
    if (!price) return Math.max(0, maxPrice - downPayment);
    return clamp(price - downPayment, 0, price);
  }, [downPayment, maxPrice, price]);

  const emi = useMemo(
    () => calculateEmi(principal, interest, tenureMonths),
    [principal, interest, tenureMonths]
  );
  const totalPayable = emi * tenureMonths;
  const totalInterest = Math.max(0, totalPayable - principal);

  return (
    <div className="emi-card">
      <div className="emi-card__header">
        <h3>EMI calculator</h3>
        <p>Quick estimate for buyers.</p>
      </div>

      <div className="emi-card__grid">
        <label>
          Down payment ({formatMoney(downPayment)})
          <input
            type="range"
            min={0}
            max={maxPrice}
            step={10_000}
            value={downPayment}
            onChange={(event) => setDownPayment(Number(event.target.value))}
          />
        </label>

        <label>
          Interest rate (% p.a.)
          <input
            type="number"
            min={5}
            max={25}
            step={0.1}
            value={interest}
            onChange={(event) => setInterest(Number(event.target.value))}
          />
        </label>

        <label>
          Tenure (months)
          <input
            type="range"
            min={12}
            max={84}
            step={12}
            value={tenureMonths}
            onChange={(event) => setTenureMonths(Number(event.target.value))}
          />
          <span>{tenureMonths} months</span>
        </label>
      </div>

      <div className="emi-card__summary">
        <div>
          <p>Loan amount</p>
          <strong>{formatMoney(principal)}</strong>
        </div>
        <div>
          <p>Monthly EMI</p>
          <strong>{formatMoney(emi)}</strong>
        </div>
        <div>
          <p>Total interest</p>
          <strong>{formatMoney(totalInterest)}</strong>
        </div>
      </div>
    </div>
  );
}
