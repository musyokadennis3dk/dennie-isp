import Link from "next/link";
import { db } from "@/db";
import { institutions } from "@/db/schema";
import { formatKsh } from "@/lib/utils";

export default async function InstitutionsPage() {
  const allInstitutions = await db.select().from(institutions).orderBy(institutions.name);

  const statusColors: Record<string, string> = {
    active: "bg-green-100 text-green-800",
    inactive: "bg-gray-100 text-gray-700",
    disconnected: "bg-red-100 text-red-800",
  };

  const typeLabels: Record<string, string> = {
    primary: "Primary",
    junior: "Junior",
    senior: "Senior",
    college: "College",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Registered Institutions</h1>
          <p className="text-gray-600 mt-1">{allInstitutions.length} institution(s) registered</p>
        </div>
        <Link
          href="/register"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          + Register New
        </Link>
      </div>

      {allInstitutions.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-12 text-center">
          <div className="text-5xl mb-4">🏫</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No Institutions Yet</h2>
          <p className="text-gray-500 mb-6">Start by registering a learning institution.</p>
          <Link
            href="/register"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Register First Institution
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">#</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Institution</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Type</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">County</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Contact</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Bandwidth</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {allInstitutions.map((inst, idx) => (
                <tr key={inst.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{inst.name}</div>
                    <div className="text-gray-500 text-xs">{inst.email}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {typeLabels[inst.type] || inst.type}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{inst.county}</td>
                  <td className="px-4 py-3">
                    <div className="text-gray-900">{inst.contactName}</div>
                    <div className="text-gray-500 text-xs">{inst.contactPhone}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {inst.bandwidthMbps ? `${inst.bandwidthMbps} Mbps` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[inst.serviceStatus] || "bg-gray-100 text-gray-700"}`}
                    >
                      {inst.serviceStatus.charAt(0).toUpperCase() + inst.serviceStatus.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/institutions/${inst.id}`}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
