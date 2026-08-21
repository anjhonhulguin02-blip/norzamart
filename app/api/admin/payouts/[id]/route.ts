import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Payout from "@/lib/models/payout";
import { requireAdmin } from "@/lib/requireAdmin";
import { createNotification } from "@/lib/createNotification";
import Seller from "@/lib/models/seller";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ message: "Not authorized." }, { status: 401 });
  }

  const { id } = await params;
  const { status, adminNote } = await req.json();
  if (!["approved", "rejected"].includes(status)) {
    return NextResponse.json({ message: "Invalid status." }, { status: 400 });
  }

  await connectToDatabase();

  // Atomic compare-and-swap on status: only one of two concurrent
  // approve/reject requests for the same payout can ever match
  // `status: "pending"` and win the update — the other correctly sees
  // it as already processed instead of silently overwriting it.
  const payout = await Payout.findOneAndUpdate(
    { _id: id, status: "pending" },
    { $set: { status, adminNote: adminNote || undefined, processedAt: new Date() } },
    { new: true }
  );
  if (!payout) {
    const exists = await Payout.exists({ _id: id });
    return NextResponse.json(
      { message: exists ? "This request has already been processed." : "Payout request not found." },
      { status: exists ? 400 : 404 }
    );
  }

  const seller = await Seller.findById(payout.seller);
  if (seller) {
    await createNotification({
      userId: seller.user.toString(),
      type: "payout_update",
      title: status === "approved" ? "Withdrawal approved!" : "Withdrawal rejected",
      body: `Your ₱${payout.amount.toFixed(2)} withdrawal request was ${status}.`,
      link: "/seller/dashboard/payouts",
    });
  }

  return NextResponse.json({ message: "Payout updated!", payout });
}
