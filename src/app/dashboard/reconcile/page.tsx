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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-3">Unmatched Payments</h1>
          <p className="text-xl text-gray-300">Reconcile and assign payments to members</p>
        </div>
        
        <ManualPaymentModal
          isOpen={isOpen}
          onClose={() => {
            setIsOpen(false);
            setEditData(null);
          }}
          onSuccess={refreshPayments}
          initialData={editData}
        />

        <div className="mb-8">
          <button 
            onClick={() => setIsOpen(true)}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white px-10 py-5 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 font-bold shadow-xl hover:shadow-2xl transform hover:-translate-y-1 flex items-center gap-4 text-lg border border-green-400/30"
          >
            Add Manual Payment
          </button>
        </div>

        <div className="space-y-6">
          {payments.map((p: any) => (
            <div
              key={p.id}
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 shadow-xl border border-gray-700"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-2xl font-bold text-white mb-2">
                    ${p.amountPaid.toFixed(2)}
                  </p>
                  <p className="text-gray-200 mb-3 font-medium">
                    {new Date(p.paymentDate).toLocaleDateString()}
                  </p>
                  <span className={`status-badge inline-flex items-center px-4 py-2 text-sm rounded-full font-bold ${
                    p.stripePaymentId 
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30' 
                      : 'bg-green-500/20 text-green-300 border border-green-400/30'
                  }`}>
                    {p.stripePaymentId ? 'Stripe Payment' : 'Manual Payment'}
                  </span>
                </div>
              </div>
              
              <div className="text-sm text-gray-200 mb-6 font-medium">
                <p className="mb-1">Method: {p.paymentMethod.charAt(0).toUpperCase() + p.paymentMethod.slice(1)}
                {p.cardLast4 && ` (****${p.cardLast4})`}</p>
                <p>Customer: {p.customerName || "—"}</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <select
                  className={`flex-1 px-4 py-3 bg-gray-700 border rounded-xl text-white transition-colors duration-200 ${
                    errors[p.id] 
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-200' 
                      : 'border-gray-600 focus:border-blue-500 focus:ring-blue-200'
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
                  className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-4 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-bold shadow-lg hover:shadow-xl border border-blue-400/30"
                >
                  Assign Payment
                </button>
                
                {/* Only show edit button for manual payments (no stripePaymentId) */}
                {!p.stripePaymentId && (
                  <button
                    onClick={() => {
                      setEditData(p);
                      setIsOpen(true);
                    }}
                    className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-8 py-4 rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-200 font-bold shadow-lg hover:shadow-xl border border-gray-400/30"
                  >
                    Edit
                  </button>
                )}
              </div>

              {/* Error message display */}
              {errors[p.id] && (
                <div 
                  className="mt-4 p-5 bg-red-900/60 border border-red-500/50 rounded-xl shadow-lg"
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
                      <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">!</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-red-100 text-base font-bold">{errors[p.id]}</p>
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
                        className="text-red-300 hover:text-red-200 transition-colors duration-200 font-bold text-lg"
                      >
                        <span className="sr-only">Dismiss</span>
                        ×
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {payments.length === 0 && (
          <div className="text-center py-16 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-600 shadow-xl">
            <div className="w-24 h-24 bg-green-500/20 rounded-full mx-auto mb-6 flex items-center justify-center">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-2xl font-bold">✓</span>
              </div>
            </div>
            <p className="text-2xl text-white font-bold mb-3">All payments are assigned!</p>
            <p className="text-gray-300 text-lg font-medium">Great job keeping everything up to date.</p>
          </div>
        )}
      </div>
    </div>
  );
}
