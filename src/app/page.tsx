import Link from "next/link";
import { db } from "@/db";
import { institutions, payments, monthlyBills } from "@/db/schema";
import { eq } from "drizzle-orm";
import { formatKsh } from "@/lib/utils";

export default async function Home() {
  const allInstitutions = await db.select().from(institutions);
  const allPayments = await db.select().from(payments);
  const allBills = await db.select().from(monthlyBills);

  const totalInstitutions = allInstitutions.length;
  const activeInstitutions = allInstitutions.filter((i) => i.serviceStatus === "active").length;
  const disconnectedInstitutions = allInstitutions.filter(
    (i) => i.serviceStatus === "disconnected"
  ).length;
  const overdueBills = allBills.filter((b) => b.status === "overdue").length;
  const totalRevenue = allPayments.reduce((sum, p) => sum + p.amount, 0);

  const navCards = [
    {
      href: "/register",
      title: "Register Institution",
      description: "Enroll a new learning institution into the Azani ISP system",
      icon: "🏫",
      color: "bg-blue-600",
    },
    {
      href: "/institutions",
      title: "View Institutions",
      description: "Browse all registered institutions and their service details",
      icon: "📋",
      color: "bg-indigo-600",
    },
    {
      href: "/payments",
      title: "Record Payment",
      description: "Capture installation fees, monthly payments, and overdue fines",
      icon: "💳",
      color: "bg-green-600",
    },
    {
      href: "/infrastructure",
      title: "Infrastructure",
      description: "Record PC and LAN node purchases for institutions",
      icon: "🖥️",
      color: "bg-purple-600",
    },
    {
      href: "/billing",
      title: "Billing Management",
      description: "Generate monthly bills, mark overdue, and manage disconnections",
      icon: "📅",
      color: "bg-orange-600",
    },
    {
      href: "/reports",
      title: "Reports",
      description: "View defaulters, disconnections, computations, and aggregate reports",
      icon: "📊",
      color: "bg-red-600",
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Azani ISP Information System
        </h1>
        <p className="text-gray-600 mt-2">
          Internet Service Provider Management for Learning Institutions
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
        <div className="bg-white rounded-xl shadow p-5 border-l-4 border-blue-500">
          <div className="text-2xl font-bold text-blue-700">{totalInstitutions}</div>
          <div className="text-sm text-gray-500 mt-1">Total Institutions</div>
        </div>
        <div className="bg-white rounded-xl shadow p-5 border-l-4 border-green-500">
          <div className="text-2xl font-bold text-green-700">{activeInstitutions}</div>
          <div className="text-sm text-gray-500 mt-1">Active Connections</div>
        </div>
        <div className="bg-white rounded-xl shadow p-5 border-l-4 border-red-500">
          <div className="text-2xl font-bold text-red-700">{disconnectedInstitutions}</div>
          <div className="text-sm text-gray-500 mt-1">Disconnected</div>
        </div>
        <div className="bg-white rounded-xl shadow p-5 border-l-4 border-yellow-500">
          <div className="text-2xl font-bold text-yellow-700">{overdueBills}</div>
          <div className="text-sm text-gray-500 mt-1">Overdue Bills</div>
        </div>
        <div className="bg-white rounded-xl shadow p-5 border-l-4 border-purple-500">
          <div className="text-sm font-bold text-purple-700">{formatKsh(totalRevenue)}</div>
          <div className="text-sm text-gray-500 mt-1">Total Revenue</div>
        </div>
      </div>

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {navCards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="bg-white rounded-xl shadow hover:shadow-md transition-shadow border border-gray-100 overflow-hidden group"
          >
            <div className={`${card.color} p-4 flex items-center gap-3`}>
              <span className="text-3xl">{card.icon}</span>
              <h2 className="text-white font-semibold text-lg">{card.title}</h2>
            </div>
            <div className="p-4">
              <p className="text-gray-600 text-sm">{card.description}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Info Section */}
      <div className="mt-10 bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-semibold text-blue-900 mb-3">Service Fee Schedule</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Registration & Setup</h4>
            <ul className="space-y-1 text-gray-700">
              <li>Registration Fee: KSh 8,500</li>
              <li>Installation Fee: KSh 10,000</li>
              <li>PC Cost: KSh 40,000 each</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Monthly Bandwidth Costs</h4>
            <ul className="space-y-1 text-gray-700">
              <li>4 Mbps — KSh 1,200</li>
              <li>10 Mbps — KSh 2,000</li>
              <li>20 Mbps — KSh 3,500</li>
              <li>25 Mbps — KSh 4,000</li>
              <li>50 Mbps — KSh 7,000</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Penalties & Discounts</h4>
            <ul className="space-y-1 text-gray-700">
              <li>Overdue Fine: 15% of bill</li>
              <li>Reconnection Fee: KSh 1,000</li>
              <li>Upgrade Discount: 10% off</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
