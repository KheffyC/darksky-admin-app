"use client";
import { useEffect, useState } from "react";
import ManualPaymentModal from "@/components/ManualPaymentModal";
import PaymentCard from "@/components/PaymentCard";

export default function ReconcilePage() {
  const [payments, setPayments] = useState([]);
  const [members, setMembers] = useState([]);
  const [selections, setSelections] = useState<{ [key: string]: string }>({});
  const [isOpen, setIsOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loadingAssignments, setLoadingAssignments] = useState<{ [key: string]: boolean }>({});

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

    // Set loading state for this payment
    setLoadingAssignments(prev => ({ ...prev, [paymentId]: true }));

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
    } finally {
      // Clear loading state
      setLoadingAssignments(prev => {
        const newState = { ...prev };
        delete newState[paymentId];
        return newState;
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
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
            <PaymentCard
              key={p.id}
              payment={p}
              members={members}
              selection={selections[p.id] || ""}
              error={errors[p.id]}
              loading={!!loadingAssignments[p.id]}
              onSelect={(memberId) => {
                setSelections((prev) => ({ ...prev, [p.id]: memberId }));
                if (memberId && errors[p.id]) {
                  setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors[p.id];
                    return newErrors;
                  });
                }
              }}
              onAssign={() => handleAssign(p.id)}
              onEdit={
                !p.stripePaymentId
                  ? () => {
                      setEditData(p);
                      setIsOpen(true);
                    }
                  : undefined
              }
              onDismissError={() => {
                setErrors(prev => {
                  const newErrors = { ...prev };
                  delete newErrors[p.id];
                  return newErrors;
                });
              }}
            />
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
