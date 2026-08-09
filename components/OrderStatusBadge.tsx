const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-yellow-100 text-yellow-700" },
  accepted: { label: "Accepted", className: "bg-blue-100 text-blue-700" },
  preparing: { label: "Preparing", className: "bg-blue-100 text-blue-700" },
  packed: { label: "Packed", className: "bg-purple-100 text-purple-700" },
  out_for_delivery: { label: "Out for Delivery", className: "bg-orange-100 text-orange-700" },
  delivered: { label: "Delivered", className: "bg-basil/15 text-basil" },
  cancelled: { label: "Cancelled", className: "bg-tomato/15 text-tomato" },
  cancellation_requested: { label: "Cancellation Requested", className: "bg-amber-100 text-amber-700" },
  refund_requested: { label: "Refund Requested", className: "bg-amber-100 text-amber-700" },
  refunded: { label: "Refunded", className: "bg-gray-200 text-gray-700" },
};

export default function OrderStatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${config.className}`}>
      {config.label}
    </span>
  );
}