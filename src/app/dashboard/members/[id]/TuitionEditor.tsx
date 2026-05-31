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
    <div className="mb-8 rounded-2xl border border-[#d6dde5] bg-white p-8">
      <h3 className="mb-6 text-2xl font-bold tracking-[-0.03em] text-[#2C3E50]">Tuition Management</h3>
      <div className="flex items-center gap-4">
        {editing ? (
          <>
            <div className="flex items-center gap-4">
              <label className="font-bold text-[#2C3E50]">Amount: $</label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-32 rounded-xl border border-[#d6dde5] bg-white px-4 py-3 font-medium text-[#2C3E50] transition-all duration-200 focus:border-[#f38d68] focus:outline-none focus:ring-2 focus:ring-[#f38d68]"
              />
            </div>
            <button
              onClick={handleSave}
              className="rounded-xl border border-[#f38d68] bg-[#f38d68] px-6 py-3 font-bold text-black transition-all duration-200 hover:bg-[#f5a07f]"
            >
              Save
            </button>
            <button
              onClick={() => setEditing(false)}
              className="rounded-xl border border-[#d6dde5] bg-white px-6 py-3 font-bold text-[#2C3E50] transition-all duration-200 hover:bg-[#f7f9fb]"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <p className="text-xl font-bold text-[#2C3E50]">Current Tuition: <span className="text-[#0D47A1]">${current.toFixed(2)}</span></p>
            <button
              onClick={() => setEditing(true)}
              className="rounded-xl border border-amber-400 bg-amber-100 px-6 py-3 font-bold text-amber-900 transition-all duration-200 hover:bg-amber-200"
            >
              Edit Amount
            </button>
          </>
        )}
      </div>
      {status === "success" && (
        <div className="mt-4 rounded-xl border border-emerald-400 bg-emerald-100 p-4 font-bold text-emerald-900">
          Tuition amount updated successfully!
        </div>
      )}
      {status === "error" && (
        <div className="mt-4 rounded-xl border border-rose-400 bg-rose-100 p-4 font-bold text-rose-900">
          Update failed or invalid value. Please try again.
        </div>
      )}
    </div>
  );
}
