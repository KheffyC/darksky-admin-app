"use client";
import { useEffect, useState } from "react";
import ManualPaymentModal from "@/components/ManualPaymentModal";

export default function ReconcilePage() {
  const [payments, setPayments] = useState([]);
  const [members, setMembers] = useState([]);
  const [selections, setSelections] = useState<{ [key: string]: string }>({});
  const [isOpen, setIsOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const refreshPayments = async () => {
    const data = await fetch("/api/reconcile").then((res) => res.json());
    setPayments(data.payments);
    setMembers(data.members);
  };

  useEffect(() => {
    refreshPayments();
  }, []);

  const handleAssign = async (paymentId: string) => {
    const memberId = selections[paymentId];
    
    // Clear any existing error for this payment
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[paymentId];
      return newErrors;
    });

    if (!memberId) {
      setErrors(prev => ({
        ...prev,
        [paymentId]: "Please select a member before assigning this payment."
      }));
      
      // Auto-clear error after 5 seconds
      setTimeout(() => {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[paymentId];
          return newErrors;
        });
      }, 5000);
      
      return;
    }

    try {
      const response = await fetch("/api/reconcile/assign", {
        method: "POST",
        body: JSON.stringify({ paymentId, memberId }),
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error('Assignment failed');
      }

      // Remove from list on success
      setPayments(payments.filter((p) => p.id !== paymentId));
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        [paymentId]: "Failed to assign payment. Please try again."
      }));
      
      // Auto-clear error after 5 seconds
      setTimeout(() => {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[paymentId];
          return newErrors;
        });
      }, 5000);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">🧾 Unmatched Payments</h1>
      <ManualPaymentModal
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          setEditData(null);
        }}
        onSuccess={refreshPayments} // Only refresh when payment is successfully saved
        initialData={editData}
      />

      <div className="mb-6">
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium shadow-sm flex items-center gap-2"
        >
          <span className="text-lg">➕</span>
          Add Manual Payment
        </button>
      </div>

      {payments.map((p: any) => (
        <div
          key={p.id}
          className="border rounded-md p-4 mb-4 bg-white shadow-sm"
        >
          <p className="font-medium text-gray-800">
            💳 ${p.amountPaid.toFixed(2)} —{" "}
            {new Date(p.paymentDate).toLocaleDateString()}
            {/* Show payment source indicator */}
            <span className={`ml-2 px-2 py-1 text-xs rounded ${
              p.stripePaymentId 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-green-100 text-green-800'
            }`}>
              {p.stripePaymentId ? 'Stripe' : 'Manual'}
            </span>
          </p>
          <p className="text-sm text-gray-500">
            Method: {p.paymentMethod.charAt(0).toUpperCase() + p.paymentMethod.slice(1)}
            {p.cardLast4 && ` (****${p.cardLast4})`} &nbsp;|&nbsp; Name:{" "}
            {p.customerName || "—"}
          </p>

          <div className="mt-2 flex gap-4">
            <select
              className={`border p-1 rounded transition-colors duration-200 ${
                errors[p.id] 
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-200' 
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
              }`}
              value={selections[p.id] || ""}
              onChange={(e) => {
                setSelections((prev) => ({ ...prev, [p.id]: e.target.value }));
                // Clear error when user makes a selection
                if (e.target.value && errors[p.id]) {
                  setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors[p.id];
                    return newErrors;
                  });
                }
              }}
            >
              <option value="">Select member...</option>
              {members.map((m: any) => (
                <option key={m.id} value={m.id}>
                  {m.firstName} {m.lastName} — {m.section}
                </option>
              ))}
            </select>

            <button
              onClick={() => handleAssign(p.id)}
              className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
            >
              Assign
            </button>
            
            {/* Only show edit button for manual payments (no stripePaymentId) */}
            {!p.stripePaymentId && (
              <button
                onClick={() => {
                  setEditData(p);
                  setIsOpen(true);
                }}
                className="bg-gray-600 text-white px-4 py-1 rounded hover:bg-gray-700"
              >
                Edit
              </button>
            )}
          </div>

          {/* Error message display */}
          {errors[p.id] && (
            <div 
              className="mt-3 p-3 bg-red-50 border-l-4 border-red-400 rounded-r-md"
              style={{
                animation: 'fadeIn 0.3s ease-in-out'
              }}
            >
              <style jsx>{`
                @keyframes fadeIn {
                  from { opacity: 0; transform: translateY(-10px); }
                  to { opacity: 1; transform: translateY(0); }
                }
              `}</style>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <span className="text-red-500 text-lg">⚠️</span>
                </div>
                <div className="ml-3">
                  <p className="text-red-800 text-sm font-medium">{errors[p.id]}</p>
                </div>
                <div className="ml-auto pl-3">
                  <button
                    onClick={() => {
                      setErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors[p.id];
                        return newErrors;
                      });
                    }}
                    className="text-red-400 hover:text-red-600 transition-colors duration-200"
                  >
                    <span className="sr-only">Dismiss</span>
                    ✕
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      {payments.length === 0 && (
        <p className="text-sm text-gray-500">🎉 All payments are assigned.</p>
      )}
    </div>
  );
}
