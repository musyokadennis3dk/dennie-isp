import Link from "next/link";
import { db } from "@/db";
import { institutions, payments, monthlyBills } from "@/db/schema";
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

  const stats = [
    {
      label: "Total Institutions",
      value: totalInstitutions,
      icon: "🏫",
      bg: "from-blue-500 to-blue-700",
      text: "text-blue-100",
    },
    {
      label: "Active Connections",
      value: activeInstitutions,
      icon: "✅",
      bg: "from-emerald-500 to-emerald-700",
      text: "text-emerald-100",
    },
    {
      label: "Disconnected",
      value: disconnectedInstitutions,
      icon: "🔴",
      bg: "from-red-500 to-red-700",
      text: "text-red-100",
    },
    {
      label: "Overdue Bills",
      value: overdueBills,
      icon: "⚠️",
      bg: "from-amber-500 to-amber-700",
      text: "text-amber-100",
    },
    {
      label: "Total Revenue",
      value: formatKsh(totalRevenue),
      icon: "💰",
      bg: "from-violet-500 to-violet-700",
      text: "text-violet-100",
      isText: true,
    },
  ];

  const navCards = [
    {
      href: "/register",
      title: "Register Institution",
      description: "Enroll a new learning institution into the Azani ISP system",
      icon: "🏫",
      accent: "border-blue-500",
      iconBg: "bg-blue-50",
      badge: "New",
      badgeColor: "bg-blue-100 text-blue-700",
    },
    {
      href: "/institutions",
      title: "View Institutions",
      description: "Browse all registered institutions and their service details",
      icon: "📋",
      accent: "border-indigo-500",
      iconBg: "bg-indigo-50",
      badge: `${totalInstitutions} total`,
      badgeColor: "bg-indigo-100 text-indigo-700",
    },
    {
      href: "/payments",
      title: "Record Payment",
      description: "Capture installation fees, monthly payments, and overdue fines",
      icon: "💳",
      accent: "border-emerald-500",
      iconBg: "bg-emerald-50",
      badge: "Finance",
      badgeColor: "bg-emerald-100 text-emerald-700",
    },
    {
      href: "/infrastructure",
      title: "Infrastructure",
      description: "Record PC and LAN node purchases for institutions",
      icon: "🖥️",
      accent: "border-purple-500",
      iconBg: "bg-purple-50",
      badge: "Assets",
      badgeColor: "bg-purple-100 text-purple-700",
    },
    {
      href: "/billing",
      title: "Billing Management",
      description: "Generate monthly bills, mark overdue, and manage disconnections",
      icon: "📅",
      accent: "border-orange-500",
      iconBg: "bg-orange-50",
      badge: `${overdueBills} overdue`,
      badgeColor: overdueBills > 0 ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700",
    },
    {
      href: "/reports",
      title: "Reports & Analytics",
      description: "View defaulters, disconnections, computations, and aggregate reports",
      icon: "📊",
      accent: "border-rose-500",
      iconBg: "bg-rose-50",
      badge: "Insights",
      badgeColor: "bg-rose-100 text-rose-700",
    },
  ];

  return (
    <div className="space-y-10">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white px-8 py-12 shadow-xl">
        {/* Decorative circles */}
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-blue-700 opacity-30 rounded-full" />
        <div className="absolute -bottom-16 -left-8 w-64 h-64 bg-indigo-700 opacity-20 rounded-full" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-400 rounded-xl flex items-center justify-center text-blue-900 font-extrabold text-xl shadow">
              A
            </div>
            <span className="text-blue-300 text-sm font-medium uppercase tracking-widest">
              Azani Internet Service Provider
            </span>
          </div>
          <h1 className="text-4xl font-extrabold leading-tight mb-3">
            ISP Information <br />
            <span className="text-blue-300">Management System</span>
          </h1>
          <p className="text-blue-200 max-w-xl text-base">
            Manage learning institutions, track payments, monitor infrastructure, and generate
            comprehensive reports — all in one place.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-white text-blue-900 font-semibold px-5 py-2.5 rounded-lg hover:bg-blue-50 transition-colors shadow"
            >
              🏫 Register Institution
            </Link>
            <Link
              href="/reports"
              className="inline-flex items-center gap-2 bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-lg hover:bg-blue-600 transition-colors border border-blue-500"
            >
              📊 View Reports
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
          Live Overview
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className={`bg-gradient-to-br ${stat.bg} rounded-xl p-5 text-white shadow-md flex flex-col gap-2`}
            >
              <div className="text-2xl">{stat.icon}</div>
              <div className={`font-extrabold text-xl leading-tight ${stat.isText ? "text-base" : ""}`}>
                {stat.value}
              </div>
              <div className={`text-xs font-medium ${stat.text}`}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Cards */}
      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {navCards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className={`group bg-white rounded-xl border-t-4 ${card.accent} shadow hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 p-5 flex flex-col gap-3`}
            >
              <div className="flex items-start justify-between">
                <div className={`w-12 h-12 ${card.iconBg} rounded-xl flex items-center justify-center text-2xl`}>
                  {card.icon}
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${card.badgeColor}`}>
                  {card.badge}
                </span>
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-base group-hover:text-blue-700 transition-colors">
                  {card.title}
                </h3>
                <p className="text-gray-500 text-sm mt-1 leading-relaxed">{card.description}</p>
              </div>
              <div className="text-blue-600 text-sm font-medium flex items-center gap-1 mt-auto">
                Open <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Fee Schedule */}
      <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-900 to-indigo-800 px-6 py-4">
          <h3 className="text-white font-bold text-lg">📋 Service Fee Schedule</h3>
          <p className="text-blue-200 text-sm mt-0.5">Current pricing for all Azani ISP services</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100">
          <div className="p-6">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center text-sm">🏗️</span>
              Registration & Setup
            </h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex justify-between">
                <span>Registration Fee</span>
                <span className="font-semibold text-gray-800">KSh 8,500</span>
              </li>
              <li className="flex justify-between">
                <span>Installation Fee</span>
                <span className="font-semibold text-gray-800">KSh 10,000</span>
              </li>
              <li className="flex justify-between">
                <span>PC Cost (each)</span>
                <span className="font-semibold text-gray-800">KSh 40,000</span>
              </li>
            </ul>
          </div>
          <div className="p-6">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center text-sm">📡</span>
              Monthly Bandwidth
            </h4>
            <ul className="space-y-2 text-sm text-gray-600">
              {[
                ["4 Mbps", "KSh 1,200"],
                ["10 Mbps", "KSh 2,000"],
                ["20 Mbps", "KSh 3,500"],
                ["25 Mbps", "KSh 4,000"],
                ["50 Mbps", "KSh 7,000"],
              ].map(([speed, cost]) => (
                <li key={speed} className="flex justify-between">
                  <span>{speed}</span>
                  <span className="font-semibold text-gray-800">{cost}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="p-6">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span className="w-7 h-7 bg-amber-100 rounded-lg flex items-center justify-center text-sm">⚖️</span>
              Penalties & Discounts
            </h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex justify-between">
                <span>Overdue Fine</span>
                <span className="font-semibold text-red-600">15% of bill</span>
              </li>
              <li className="flex justify-between">
                <span>Reconnection Fee</span>
                <span className="font-semibold text-gray-800">KSh 1,000</span>
              </li>
              <li className="flex justify-between">
                <span>Upgrade Discount</span>
                <span className="font-semibold text-emerald-600">10% off</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
