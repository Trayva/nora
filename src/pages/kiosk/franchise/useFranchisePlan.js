import { useEffect, useState } from "react";

export const num = (v) => parseFloat(v) || 0;
export const DEFAULT_MARGIN = 30;

// Shared pricing plan (margins, extra costs, operational bills, daily target) used by the
// menu detail drawer and the profit projection drawer.
export default function useFranchisePlan(locationBills = []) {
  const [margins, setMargins] = useState({}); // menuId -> margin %
  const [defaultMargin, setDefaultMargin] = useState(DEFAULT_MARGIN);
  const [extraCosts, setExtraCosts] = useState([]);
  const [bills, setBills] = useState([]);
  const [dailyTarget, setDailyTarget] = useState(50);

  // Prefill monthly bills from location & recurring payments (editable)
  const billsKey = JSON.stringify(locationBills);
  useEffect(() => {
    setBills(
      locationBills.map((b, i) => ({
        id: b.id || `bill-${i}`,
        name: b.name || b.title || "",
        amount: b.amount ?? "",
      }))
    );
  }, [billsKey]);

  const monthlyBills = bills.reduce((s, b) => s + num(b.amount), 0);
  const monthlyOrders = num(dailyTarget) * 30;
  const operationalPerOrder = monthlyOrders > 0 ? monthlyBills / monthlyOrders : 0;

  const getMargin = (menuId) => (margins[menuId] ?? defaultMargin);
  const setMargin = (menuId, v) => setMargins((p) => ({ ...p, [menuId]: v }));
  const applyMarginToAll = (v) => {
    setDefaultMargin(v);
    setMargins({});
  };

  // p = cost + (margin/100) * cost, where cost = ingredients + operational per order + extra costs
  const priceFor = (ingredientCost, margin) => {
    let before = ingredientCost + operationalPerOrder;
    let after = 0;
    extraCosts.forEach((ac) => {
      const val = ac.type === "percentage" ? (num(ac.amount) / 100) * ingredientCost : num(ac.amount);
      if (ac.target === "price") after += val;
      else before += val;
    });
    return { totalCost: before + after, price: before + (margin / 100) * before + after };
  };

  return {
    extraCosts, setExtraCosts,
    bills, setBills,
    dailyTarget, setDailyTarget,
    monthlyBills, monthlyOrders, operationalPerOrder,
    getMargin, setMargin, applyMarginToAll, defaultMargin,
    priceFor,
  };
}
