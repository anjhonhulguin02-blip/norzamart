import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import connectToDatabase from "@/lib/mongodb";
import Seller from "@/lib/models/seller";
import { createNotification } from "@/lib/createNotification";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ message: "Not authorized." }, { status: 403 });

  const { status } = await req.json();
  if (!["pending", "approved", "rejected"].includes(status)) {
    return NextResponse.json({ message: "Invalid status." }, { status: 400 });
  }

  await connectToDatabase();
  const seller = await Seller.findByIdAndUpdate(id, { status }, { new: true });
  if (!seller) return NextResponse.json({ message: "Seller not found." }, { status: 404 });

  await createNotification({
    userId: seller.user.toString(),
    type: "order_status",
    title: status === "approved" ? "Your store has been verified! ✔️" : status === "rejected" ? "Store verification declined" : "Store status updated",
    body: seller.storeName,
    link: "/seller/dashboard",
  });

  return NextResponse.json({ message: "Updated!", seller });
}