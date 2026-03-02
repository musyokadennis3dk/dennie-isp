import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

// Institution types
export const INSTITUTION_TYPES = ["primary", "junior", "senior", "college"] as const;
export type InstitutionType = (typeof INSTITUTION_TYPES)[number];

// Bandwidth options (MBPS)
export const BANDWIDTH_OPTIONS = [4, 10, 20, 25, 50] as const;
export type BandwidthOption = (typeof BANDWIDTH_OPTIONS)[number];

// Bandwidth costs in KSh per month
export const BANDWIDTH_COSTS: Record<number, number> = {
  4: 1200,
  10: 2000,
  20: 3500,
  25: 4000,
  50: 7000,
};

// LAN node costs
export const LAN_NODE_COSTS = [
  { min: 2, max: 10, cost: 10000 },
  { min: 11, max: 20, cost: 20000 },
  { min: 21, max: 40, cost: 30000 },
  { min: 41, max: 100, cost: 40000 },
];

export const REGISTRATION_FEE = 8500;
export const INSTALLATION_FEE = 10000;
export const PC_COST = 40000;
export const OVERDUE_FINE_RATE = 0.15;
export const UPGRADE_DISCOUNT_RATE = 0.10;
export const RECONNECTION_FEE = 1000;

// Institutions table
export const institutions = sqliteTable("institutions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  type: text("type").notNull(), // primary, junior, senior, college
  address: text("address").notNull(),
  county: text("county").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  // Contact person details
  contactName: text("contact_name").notNull(),
  contactRole: text("contact_role").notNull(),
  contactPhone: text("contact_phone").notNull(),
  contactEmail: text("contact_email").notNull(),
  // Status
  registrationStatus: text("registration_status").notNull().default("pending"), // pending, registered
  registrationDate: integer("registration_date", { mode: "timestamp" }),
  // Internet service
  bandwidthMbps: integer("bandwidth_mbps"), // current bandwidth
  serviceStatus: text("service_status").notNull().default("inactive"), // inactive, active, disconnected
  connectionDate: integer("connection_date", { mode: "timestamp" }),
  // Infrastructure
  hasComputers: integer("has_computers", { mode: "boolean" }).notNull().default(false),
  hasLan: integer("has_lan", { mode: "boolean" }).notNull().default(false),
  numberOfUsers: integer("number_of_users"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Infrastructure purchases table
export const infrastructurePurchases = sqliteTable("infrastructure_purchases", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  institutionId: integer("institution_id").notNull().references(() => institutions.id),
  purchaseDate: integer("purchase_date", { mode: "timestamp" }).$defaultFn(() => new Date()),
  numberOfPcs: integer("number_of_pcs").notNull().default(0),
  pcCostTotal: real("pc_cost_total").notNull().default(0),
  numberOfLanNodes: integer("number_of_lan_nodes").notNull().default(0),
  lanCostTotal: real("lan_cost_total").notNull().default(0),
  totalCost: real("total_cost").notNull().default(0),
  notes: text("notes"),
});

// Payments table
export const payments = sqliteTable("payments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  institutionId: integer("institution_id").notNull().references(() => institutions.id),
  paymentType: text("payment_type").notNull(), // registration, installation, monthly, overdue_fine, reconnection
  amount: real("amount").notNull(),
  paymentDate: integer("payment_date", { mode: "timestamp" }).$defaultFn(() => new Date()),
  billingMonth: text("billing_month"), // YYYY-MM format for monthly payments
  bandwidthMbps: integer("bandwidth_mbps"), // bandwidth at time of payment
  isUpgrade: integer("is_upgrade", { mode: "boolean" }).default(false),
  discountAmount: real("discount_amount").default(0),
  notes: text("notes"),
  status: text("status").notNull().default("paid"), // paid, pending, overdue
});

// Monthly bills table - tracks monthly billing cycles
export const monthlyBills = sqliteTable("monthly_bills", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  institutionId: integer("institution_id").notNull().references(() => institutions.id),
  billingMonth: text("billing_month").notNull(), // YYYY-MM format
  bandwidthMbps: integer("bandwidth_mbps").notNull(),
  baseAmount: real("base_amount").notNull(),
  isUpgrade: integer("is_upgrade", { mode: "boolean" }).default(false),
  discountAmount: real("discount_amount").default(0),
  totalAmount: real("total_amount").notNull(),
  dueDate: integer("due_date", { mode: "timestamp" }).notNull(),
  paidDate: integer("paid_date", { mode: "timestamp" }),
  status: text("status").notNull().default("pending"), // pending, paid, overdue, disconnected
  overdueFine: real("overdue_fine").default(0),
  reconnectionFee: real("reconnection_fee").default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});
