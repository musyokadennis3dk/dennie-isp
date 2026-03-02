import Link from "next/link";
import { db } from "@/db";
import { institutions, payments, infrastructurePurchases, monthlyBills } from "@/db/schema";
import { eq } from "drizzle-orm";
import { formatKsh } from "@/lib/utils";
import { notFound } from "next/navigation";

export default async function InstitutionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const institutionId = parseInt(id);

  const [institution] = await db
    .select()
    .from(institutions)
    .where(eq(institutions.id, institutionId));

  if (!institution) notFound();

  const institutionPayments = await db
    .select()
    .from(payments)
    .where(eq(payments.institutionId, institutionId))
    .orderBy(payments.paymentDate);

  const infraPurchases = await db
    .select()
    .from(infrastructurePurchases)
    .where(eq(infrastructurePurchases.institutionId, institutionId));

  const bills = await db
    .select()
    .from(monthlyBills)
    .where(eq(monthlyBills.institutionId, institutionId))
    .orderBy(monthlyBills.billingMonth);

  const totalPaid = institutionPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalInfra = infraPurchases.reduce((sum, i) => sum + i.totalCost, 0);

  const statusColors: Record<string, string> = {
    active: "bg-green-100 text-green-800",
    inactive: "bg-gray-100 text-gray-700",
    disconnected: "bg-red-100 text-red-800",
  };

  const billStatusColors: Record<string, string> = {
    paid: "bg-green-100 text-green-800",
    pending: "bg-yellow-100 text-yellow-800",
    overdue: "bg-red-100 text-red-800",
    disconnected: "bg-gray-100 text-gray-700",
  };

  const paymentTypeLabels: Record<string, string> = {
    registration: "Registration Fee",
    installation: "Installation Fee",
    monthly: "Monthly Payment",
    overdue_fine: "Overdue Fine",
    reconnection: "Reconnection Fee",
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link href="/institutions" className="text-blue-600 hover:text-blue-800 text-sm">
              ← Institutions
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{institution.name}</h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-gray-600 text-sm capitalize">{institution.type} School</span>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[institution.serviceStatus]}`}
            >
              {institution.serviceStatus.charAt(0).toUpperCase() +
                institution.serviceStatus.slice(1)}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/payments?institutionId=${institution.id}`}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm font-medium"
          >
            Record Payment
          </Link>
          <Link
            href={`/infrastructure?institutionId=${institution.id}`}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 text-sm font-medium"
          >
            Add Infrastructure
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-1 space-y-4">
          {/* Institution Info */}
          <div className="bg-white rounded-xl shadow p-5">
            <h2 className="font-semibold text-gray-800 mb-3">Institution Info</h2>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-gray-500">Address</dt>
                <dd className="text-gray-900">{institution.address}</dd>
              </div>
              <div>
                <dt className="text-gray-500">County</dt>
                <dd className="text-gray-900">{institution.county}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Email</dt>
                <dd className="text-gray-900">{institution.email}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Phone</dt>
                <dd className="text-gray-900">{institution.phone}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Users</dt>
                <dd className="text-gray-900">{institution.numberOfUsers ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Registered</dt>
                <dd className="text-gray-900">
                  {institution.registrationDate
                    ? new Date(institution.registrationDate).toLocaleDateString()
                    : "—"}
                </dd>
              </div>
            </dl>
          </div>

          {/* Contact Person */}
          <div className="bg-white rounded-xl shadow p-5">
            <h2 className="font-semibold text-gray-800 mb-3">Contact Person</h2>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-gray-500">Name</dt>
                <dd className="text-gray-900">{institution.contactName}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Role</dt>
                <dd className="text-gray-900">{institution.contactRole}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Phone</dt>
                <dd className="text-gray-900">{institution.contactPhone}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Email</dt>
                <dd className="text-gray-900">{institution.contactEmail}</dd>
              </div>
            </dl>
          </div>

          {/* Internet Service */}
          <div className="bg-white rounded-xl shadow p-5">
            <h2 className="font-semibold text-gray-800 mb-3">Internet Service</h2>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-gray-500">Bandwidth</dt>
                <dd className="text-gray-900 font-medium">
                  {institution.bandwidthMbps ? `${institution.bandwidthMbps} Mbps` : "Not connected"}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Connected Since</dt>
                <dd className="text-gray-900">
                  {institution.connectionDate
                    ? new Date(institution.connectionDate).toLocaleDateString()
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Has Computers</dt>
                <dd className="text-gray-900">{institution.hasComputers ? "Yes" : "No"}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Has LAN</dt>
                <dd className="text-gray-900">{institution.hasLan ? "Yes" : "No"}</dd>
              </div>
            </dl>
          </div>

          {/* Financial Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
            <h2 className="font-semibold text-blue-900 mb-3">Financial Summary</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-blue-700">Total Payments</dt>
                <dd className="font-semibold text-blue-900">{formatKsh(totalPaid)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-blue-700">Infrastructure</dt>
                <dd className="font-semibold text-blue-900">{formatKsh(totalInfra)}</dd>
              </div>
              <div className="flex justify-between border-t border-blue-200 pt-2 mt-2">
                <dt className="text-blue-800 font-medium">Grand Total</dt>
                <dd className="font-bold text-blue-900">{formatKsh(totalPaid + totalInfra)}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Monthly Bills */}
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-800">Monthly Bills</h2>
              <span className="text-sm text-gray-500">{bills.length} bill(s)</span>
            </div>
            {bills.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No bills generated yet</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-2 text-gray-600">Month</th>
                    <th className="text-left px-4 py-2 text-gray-600">Bandwidth</th>
                    <th className="text-right px-4 py-2 text-gray-600">Amount</th>
                    <th className="text-right px-4 py-2 text-gray-600">Fine</th>
                    <th className="text-left px-4 py-2 text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {bills.map((bill) => (
                    <tr key={bill.id}>
                      <td className="px-4 py-2 font-medium">{bill.billingMonth}</td>
                      <td className="px-4 py-2 text-gray-600">{bill.bandwidthMbps} Mbps</td>
                      <td className="px-4 py-2 text-right">{formatKsh(bill.totalAmount)}</td>
                      <td className="px-4 py-2 text-right text-red-600">
                        {bill.overdueFine ? formatKsh(bill.overdueFine) : "—"}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${billStatusColors[bill.status]}`}
                        >
                          {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Payment History */}
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-800">Payment History</h2>
              <span className="text-sm text-gray-500">{institutionPayments.length} payment(s)</span>
            </div>
            {institutionPayments.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No payments recorded</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-2 text-gray-600">Date</th>
                    <th className="text-left px-4 py-2 text-gray-600">Type</th>
                    <th className="text-left px-4 py-2 text-gray-600">Month</th>
                    <th className="text-right px-4 py-2 text-gray-600">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {institutionPayments.map((p) => (
                    <tr key={p.id}>
                      <td className="px-4 py-2 text-gray-600">
                        {p.paymentDate
                          ? new Date(p.paymentDate).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-4 py-2 font-medium">
                        {paymentTypeLabels[p.paymentType] || p.paymentType}
                      </td>
                      <td className="px-4 py-2 text-gray-600">{p.billingMonth || "—"}</td>
                      <td className="px-4 py-2 text-right font-medium text-green-700">
                        {formatKsh(p.amount)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 font-semibold">
                    <td colSpan={3} className="px-4 py-2 text-right text-gray-700">
                      Total
                    </td>
                    <td className="px-4 py-2 text-right text-green-800">
                      {formatKsh(totalPaid)}
                    </td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>

          {/* Infrastructure Purchases */}
          {infraPurchases.length > 0 && (
            <div className="bg-white rounded-xl shadow overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-800">Infrastructure Purchases</h2>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-2 text-gray-600">Date</th>
                    <th className="text-right px-4 py-2 text-gray-600">PCs</th>
                    <th className="text-right px-4 py-2 text-gray-600">PC Cost</th>
                    <th className="text-right px-4 py-2 text-gray-600">LAN Nodes</th>
                    <th className="text-right px-4 py-2 text-gray-600">LAN Cost</th>
                    <th className="text-right px-4 py-2 text-gray-600">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {infraPurchases.map((p) => (
                    <tr key={p.id}>
                      <td className="px-4 py-2 text-gray-600">
                        {p.purchaseDate
                          ? new Date(p.purchaseDate).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-4 py-2 text-right">{p.numberOfPcs}</td>
                      <td className="px-4 py-2 text-right">{formatKsh(p.pcCostTotal)}</td>
                      <td className="px-4 py-2 text-right">{p.numberOfLanNodes}</td>
                      <td className="px-4 py-2 text-right">{formatKsh(p.lanCostTotal)}</td>
                      <td className="px-4 py-2 text-right font-medium">{formatKsh(p.totalCost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
