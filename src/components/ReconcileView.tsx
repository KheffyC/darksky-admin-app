"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PaymentCard from "@/components/PaymentCard";

export default function ReconcileView() {
  const [payments, setPayments] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [paymentSchedules, setPaymentSchedules] = useState<any[]>([]);
  const [selections, setSelections] = useState<{ [key: string]: string }>({});
  const [scheduleSelections, setScheduleSelections] = useState<{ [key: string]: string }>({});
  const [isOpen, setIsOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loadingAssignments, setLoadingAssignments] = useState<{ [key: string]: boolean }>({});
  const [loadingStripeRefresh, setLoadingStripeRefresh] = useState(false);
  const [stripeRefreshError, setStripeRefreshError] = useState<string | null>(null);
  const loadingStripeRefreshRef = useRef(false);

  const refreshPayments = useCallback(async () => {
    const data = await fetch("/api/reconcile").then((res) => res.json());
    setPayments(data.payments);
    setMembers(data.members);
  }, []);

  const loadPaymentSchedules = useCallback(async () => {
    try {
      const response = await fetch("/api/payment-schedules?active=true");
      if (response.ok) {
        const schedules = await response.json();
        setPaymentSchedules(schedules);
      }
    } catch (error) {
      console.error('Failed to load payment schedules:', error);
    }
  }, []);

  const handleStripeRefresh = useCallback(async (isAuto = false) => {
    if (loadingStripeRefreshRef.current) return;
    
    loadingStripeRefreshRef.current = true;
    setLoadingStripeRefresh(true);
    setStripeRefreshError(null);
    
    try {
      const response = await fetch("/api/stripe/import", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to refresh Stripe data: ${response.status} ${errorData}`);
      }

      const result = await response.json();
      // Refresh the payments list after successful Stripe refresh
      await refreshPayments();
      
      // Update timestamp on success
      sessionStorage.setItem('lastStripeRefresh', Date.now().toString());
    } catch (error: any) {
      console.error('Error refreshing Stripe data:', error);
      // Don't show error UI for auto-refresh failures to avoid annoyance
      if (!isAuto) {
        setStripeRefreshError(error.message || 'Failed to refresh Stripe data. Please try again.');
        
        // Auto-clear error after 5 seconds
        setTimeout(() => {
          setStripeRefreshError(null);
        }, 5000);
      }
    } finally {
      loadingStripeRefreshRef.current = false;
      setLoadingStripeRefresh(false);
    }
  }, [refreshPayments]);

  useEffect(() => {
    refreshPayments();
    loadPaymentSchedules();

    // Auto-refresh from Stripe with throttling (5 minutes)
    const lastRefresh = sessionStorage.getItem('lastStripeRefresh');
    const now = Date.now();
    const COOLDOWN = 5 * 60 * 1000; // 5 minutes

    if (!lastRefresh || (now - parseInt(lastRefresh)) > COOLDOWN) {
      handleStripeRefresh(true);
    }
  }, [refreshPayments, loadPaymentSchedules, handleStripeRefresh]);

  const handleAssign = async (paymentId: string) => {
    const memberId = selections[paymentId];
    const scheduleId = scheduleSelections[paymentId];
    
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
      // Check if payment is late based on schedule
      let isLate = false;
      if (scheduleId && scheduleId !== "none") {
        const schedule = paymentSchedules.find(s => s.id === scheduleId);
        if (schedule) {
          const payment = payments.find(p => p.id === paymentId);
          if (payment) {
            const paymentDate = new Date(payment.paymentDate);
            const dueDate = new Date(schedule.dueDate);
            isLate = paymentDate > dueDate;
          }
        }
      }

      const response = await fetch("/api/reconcile/assign", {
        method: "POST",
        body: JSON.stringify({ 
          paymentId, 
          memberId, 
          scheduleId: (scheduleId && scheduleId !== "none") ? scheduleId : null,
          isLate 
        }),
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
    <div className="py-4">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-black mb-3">Unmatched Payments</h1>
           <p className="text-lg sm:text-xl text-[#788896]">Payments range from past 30 days {` (since ${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString()})`}</p>
          <p className="text-lg sm:text-xl text-[#788896]">Reconcile and assign payments to members</p>
        </div>

        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={() => handleStripeRefresh(false)}
              disabled={loadingStripeRefresh}
              className="bg-white text-black px-6 sm:px-10 py-4 sm:py-5 rounded-xl hover:bg-[#f7f9fb] transition-all duration-200 font-bold flex items-center justify-center gap-4 text-base sm:text-lg border border-[#d6dde5] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingStripeRefresh ? (
                <>
                  <div className="w-5 h-5 border-2 border-[#cfd8e3] border-t-black rounded-full animate-spin"></div>
                  Refreshing...
                </>
              ) : (
                "Refresh from Stripe"
              )}
            </button>
          </div>
          
          {stripeRefreshError && (
            <div className="mt-4 p-4 bg-red-100 border border-red-300 rounded-xl text-red-900 flex items-center justify-between">
              <span>{stripeRefreshError}</span>
              <button
                onClick={() => setStripeRefreshError(null)}
                className="text-red-900 hover:text-red-700 ml-4 text-xl"
              >
                ×
              </button>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <AnimatePresence mode="popLayout">
            {payments.map((p: any) => (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ 
                  opacity: 0, 
                  x: 300, 
                  scale: 0.8,
                  transition: { duration: 0.3, ease: "easeInOut" }
                }}
                transition={{ 
                  duration: 0.4, 
                  ease: "easeOut",
                  layout: { duration: 0.3 }
                }}
              >
                <PaymentCard
                  payment={p}
                  members={members}
                  paymentSchedules={paymentSchedules}
                  selection={selections[p.id] || ""}
                  scheduleSelection={scheduleSelections[p.id] || ""}
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
                  onScheduleSelect={(scheduleId) => {
                    setScheduleSelections((prev) => ({ ...prev, [p.id]: scheduleId }));
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
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {payments.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="text-center py-16 bg-white rounded-2xl border border-[#d6dde5]"
            >
              <motion.div 
                className="w-24 h-24 bg-green-500/20 rounded-full mx-auto mb-6 flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, duration: 0.4, ease: "easeOut" }}
              >
                <motion.div 
                  className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4, duration: 0.3, ease: "easeOut" }}
                >
                  <motion.span 
                    className="text-white text-2xl font-bold"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.2 }}
                  >
                    ✓
                  </motion.span>
                </motion.div>
              </motion.div>
              <motion.p 
                className="text-2xl text-black font-bold mb-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
              >
                All payments are assigned!
              </motion.p>
              <motion.p 
                className="text-[#788896] text-lg font-medium"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
              >
                Great job keeping everything up to date.
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
    </div>
  );
}
