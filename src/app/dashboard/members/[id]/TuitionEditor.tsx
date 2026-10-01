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
    <div className="mb-8 rounded-2xl border border-line bg-white p-8">
      <h3 className="mb-6 text-2xl font-bold tracking-[-0.03em] text-ink">Tuition Management</h3>
      <div className="flex items-center gap-4">
        {editing ? (
          <>
            <div className="flex items-center gap-4">
              <label className="font-bold text-ink">Amount: $</label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-32 rounded-xl border border-line bg-white px-4 py-3 font-medium text-ink transition-all duration-200 focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10"
              />
            </div>
            <button
              onClick={handleSave}
              className="rounded-xl border border-ink bg-ink px-6 py-3 font-bold text-white transition-all duration-200 hover:bg-ink-hover"
            >
              Save
            </button>
            <button
              onClick={() => setEditing(false)}
              className="rounded-xl border border-line bg-white px-6 py-3 font-bold text-ink transition-all duration-200 hover:bg-wash"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <p className="text-xl font-bold text-ink">Current Tuition: <span className="text-ink">${current.toFixed(2)}</span></p>
            <button
              onClick={() => setEditing(true)}
              className="rounded-xl border border-line-strong bg-white px-6 py-3 font-bold text-ink transition-all duration-200 hover:border-ink"
            >
              Edit Amount
            </button>
          </>
        )}
      </div>
      {status === "success" && (
        <div className="mt-4 rounded-xl border border-paid-line bg-paid-soft p-4 font-bold text-paid">
          Tuition amount updated successfully!
        </div>
      )}
      {status === "error" && (
        <div className="mt-4 rounded-xl border border-behind-line bg-behind-soft p-4 font-bold text-behind">
          Update failed or invalid value. Please try again.
        </div>
      )}
    </div>
  );
}
