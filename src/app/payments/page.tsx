"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { BANDWIDTH_OPTIONS, BANDWIDTH_COSTS } from "@/db/schema";
import {
  INSTALLATION_FEE,
  getBandwidthCost,
  calculateUpgradeCost,
  formatKsh,
  getCurrentBillingMonth,
} from "@/lib/utils";

interface Institution {
  id: number;
  name: string;
  bandwidthMbps: number | null;
  serviceStatus: string;
}

function PaymentsForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const preselectedId = searchParams.get("institutionId");

  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    institutionId: preselectedId || "",
    paymentType: "installation",
    billingMonth: getCurrentBillingMonth(),
    bandwidthMbps: "4",
    isUpgrade: false,
    notes: "",
  });

  useEffect(() => {
    fetch("/api/institutions")
      .then((r) => r.json())
      .then(setInstitutions);
  }, []);

  const selectedInstitution = institutions.find(
    (i) => i.id === parseInt(form.institutionId)
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const calculateAmount = () => {
    if (form.paymentType === "installation") return INSTALLATION_FEE;
    if (form.paymentType === "monthly") {
      const bw = parseInt(form.bandwidthMbps);
      if (form.isUpgrade) return calculateUpgradeCost(bw);
      return getBandwidthCost(bw);
    }
    return 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Payment failed");
      } else {
        const amount = calculateAmount();
        setSuccess(
          `Payment of ${formatKsh(amount)} recorded successfully!${
            selectedInstitution?.serviceStatus === "disconnected"
              ? ` Reconnection fee of ${formatKsh(1000)} also charged.`
              : ""
          }`
        );
        setForm((prev) => ({ ...prev, notes: "" }));
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const amount = calculateAmount();
  const bw = parseInt(form.bandwidthMbps);
  const baseCost = getBandwidthCost(bw);
  const discount = form.isUpgrade ? baseCost * 0.1 : 0;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Record Payment</h1>
        <p className="text-gray-600 mt-1">Capture registration, installation, or monthly fees</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl shadow p-6 space-y-4">
          {/* Institution */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Institution *
            </label>
            <select
              name="institutionId"
              value={form.institutionId}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select institution...</option>
              {institutions.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  {inst.name}{" "}
                  {inst.serviceStatus === "disconnected" ? "(Disconnected)" : ""}
                </option>
              ))}
            </select>
            {selectedInstitution?.serviceStatus === "disconnected" && (
              <p className="mt-1 text-sm text-red-600">
                ⚠️ This institution is disconnected. A reconnection fee of{" "}
                {formatKsh(1000)} will be added.
              </p>
            )}
          </div>

          {/* Payment Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Type *
            </label>
            <select
              name="paymentType"
              value={form.paymentType}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="installation">Installation Fee</option>
              <option value="monthly">Monthly Payment</option>
              <option value="overdue_fine">Overdue Fine</option>
            </select>
          </div>

          {/* Monthly-specific fields */}
          {form.paymentType === "monthly" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Billing Month *
                </label>
                <input
                  type="month"
                  name="billingMonth"
                  value={form.billingMonth}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bandwidth *
                </label>
                <select
                  name="bandwidthMbps"
                  value={form.bandwidthMbps}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {BANDWIDTH_OPTIONS.map((bw) => (
                    <option key={bw} value={bw}>
                      {bw} Mbps — {formatKsh(BANDWIDTH_COSTS[bw])} / month
                    </option>
                  ))}
                </select>
              </div>

              {selectedInstitution?.bandwidthMbps &&
                parseInt(form.bandwidthMbps) > selectedInstitution.bandwidthMbps && (
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="isUpgrade"
                        checked={form.isUpgrade}
                        onChange={handleChange}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm text-gray-700">
                        This is an upgrade (10% discount applies)
                      </span>
                    </label>
                  </div>
                )}
            </>
          )}

          {/* Overdue fine month */}
          {form.paymentType === "overdue_fine" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Billing Month (overdue) *
              </label>
              <input
                type="month"
                name="billingMonth"
                value={form.billingMonth}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Optional notes..."
            />
          </div>
        </div>

        {/* Amount Summary */}
        {form.paymentType !== "overdue_fine" && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Payment Summary</h3>
            {form.paymentType === "installation" && (
              <div className="flex justify-between text-sm">
                <span className="text-blue-700">Installation Fee</span>
                <span className="font-semibold text-blue-900">{formatKsh(INSTALLATION_FEE)}</span>
              </div>
            )}
            {form.paymentType === "monthly" && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-blue-700">Base Cost ({bw} Mbps)</span>
                  <span className="text-blue-900">{formatKsh(baseCost)}</span>
                </div>
                {form.isUpgrade && (
                  <div className="flex justify-between text-sm text-green-700">
                    <span>Upgrade Discount (10%)</span>
                    <span>- {formatKsh(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-semibold border-t border-blue-200 pt-2 mt-2">
                  <span className="text-blue-800">Total</span>
                  <span className="text-blue-900">{formatKsh(amount)}</span>
                </div>
                {selectedInstitution?.serviceStatus === "disconnected" && (
                  <div className="flex justify-between text-sm text-red-700 mt-1">
                    <span>+ Reconnection Fee</span>
                    <span>{formatKsh(1000)}</span>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Processing..." : "Record Payment"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default function PaymentsPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-gray-500">Loading...</div>}>
      <PaymentsForm />
    </Suspense>
  );
}
