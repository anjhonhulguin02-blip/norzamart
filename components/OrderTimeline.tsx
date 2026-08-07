const STEPS = [
  { key: "pending", label: "Order Placed", icon: "🧾" },
  { key: "accepted", label: "Accepted", icon: "✅" },
  { key: "preparing", label: "Preparing", icon: "👨‍🍳" },
  { key: "packed", label: "Packed", icon: "📦" },
  { key: "out_for_delivery", label: "Out for Delivery", icon: "🚚" },
  { key: "delivered", label: "Delivered", icon: "🏠" },
];

export default function OrderTimeline({ status, statusHistory }: { status: string; statusHistory: { status: string; at: string }[] }) {
  if (status === "cancelled") {
    return (
      <div className="bg-tomato/10 border border-tomato/20 rounded-2xl p-5 text-center">
        <span className="text-2xl block mb-1">✕</span>
        <p className="text-tomato font-bold text-sm">This order was cancelled.</p>
      </div>
    );
  }

  const currentIndex = STEPS.findIndex((s) => s.key === status);
  const historyMap = new Map(statusHistory.map((h) => [h.status, h.at]));

  return (
    <div className="flex flex-col gap-0">
      {STEPS.map((step, i) => {
        const isDone = i <= currentIndex;
        const at = historyMap.get(step.key);
        return (
          <div key={step.key} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 ${
                isDone ? 'bg-basil text-white' : 'bg-ink/10 text-ink/30'
              }`}>
                {step.icon}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-0.5 flex-1 min-h-[24px] ${isDone && i < currentIndex ? 'bg-basil' : 'bg-ink/10'}`} />
              )}
            </div>
            <div className="pb-6">
              <p className={`text-sm font-semibold ${isDone ? 'text-ink' : 'text-ink/40'}`}>{step.label}</p>
              {at && <p className="text-ink/40 text-[11px]">{new Date(at).toLocaleString()}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}