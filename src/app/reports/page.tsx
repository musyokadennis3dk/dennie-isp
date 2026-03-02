import Link from "next/link";
import { db } from "@/db";
import { institutions, payments, monthlyBills, infrastructurePurchases } from "@/db/schema";
import { eq } from "drizzle-orm";
import { formatKsh } from "@/lib/utils";

export default async function ReportsPage() {
  const allInstitutions = await db.select().from(institutions).orderBy(institutions.name);
  const allPayments = await db.select().from(payments);
  const allBills = await db.select().from(monthlyBills);
  const allInfra = await db.select().from(infrastructurePurchases);

  // Registered institutions
  const registeredInstitutions = allInstitutions.filter(
    (i) => i.registrationStatus === "registered"
  );

  // Defaulters (overdue bills)
  const overdueBillsWithInstitution = allBills
    .filter((b) => b.status === "overdue")
    .map((bill) => ({
      bill,
      institution: allInstitutions.find((i) => i.id === bill.institutionId),
    }))
    .filter((x) => x.institution);

  // Disconnected institutions
  const disconnectedInstitutions = allInstitutions.filter(
    (i) => i.serviceStatus === "disconnected"
  );

  // Infrastructure details per institution
  const infraByInstitution = allInstitutions.map((inst) => {
    const purchases = allInfra.filter((p) => p.institutionId === inst.id);
    const totalPcs = purchases.reduce((sum, p) => sum + p.numberOfPcs, 0);
    const totalLanNodes = purchases.reduce((sum, p) => sum + p.numberOfLanNodes, 0);
    const totalCost = purchases.reduce((sum, p) => sum + p.totalCost, 0);
    return { institution: inst, purchases, totalPcs, totalLanNodes, totalCost };
  });

  // Computations
  // 1. Total installation cost per institution
  const installationByInstitution = allInstitutions.map((inst) => {
    const installPayments = allPayments.filter(
      (p) => p.institutionId === inst.id && p.paymentType === "installation"
    );
    return {
      institution: inst,
      total: installPayments.reduce((sum, p) => sum + p.amount, 0),
    };
  });

  // 2. Monthly charges by institution type
  const institutionTypes = ["primary", "junior", "senior", "college"];
  const monthlyByType = institutionTypes.map((type) => {
    const typeInstitutions = allInstitutions.filter((i) => i.type === type);
    const typePayments = allPayments.filter(
      (p) =>
        p.paymentType === "monthly" &&
        typeInstitutions.some((i) => i.id === p.institutionId)
    );
    const total = typePayments.reduce((sum, p) => sum + p.amount, 0);
    const discounts = typePayments.reduce((sum, p) => sum + (p.discountAmount || 0), 0);
    return { type, count: typeInstitutions.length, total, discounts };
  });

  // 3. Overdue fines and reconnection fees by type
  const finesByType = institutionTypes.map((type) => {
    const typeInstitutions = allInstitutions.filter((i) => i.type === type);
    const finePayments = allPayments.filter(
      (p) =>
        p.paymentType === "overdue_fine" &&
        typeInstitutions.some((i) => i.id === p.institutionId)
    );
    const reconnPayments = allPayments.filter(
      (p) =>
        p.paymentType === "reconnection" &&
        typeInstitutions.some((i) => i.id === p.institutionId)
    );
    const monthlyPayments = allPayments.filter(
      (p) =>
        p.paymentType === "monthly" &&
        typeInstitutions.some((i) => i.id === p.institutionId)
    );
    return {
      type,
      overdueFines: finePayments.reduce((sum, p) => sum + p.amount, 0),
      reconnectionFees: reconnPayments.reduce((sum, p) => sum + p.amount, 0),
      monthlyTotal: monthlyPayments.reduce((sum, p) => sum + p.amount, 0),
    };
  });

  // 4. Aggregate per institution
  const aggregateByInstitution = allInstitutions.map((inst) => {
    const instPayments = allPayments.filter((p) => p.institutionId === inst.id);
    const registration = instPayments
      .filter((p) => p.paymentType === "registration")
      .reduce((sum, p) => sum + p.amount, 0);
    const installation = instPayments
      .filter((p) => p.paymentType === "installation")
      .reduce((sum, p) => sum + p.amount, 0);
    const monthly = instPayments
      .filter((p) => p.paymentType === "monthly")
      .reduce((sum, p) => sum + p.amount, 0);
    const overdueFines = instPayments
      .filter((p) => p.paymentType === "overdue_fine")
      .reduce((sum, p) => sum + p.amount, 0);
    const reconnection = instPayments
      .filter((p) => p.paymentType === "reconnection")
      .reduce((sum, p) => sum + p.amount, 0);
    const infraCost = allInfra
      .filter((i) => i.institutionId === inst.id)
      .reduce((sum, i) => sum + i.totalCost, 0);
    const total = registration + installation + monthly + overdueFines + reconnection + infraCost;
    return { institution: inst, registration, installation, monthly, overdueFines, reconnection, infraCost, total };
  });

  const grandTotal = aggregateByInstitution.reduce((sum, a) => sum + a.total, 0);

  const typeLabels: Record<string, string> = {
    primary: "Primary",
    junior: "Junior",
    senior: "Senior",
    college: "College",
  };

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-600 mt-1">Comprehensive reports and computations for Azani ISP</p>
      </div>

      {/* Report 1: Registered Institutions */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
          Registered Institutions ({registeredInstitutions.length})
        </h2>
        <div className="bg-white rounded-xl shadow overflow-hidden">
          {registeredInstitutions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No registered institutions</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-600">#</th>
                  <th className="text-left px-4 py-3 text-gray-600">Institution</th>
                  <th className="text-left px-4 py-3 text-gray-600">Type</th>
                  <th className="text-left px-4 py-3 text-gray-600">County</th>
                  <th className="text-left px-4 py-3 text-gray-600">Contact</th>
                  <th className="text-left px-4 py-3 text-gray-600">Bandwidth</th>
                  <th className="text-left px-4 py-3 text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 text-gray-600">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {registeredInstitutions.map((inst, idx) => (
                  <tr key={inst.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <Link href={`/institutions/${inst.id}`} className="font-medium text-blue-600 hover:text-blue-800">
                        {inst.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{typeLabels[inst.type] || inst.type}</td>
                    <td className="px-4 py-3 text-gray-700">{inst.county}</td>
                    <td className="px-4 py-3">
                      <div>{inst.contactName}</div>
                      <div className="text-gray-500 text-xs">{inst.contactPhone}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {inst.bandwidthMbps ? `${inst.bandwidthMbps} Mbps` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        inst.serviceStatus === "active" ? "bg-green-100 text-green-800" :
                        inst.serviceStatus === "disconnected" ? "bg-red-100 text-red-800" :
                        "bg-gray-100 text-gray-700"
                      }`}>
                        {inst.serviceStatus.charAt(0).toUpperCase() + inst.serviceStatus.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {inst.registrationDate ? new Date(inst.registrationDate).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Report 2: Defaulters */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span className="w-7 h-7 bg-yellow-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
          List of Defaulters ({overdueBillsWithInstitution.length} overdue bill(s))
        </h2>
        <div className="bg-white rounded-xl shadow overflow-hidden">
          {overdueBillsWithInstitution.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No defaulters — all bills are paid!</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-600">Institution</th>
                  <th className="text-left px-4 py-3 text-gray-600">Type</th>
                  <th className="text-left px-4 py-3 text-gray-600">Billing Month</th>
                  <th className="text-right px-4 py-3 text-gray-600">Bill Amount</th>
                  <th className="text-right px-4 py-3 text-gray-600">Overdue Fine (15%)</th>
                  <th className="text-right px-4 py-3 text-gray-600">Total Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {overdueBillsWithInstitution.map(({ bill, institution }) => {
                  const fine = bill.overdueFine || bill.totalAmount * 0.15;
                  return (
                    <tr key={bill.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <Link href={`/institutions/${institution!.id}`} className="font-medium text-blue-600 hover:text-blue-800">
                          {institution!.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{typeLabels[institution!.type] || institution!.type}</td>
                      <td className="px-4 py-3 text-gray-700">{bill.billingMonth}</td>
                      <td className="px-4 py-3 text-right">{formatKsh(bill.totalAmount)}</td>
                      <td className="px-4 py-3 text-right text-red-600">{formatKsh(fine)}</td>
                      <td className="px-4 py-3 text-right font-semibold">{formatKsh(bill.totalAmount + fine)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Report 3: Disconnected Institutions */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span className="w-7 h-7 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
          Institutions with Disconnection Issues ({disconnectedInstitutions.length})
        </h2>
        <div className="bg-white rounded-xl shadow overflow-hidden">
          {disconnectedInstitutions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No disconnected institutions</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-600">Institution</th>
                  <th className="text-left px-4 py-3 text-gray-600">Type</th>
                  <th className="text-left px-4 py-3 text-gray-600">County</th>
                  <th className="text-left px-4 py-3 text-gray-600">Contact</th>
                  <th className="text-left px-4 py-3 text-gray-600">Last Bandwidth</th>
                  <th className="text-left px-4 py-3 text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {disconnectedInstitutions.map((inst) => (
                  <tr key={inst.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link href={`/institutions/${inst.id}`} className="font-medium text-blue-600 hover:text-blue-800">
                        {inst.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{typeLabels[inst.type] || inst.type}</td>
                    <td className="px-4 py-3 text-gray-700">{inst.county}</td>
                    <td className="px-4 py-3">
                      <div>{inst.contactName}</div>
                      <div className="text-gray-500 text-xs">{inst.contactPhone}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {inst.bandwidthMbps ? `${inst.bandwidthMbps} Mbps` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/payments?institutionId=${inst.id}`}
                        className="text-green-600 hover:text-green-800 font-medium text-xs"
                      >
                        Pay & Reconnect
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Report 4: Infrastructure Details */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span className="w-7 h-7 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
          Infrastructure Requirements per Institution
        </h2>
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600">Institution</th>
                <th className="text-left px-4 py-3 text-gray-600">Type</th>
                <th className="text-center px-4 py-3 text-gray-600">Has PCs</th>
                <th className="text-center px-4 py-3 text-gray-600">Has LAN</th>
                <th className="text-right px-4 py-3 text-gray-600">PCs Purchased</th>
                <th className="text-right px-4 py-3 text-gray-600">LAN Nodes</th>
                <th className="text-right px-4 py-3 text-gray-600">Infra Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {infraByInstitution.map(({ institution: inst, totalPcs, totalLanNodes, totalCost }) => (
                <tr key={inst.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/institutions/${inst.id}`} className="font-medium text-blue-600 hover:text-blue-800">
                      {inst.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{typeLabels[inst.type] || inst.type}</td>
                  <td className="px-4 py-3 text-center">
                    {inst.hasComputers ? "✅" : "❌"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {inst.hasLan ? "✅" : "❌"}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700">{totalPcs || "—"}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{totalLanNodes || "—"}</td>
                  <td className="px-4 py-3 text-right font-medium">
                    {totalCost > 0 ? formatKsh(totalCost) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Computations Section */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
          <span className="w-7 h-7 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold">5</span>
          Computations & Analytics
        </h2>

        {/* 5a: Installation costs */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-700 mb-3">
            (a) Total Installation Cost per Institution
          </h3>
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-600">Institution</th>
                  <th className="text-left px-4 py-3 text-gray-600">Type</th>
                  <th className="text-right px-4 py-3 text-gray-600">Installation Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {installationByInstitution.filter((x) => x.total > 0).map(({ institution: inst, total }) => (
                  <tr key={inst.id}>
                    <td className="px-4 py-3 font-medium">{inst.name}</td>
                    <td className="px-4 py-3 text-gray-600">{typeLabels[inst.type] || inst.type}</td>
                    <td className="px-4 py-3 text-right font-semibold text-green-700">{formatKsh(total)}</td>
                  </tr>
                ))}
                {installationByInstitution.filter((x) => x.total > 0).length === 0 && (
                  <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-500">No installation payments recorded</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 5b: PC and LAN costs */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-700 mb-3">
            (b) PC and LAN Costs for Institutions with Assorted Services
          </h3>
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-600">Institution</th>
                  <th className="text-right px-4 py-3 text-gray-600">PCs</th>
                  <th className="text-right px-4 py-3 text-gray-600">PC Cost</th>
                  <th className="text-right px-4 py-3 text-gray-600">LAN Nodes</th>
                  <th className="text-right px-4 py-3 text-gray-600">LAN Cost</th>
                  <th className="text-right px-4 py-3 text-gray-600">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {infraByInstitution.filter((x) => x.totalCost > 0).map(({ institution: inst, totalPcs, totalLanNodes, purchases }) => {
                  const pcCost = purchases.reduce((sum, p) => sum + p.pcCostTotal, 0);
                  const lanCost = purchases.reduce((sum, p) => sum + p.lanCostTotal, 0);
                  return (
                    <tr key={inst.id}>
                      <td className="px-4 py-3 font-medium">{inst.name}</td>
                      <td className="px-4 py-3 text-right">{totalPcs}</td>
                      <td className="px-4 py-3 text-right">{formatKsh(pcCost)}</td>
                      <td className="px-4 py-3 text-right">{totalLanNodes}</td>
                      <td className="px-4 py-3 text-right">{formatKsh(lanCost)}</td>
                      <td className="px-4 py-3 text-right font-semibold">{formatKsh(pcCost + lanCost)}</td>
                    </tr>
                  );
                })}
                {infraByInstitution.filter((x) => x.totalCost > 0).length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-500">No infrastructure purchases recorded</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 5c & 5d: Monthly charges by type */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-700 mb-3">
            (c) & (d) Monthly Charges, Overdue Fines & Reconnection Fees by Institution Category
          </h3>
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-600">Category</th>
                  <th className="text-right px-4 py-3 text-gray-600">Institutions</th>
                  <th className="text-right px-4 py-3 text-gray-600">Monthly Total</th>
                  <th className="text-right px-4 py-3 text-gray-600">Overdue Fines</th>
                  <th className="text-right px-4 py-3 text-gray-600">Reconnection Fees</th>
                  <th className="text-right px-4 py-3 text-gray-600">Grand Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {institutionTypes.map((type) => {
                  const monthly = monthlyByType.find((m) => m.type === type);
                  const fines = finesByType.find((f) => f.type === type);
                  const total = (monthly?.total || 0) + (fines?.overdueFines || 0) + (fines?.reconnectionFees || 0);
                  return (
                    <tr key={type}>
                      <td className="px-4 py-3 font-medium capitalize">{typeLabels[type]}</td>
                      <td className="px-4 py-3 text-right">{monthly?.count || 0}</td>
                      <td className="px-4 py-3 text-right">{formatKsh(monthly?.total || 0)}</td>
                      <td className="px-4 py-3 text-right text-red-600">{formatKsh(fines?.overdueFines || 0)}</td>
                      <td className="px-4 py-3 text-right text-orange-600">{formatKsh(fines?.reconnectionFees || 0)}</td>
                      <td className="px-4 py-3 text-right font-semibold">{formatKsh(total)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 5e: Aggregate per institution */}
        <div>
          <h3 className="font-semibold text-gray-700 mb-3">
            (e) Aggregate Amount per Service Sorted by Institution
          </h3>
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-600">Institution</th>
                  <th className="text-right px-4 py-3 text-gray-600">Registration</th>
                  <th className="text-right px-4 py-3 text-gray-600">Installation</th>
                  <th className="text-right px-4 py-3 text-gray-600">Monthly</th>
                  <th className="text-right px-4 py-3 text-gray-600">Fines</th>
                  <th className="text-right px-4 py-3 text-gray-600">Reconnection</th>
                  <th className="text-right px-4 py-3 text-gray-600">Infrastructure</th>
                  <th className="text-right px-4 py-3 text-gray-600 font-bold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {aggregateByInstitution.map(
                  ({ institution: inst, registration, installation, monthly, overdueFines, reconnection, infraCost, total }) => (
                    <tr key={inst.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <Link href={`/institutions/${inst.id}`} className="font-medium text-blue-600 hover:text-blue-800">
                          {inst.name}
                        </Link>
                        <div className="text-xs text-gray-500 capitalize">{typeLabels[inst.type]}</div>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700">{formatKsh(registration)}</td>
                      <td className="px-4 py-3 text-right text-gray-700">{formatKsh(installation)}</td>
                      <td className="px-4 py-3 text-right text-gray-700">{formatKsh(monthly)}</td>
                      <td className="px-4 py-3 text-right text-red-600">{formatKsh(overdueFines)}</td>
                      <td className="px-4 py-3 text-right text-orange-600">{formatKsh(reconnection)}</td>
                      <td className="px-4 py-3 text-right text-purple-600">{formatKsh(infraCost)}</td>
                      <td className="px-4 py-3 text-right font-bold text-gray-900">{formatKsh(total)}</td>
                    </tr>
                  )
                )}
                {aggregateByInstitution.length > 0 && (
                  <tr className="bg-blue-50 font-semibold">
                    <td className="px-4 py-3 text-blue-900">Grand Total</td>
                    <td className="px-4 py-3 text-right text-blue-900">
                      {formatKsh(aggregateByInstitution.reduce((s, a) => s + a.registration, 0))}
                    </td>
                    <td className="px-4 py-3 text-right text-blue-900">
                      {formatKsh(aggregateByInstitution.reduce((s, a) => s + a.installation, 0))}
                    </td>
                    <td className="px-4 py-3 text-right text-blue-900">
                      {formatKsh(aggregateByInstitution.reduce((s, a) => s + a.monthly, 0))}
                    </td>
                    <td className="px-4 py-3 text-right text-blue-900">
                      {formatKsh(aggregateByInstitution.reduce((s, a) => s + a.overdueFines, 0))}
                    </td>
                    <td className="px-4 py-3 text-right text-blue-900">
                      {formatKsh(aggregateByInstitution.reduce((s, a) => s + a.reconnection, 0))}
                    </td>
                    <td className="px-4 py-3 text-right text-blue-900">
                      {formatKsh(aggregateByInstitution.reduce((s, a) => s + a.infraCost, 0))}
                    </td>
                    <td className="px-4 py-3 text-right text-blue-900 font-bold">
                      {formatKsh(grandTotal)}
                    </td>
                  </tr>
                )}
                {aggregateByInstitution.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-6 text-center text-gray-500">No data available</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
