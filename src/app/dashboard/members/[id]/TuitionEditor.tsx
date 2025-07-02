"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function TuitionEditor({
  memberId,
  current,
}: {
  memberId: string;
  current: number;
}) {
  const [editing, setEditing] = useState(false);
  const [amount, setAmount] = useState(current.toString());
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const router = useRouter();

  async function handleSave() {
    const newAmount = Number(amount);
    if (isNaN(newAmount) || newAmount <= 0) {
      setStatus("error");
      return;
    }

    try {
      const res = await fetch(`/api/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tuitionAmount: newAmount }),
      });

      if (!res.ok) throw new Error();

      setStatus("success");
      setEditing(false);
      router.refresh();
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-xl border border-gray-600 p-8 mb-8">
      <h3 className="text-2xl font-bold text-white mb-6">Tuition Management</h3>
      <div className="flex items-center gap-4">
        {editing ? (
          <>
            <div className="flex items-center gap-4">
              <label className="text-gray-200 font-bold">Amount: $</label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-gray-700 border border-gray-600 px-4 py-3 rounded-xl text-white font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 w-32"
              />
            </div>
            <button
              onClick={handleSave}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-bold shadow-lg border border-blue-400/30"
            >
              Save
            </button>
            <button
              onClick={() => setEditing(false)}
              className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-6 py-3 rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-200 font-bold shadow-lg border border-gray-400/30"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <p className="text-xl font-bold text-white">Current Tuition: <span className="text-blue-400">${current.toFixed(2)}</span></p>
            <button
              onClick={() => setEditing(true)}
              className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-6 py-3 rounded-xl hover:from-yellow-600 hover:to-yellow-700 transition-all duration-200 font-bold shadow-lg border border-yellow-400/30"
            >
              Edit Amount
            </button>
          </>
        )}
      </div>
      {status === "success" && (
        <div className="mt-4 p-4 bg-green-900/50 border border-green-500/50 text-green-200 rounded-xl font-bold">
          Tuition amount updated successfully!
        </div>
      )}
      {status === "error" && (
        <div className="mt-4 p-4 bg-red-900/50 border border-red-500/50 text-red-200 rounded-xl font-bold">
          Update failed or invalid value. Please try again.
        </div>
      )}
    </div>
  );
}
