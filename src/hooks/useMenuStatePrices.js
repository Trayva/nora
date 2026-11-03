import { useState, useEffect } from "react";
import api from "../api/axios";

// Shared cache across components: "menuItemId:stateId" -> price
const priceCache = new Map();
const inflight = new Map();

/**
 * Fetches menu prices for a given stateId.
 * @param {Array} items - List of menu items (or objects with id or menuItemId)
 * @param {string} stateId - The kiosk's state ID
 */
export default function useMenuStatePrices(items = [], stateId = null) {
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(false);

  const itemsKey = (items || [])
    .map((it) => it?.menuItemId || it?.id)
    .filter(Boolean)
    .join(",");

  useEffect(() => {
    if (!items || items.length === 0) {
      setPrices({});
      return;
    }

    let cancelled = false;
    const missing = [];
    const cached = {};

    items.forEach((it) => {
      const id = it?.menuItemId || it?.id;
      if (!id) return;
      const key = `${id}:${stateId || "default"}`;
      if (priceCache.has(key)) {
        cached[id] = priceCache.get(key);
      } else {
        missing.push(it);
      }
    });

    if (Object.keys(cached).length > 0) {
      setPrices((prev) => ({ ...prev, ...cached }));
    }

    if (missing.length === 0) return;

    setLoading(true);

    Promise.all(
      missing.map(async (m) => {
        const id = m?.menuItemId || m?.id;
        const variantId = m?.variants?.[0]?.id || m?.menuItem?.variants?.[0]?.id;
        const key = `${id}:${stateId || "default"}`;

        if (inflight.has(key)) {
          const val = await inflight.get(key);
          return { id, price: val };
        }

        const params = {
          useAverage: true,
          ...(stateId ? { stateId } : {}),
          ...(variantId ? { variantId } : {}),
        };

        const fetchPromise = api
          .get(`/library/price/menu/${id}`, { params })
          .then((res) => {
            const val =
              res?.data?.data?.sellingPrice ??
              res?.data?.data?.price ??
              m?.sellingPrice ??
              m?.menuItem?.sellingPrice ??
              null;
            const num = val != null ? Number(val) : null;
            if (num != null) priceCache.set(key, num);
            return num;
          })
          .catch(() => {
            const fallback =
              m?.sellingPrice ?? m?.menuItem?.sellingPrice ?? null;
            return fallback != null ? Number(fallback) : null;
          })
          .finally(() => {
            inflight.delete(key);
          });

        inflight.set(key, fetchPromise);
        const price = await fetchPromise;
        return { id, price };
      })
    ).then((results) => {
      if (cancelled) return;
      setPrices((prev) => {
        const next = { ...prev };
        results.forEach((r) => {
          if (r && r.id && r.price != null) {
            next[r.id] = r.price;
          }
        });
        return next;
      });
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [itemsKey, stateId]);

  return { prices, loading };
}

