import { useCallback, useEffect, useState } from "react";
import api from "../api/axios";
import { useAppState } from "../contexts/StateContext";

const RATE_TTL_MS = 10 * 60 * 1000; // reuse a fetched rate for 10 minutes
const FAIL_COOLDOWN_MS = 30 * 1000; // don't hammer the server after a failure

// Module-level cache shared by every component: "FROM:TO" -> { rate, at }
const rateCache = new Map();
const inflight = new Map();
const failures = new Map();
const listeners = new Set();

const notify = () => listeners.forEach((l) => l());

const readRate = (from, to) => {
  const fresh = (entry) => entry && Date.now() - entry.at < RATE_TTL_MS;
  const direct = rateCache.get(`${from}:${to}`);
  if (fresh(direct)) return direct.rate;
  // A rate fetched in the opposite direction can be inverted instead of calling the server again
  const reverse = rateCache.get(`${to}:${from}`);
  if (fresh(reverse) && reverse.rate) return 1 / reverse.rate;
  return null;
};

// Fetches the rate once; concurrent callers share the same request.
const requestRate = (from, to) => {
  const key = `${from}:${to}`;
  if (inflight.has(key)) return;
  if (Date.now() - (failures.get(key) || 0) < FAIL_COOLDOWN_MS) return;

  const p = api
    .get("/finance/wallet/convert", { params: { from, to, amount: 1 } })
    .then((res) => {
      const rate = res.data?.data?.rate;
      if (typeof rate === "number") rateCache.set(key, { rate, at: Date.now() });
      else failures.set(key, Date.now());
    })
    .catch(() => failures.set(key, Date.now()))
    .finally(() => {
      inflight.delete(key);
      notify();
    });
  inflight.set(key, p);
};

/**
 * Displays amounts in the currency of the state selected in the app layout.
 * Rates come from /finance/wallet/convert and are cached, so each currency pair
 * is fetched once and every amount is converted locally with that rate.
 * Display only - invoices and contracts are still billed in the original currency.
 */
export default function useCurrencyDisplay() {
  const { selectedState } = useAppState();
  const target = selectedState?.currency || null;
  const [, setTick] = useState(0);

  useEffect(() => {
    const l = () => setTick((n) => n + 1);
    listeners.add(l);
    return () => listeners.delete(l);
  }, []);

  // Rate from `from` to the selected currency; 1 when identical, null while loading/unavailable.
  const getRate = useCallback(
    (from) => {
      if (!from || !target || from === target) return 1;
      const rate = readRate(from, target);
      if (rate == null) requestRate(from, target); // idempotent, deduplicated
      return rate;
    },
    [target]
  );

  const convert = useCallback(
    (amount, from) => {
      const n = Number(amount) || 0;
      const rate = getRate(from);
      return rate == null ? n : n * rate;
    },
    [getRate]
  );

  // "NGN 1,000" in the original currency, or "≈ USD 0.65" once converted to the selected state's currency.
  const format = useCallback(
    (amount, from) => {
      const n = Number(amount) || 0;
      if (!from) return n.toLocaleString();
      const rate = getRate(from);
      if (rate == null) return `${from} ${n.toLocaleString()}`;
      if (from === target) return `${from} ${n.toLocaleString()}`;
      return `≈ ${target} ${(n * rate).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
    },
    [getRate, target]
  );

  const isConverted = useCallback(
    (from) => !!from && !!target && from !== target && getRate(from) != null,
    [getRate, target]
  );

  return { format, convert, getRate, isConverted, displayCurrency: target };
}
