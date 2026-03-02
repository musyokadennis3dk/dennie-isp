import {
  BANDWIDTH_COSTS,
  LAN_NODE_COSTS,
  PC_COST,
  OVERDUE_FINE_RATE,
  UPGRADE_DISCOUNT_RATE,
  RECONNECTION_FEE,
  INSTALLATION_FEE,
  REGISTRATION_FEE,
} from "@/db/schema";

export function getBandwidthCost(mbps: number): number {
  return BANDWIDTH_COSTS[mbps] ?? 0;
}

export function getLanNodeCost(nodes: number): number {
  const tier = LAN_NODE_COSTS.find((t) => nodes >= t.min && nodes <= t.max);
  return tier ? tier.cost : 0;
}

export function getPcCost(count: number): number {
  return count * PC_COST;
}

export function calculateUpgradeCost(newBandwidthMbps: number): number {
  const baseCost = getBandwidthCost(newBandwidthMbps);
  const discount = baseCost * UPGRADE_DISCOUNT_RATE;
  return baseCost - discount;
}

export function calculateOverdueFine(amount: number): number {
  return amount * OVERDUE_FINE_RATE;
}

export function formatKsh(amount: number): string {
  return `KSh ${amount.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function getCurrentBillingMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function getBillingMonthDueDate(billingMonth: string): Date {
  const [year, month] = billingMonth.split("-").map(Number);
  // Due at end of current month
  return new Date(year, month, 0); // last day of the month
}

export function getDisconnectionDate(billingMonth: string): Date {
  const [year, month] = billingMonth.split("-").map(Number);
  // Disconnected if not paid by 10th of subsequent month
  return new Date(year, month, 10);
}

export {
  REGISTRATION_FEE,
  INSTALLATION_FEE,
  PC_COST,
  OVERDUE_FINE_RATE,
  UPGRADE_DISCOUNT_RATE,
  RECONNECTION_FEE,
};
