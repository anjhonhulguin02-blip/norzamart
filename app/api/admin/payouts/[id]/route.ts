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
  const payout = await Payout.findById(id);
  if (!payout) {
    return NextResponse.json({ message: "Payout request not found." }, { status: 404 });
  }
  if (payout.status !== "pending") {
    return NextResponse.json({ message: "This request has already been processed." }, { status: 400 });
  }

  payout.status = status;
  payout.adminNote = adminNote || undefined;
  payout.processedAt = new Date();
  await payout.save();

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
