import React from "react";
import CustomSelect from "@/components/CustomSelect";

interface PaymentCardProps {
  payment: any;
  members: any[];
  paymentSchedules?: any[];
  selection: string;
  scheduleSelection?: string;
  error?: string;
  loading: boolean;
  onSelect: (memberId: string) => void;
  onScheduleSelect?: (scheduleId: string) => void;
  onAssign: () => void;
  onEdit?: () => void;
  onDismissError: () => void;
}

const PaymentCard: React.FC<PaymentCardProps> = ({
  payment,
  members,
  paymentSchedules = [],
  selection,
  scheduleSelection = "",
  error,
  loading,
  onSelect,
  onScheduleSelect,
  onAssign,
  onEdit,
  onDismissError,
}) => {
  return (
    <div className="bg-white rounded-2xl p-6 border border-[#d6dde5]">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-4 mb-2">
            <span className="text-3xl font-bold text-black">${payment.amountPaid.toFixed(2)}</span>
            <span className={`status-badge inline-flex items-center px-4 py-2 text-sm rounded-full font-bold ${
              payment.stripePaymentId
                ? "bg-blue-500/20 text-blue-300 border border-blue-400/30"
                : "bg-green-500/20 text-green-300 border border-green-400/30"
            }`}>
              {payment.stripePaymentId ? "Stripe Payment" : "Manual Payment"}
            </span>
            {scheduleSelection && scheduleSelection !== "none" && paymentSchedules.length > 0 && (() => {
              const selectedSchedule = paymentSchedules.find(s => s.id === scheduleSelection);
              if (selectedSchedule) {
                const paymentDate = new Date(payment.paymentDate);
                const dueDate = new Date(selectedSchedule.dueDate);
                const isLate = paymentDate > dueDate;
                
                if (isLate) {
                  return (
                    <span className="inline-flex items-center px-3 py-1 text-xs rounded-full font-bold bg-red-500/20 text-red-300 border border-red-400/30">
                      Late Payment
                    </span>
                  );
                }
              }
              return null;
            })()}
          </div>
          <div className="text-[#788896] text-sm mb-1">
            {new Date(payment.paymentDate).toLocaleString()}
          </div>
          <div className="text-sm text-black font-medium">
            <p className="mb-1">
              Method: {payment.paymentMethod.charAt(0).toUpperCase() + payment.paymentMethod.slice(1)}
              {payment.cardLast4 && ` (****${payment.cardLast4})`}
            </p>
            <p>Customer: {payment.customerName || "—"}</p>
            {payment.memberName && <p>Member: {payment.memberName}</p>}
          </div>
        </div>
        <div className="flex flex-col gap-3 min-w-[260px]">
          <CustomSelect
            value={selection || ""}
            onValueChange={onSelect}
            options={members.map((m: any) => ({
              value: m.id,
              label: `${m.firstName} ${m.lastName} — ${m.section}`
            }))}
            placeholder="Select member..."
            disabled={loading}
            error={!!error}
          />
          
          {paymentSchedules.length > 0 && onScheduleSelect && (
            <CustomSelect
              value={scheduleSelection || "none"}
              onValueChange={(value) => onScheduleSelect(value === "none" ? "" : value)}
              options={[
                { value: "none", label: "No payment schedule" },
                ...paymentSchedules.map((schedule: any) => ({
                  value: schedule.id,
                  label: `${schedule.name} - Due ${new Date(schedule.dueDate).toLocaleDateString()}`
                }))
              ]}
              placeholder="Select payment schedule..."
              disabled={loading}
            />
          )}
          
          <div className="flex gap-2">
            <button
              onClick={onAssign}
              disabled={loading}
              className={`flex-1 px-6 py-3 rounded-xl transition-all duration-200 font-bold border flex items-center justify-center min-w-[120px] ${
                loading
                  ? "bg-[#eef3f8] text-[#788896] cursor-not-allowed border-[#cfd8e3]"
                  : "bg-white text-black hover:bg-[#f7f9fb] border-[#d6dde5]"
              }`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Assigning...
                </>
              ) : (
                "Assign Payment"
              )}
            </button>
            {!payment.stripePaymentId && onEdit && (
              <button
                onClick={onEdit}
                className="px-6 py-3 rounded-xl bg-white text-black font-bold hover:bg-[#f7f9fb] border border-[#d6dde5] transition-all duration-200"
              >
                Edit
              </button>
            )}
          </div>
        </div>
      </div>
      {error && (
        <div
          className="mt-4 p-5 bg-red-100 border border-red-300 rounded-xl"
          style={{ animation: "fadeIn 0.3s ease-in-out" }}
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
              <p className="text-red-900 text-base font-bold">{error}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={onDismissError}
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
  );
};

export default PaymentCard;
