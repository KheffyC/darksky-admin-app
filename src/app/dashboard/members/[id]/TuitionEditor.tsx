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
    <div className="flex items-center gap-2">
      {editing ? (
        <>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="border rounded px-2 py-1 w-24"
          />
          <button
            onClick={handleSave}
            className="text-blue-600 hover:underline"
          >
            Save
          </button>
          <button
            onClick={() => setEditing(false)}
            className="text-gray-600 hover:underline"
          >
            Cancel
          </button>
        </>
      ) : (
        <>
          <p>Tuition: ${current}</p>
          <button
            onClick={() => setEditing(true)}
            className="text-sm text-blue-600 hover:underline"
          >
            Edit
          </button>
        </>
      )}
      {status === "success" && (
        <p className="text-green-600 text-sm">Tuition updated!</p>
      )}
      {status === "error" && (
        <p className="text-red-600 text-sm">Update failed or invalid value.</p>
      )}
    </div>
  );
}
