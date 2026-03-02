"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { LAN_NODE_COSTS, PC_COST } from "@/db/schema";
import { getPcCost, getLanNodeCost, formatKsh } from "@/lib/utils";

interface Institution {
  id: number;
  name: string;
  hasComputers: boolean;
  hasLan: boolean;
  numberOfUsers: number | null;
}

function InfrastructureForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const preselectedId = searchParams.get("institutionId");

  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    institutionId: preselectedId || "",
    numberOfPcs: "0",
    numberOfLanNodes: "0",
    notes: "",
  });

  useEffect(() => {
    fetch("/api/institutions")
      .then((r) => r.json())
      .then(setInstitutions);
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const pcs = parseInt(form.numberOfPcs) || 0;
  const lanNodes = parseInt(form.numberOfLanNodes) || 0;
  const pcCost = getPcCost(pcs);
  const lanCost = lanNodes > 0 ? getLanNodeCost(lanNodes) : 0;
  const totalCost = pcCost + lanCost;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (pcs === 0 && lanNodes === 0) {
      setError("Please enter at least one PC or LAN node quantity.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/infrastructure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to record purchase");
      } else {
        setSuccess(`Infrastructure purchase recorded! Total: ${formatKsh(data.totalCost)}`);
        setForm((prev) => ({ ...prev, numberOfPcs: "0", numberOfLanNodes: "0", notes: "" }));
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Infrastructure Purchase</h1>
        <p className="text-gray-600 mt-1">
          Record PC and LAN node purchases for institutions
        </p>
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
                  {inst.name}
                </option>
              ))}
            </select>
          </div>

          {/* PCs */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Number of Personal Computers
            </label>
            <input
              type="number"
              name="numberOfPcs"
              value={form.numberOfPcs}
              onChange={handleChange}
              min="0"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Cost: {formatKsh(PC_COST)} per PC
            </p>
          </div>

          {/* LAN Nodes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Number of LAN Nodes
            </label>
            <input
              type="number"
              name="numberOfLanNodes"
              value={form.numberOfLanNodes}
              onChange={handleChange}
              min="0"
              max="100"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="mt-2 text-xs text-gray-500 space-y-0.5">
              <p className="font-medium text-gray-600">LAN Node Pricing:</p>
              {LAN_NODE_COSTS.map((tier) => (
                <p key={tier.min}>
                  {tier.min}–{tier.max} nodes: {formatKsh(tier.cost)}
                </p>
              ))}
            </div>
          </div>

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

        {/* Cost Summary */}
        {(pcs > 0 || lanNodes > 0) && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
            <h3 className="font-semibold text-purple-900 mb-2">Cost Summary</h3>
            {pcs > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-purple-700">
                  {pcs} PC{pcs > 1 ? "s" : ""} × {formatKsh(PC_COST)}
                </span>
                <span className="text-purple-900">{formatKsh(pcCost)}</span>
              </div>
            )}
            {lanNodes > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-purple-700">
                  {lanNodes} LAN Node{lanNodes > 1 ? "s" : ""}
                </span>
                <span className="text-purple-900">{formatKsh(lanCost)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-semibold border-t border-purple-200 pt-2 mt-2">
              <span className="text-purple-800">Total</span>
              <span className="text-purple-900">{formatKsh(totalCost)}</span>
            </div>
          </div>
        )}

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Recording..." : "Record Purchase"}
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

export default function InfrastructurePage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-gray-500">Loading...</div>}>
      <InfrastructureForm />
    </Suspense>
  );
}
