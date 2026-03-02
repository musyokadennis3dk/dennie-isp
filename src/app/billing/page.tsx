"use client";

import { useState, useEffect } from "react";
import { formatKsh, getCurrentBillingMonth } from "@/lib/utils";

interface MonthlyBill {
  id: number;
  institutionId: number;
  billingMonth: string;
  bandwidthMbps: number;
  totalAmount: number;
  overdueFine: number | null;
  status: string;
  dueDate: string | null;
  paidDate: string | null;
}

interface Institution {
  id: number;
  name: string;
  serviceStatus: string;
  bandwidthMbps: number | null;
}

export default function BillingPage() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [bills, setBills] = useState<MonthlyBill[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [billingMonth, setBillingMonth] = useState(getCurrentBillingMonth());

  const fetchData = async () => {
    const [instRes] = await Promise.all([fetch("/api/institutions")]);
    const instData = await instRes.json();
    setInstitutions(instData);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGenerateBills = async () => {
    setLoading(true);
    setMessage("");
    setError("");
    try {
      const res = await fetch("/api/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billingMonth }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to generate bills");
      } else {
        setMessage(
          `Generated ${data.created} bill(s) for ${billingMonth}. ${data.skipped} skipped (already exist).`
        );
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkOverdue = async () => {
    setLoading(true);
    setMessage("");
    setError("");
    try {
      const res = await fetch("/api/billing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_overdue" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to mark overdue");
      } else {
        setMessage(`Marked ${data.markedOverdue} bill(s) as overdue.`);
        fetchData();
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    setMessage("");
    setError("");
    try {
      const res = await fetch("/api/billing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disconnect" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to disconnect");
      } else {
        setMessage(`Disconnected ${data.disconnected} institution(s).`);
        fetchData();
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const activeInstitutions = institutions.filter((i) => i.serviceStatus === "active");
  const disconnectedInstitutions = institutions.filter((i) => i.serviceStatus === "disconnected");

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Billing Management</h1>
        <p className="text-gray-600 mt-1">
          Generate monthly bills, mark overdue accounts, and manage disconnections
        </p>
      </div>

      {message && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {message}
        </div>
      )}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow p-5 border-l-4 border-green-500">
          <div className="text-2xl font-bold text-green-700">{activeInstitutions.length}</div>
          <div className="text-sm text-gray-500 mt-1">Active Institutions</div>
        </div>
        <div className="bg-white rounded-xl shadow p-5 border-l-4 border-red-500">
          <div className="text-2xl font-bold text-red-700">{disconnectedInstitutions.length}</div>
          <div className="text-sm text-gray-500 mt-1">Disconnected</div>
        </div>
        <div className="bg-white rounded-xl shadow p-5 border-l-4 border-blue-500">
          <div className="text-2xl font-bold text-blue-700">{institutions.length}</div>
          <div className="text-sm text-gray-500 mt-1">Total Institutions</div>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Generate Bills */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="font-semibold text-gray-800 mb-3">Generate Monthly Bills</h2>
          <p className="text-sm text-gray-600 mb-4">
            Create bills for all active institutions for the selected month.
          </p>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Billing Month</label>
            <input
              type="month"
              value={billingMonth}
              onChange={(e) => setBillingMonth(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleGenerateBills}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
          >
            Generate Bills
          </button>
        </div>

        {/* Mark Overdue */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="font-semibold text-gray-800 mb-3">Mark Overdue Bills</h2>
          <p className="text-sm text-gray-600 mb-4">
            Mark all unpaid bills past their due date as overdue. A 15% fine will be applied.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-xs text-yellow-800">
            Bills are due at the end of each month. Overdue fine = 15% of bill amount.
          </div>
          <button
            onClick={handleMarkOverdue}
            disabled={loading}
            className="w-full bg-yellow-600 text-white py-2 rounded-lg hover:bg-yellow-700 disabled:opacity-50 transition-colors font-medium"
          >
            Mark Overdue
          </button>
        </div>

        {/* Disconnect */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="font-semibold text-gray-800 mb-3">Disconnect Defaulters</h2>
          <p className="text-sm text-gray-600 mb-4">
            Disconnect institutions that have not paid overdue bills by the 10th of the following
            month.
          </p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-xs text-red-800">
            Disconnection occurs on the 10th of the month following the overdue billing month.
          </div>
          <button
            onClick={handleDisconnect}
            disabled={loading}
            className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors font-medium"
          >
            Disconnect Defaulters
          </button>
        </div>
      </div>

      {/* Institutions Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Institution Service Status</h2>
        </div>
        {institutions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No institutions registered yet</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600">Institution</th>
                <th className="text-left px-4 py-3 text-gray-600">Bandwidth</th>
                <th className="text-left px-4 py-3 text-gray-600">Monthly Cost</th>
                <th className="text-left px-4 py-3 text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {institutions.map((inst) => {
                const monthlyCost = inst.bandwidthMbps
                  ? inst.bandwidthMbps === 4
                    ? 1200
                    : inst.bandwidthMbps === 10
                      ? 2000
                      : inst.bandwidthMbps === 20
                        ? 3500
                        : inst.bandwidthMbps === 25
                          ? 4000
                          : inst.bandwidthMbps === 50
                            ? 7000
                            : 0
                  : 0;

                const statusColors: Record<string, string> = {
                  active: "bg-green-100 text-green-800",
                  inactive: "bg-gray-100 text-gray-700",
                  disconnected: "bg-red-100 text-red-800",
                };

                return (
                  <tr key={inst.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{inst.name}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {inst.bandwidthMbps ? `${inst.bandwidthMbps} Mbps` : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {monthlyCost > 0 ? formatKsh(monthlyCost) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[inst.serviceStatus] || "bg-gray-100 text-gray-700"}`}
                      >
                        {inst.serviceStatus.charAt(0).toUpperCase() +
                          inst.serviceStatus.slice(1)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
