import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import connectToDatabase from "@/lib/mongodb";
import Product from "@/lib/models/product";
import Seller from "@/lib/models/seller";
import { createNotification } from "@/lib/createNotification";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ message: "Not authorized." }, { status: 403 });

  const { approvalStatus, rejectionReason } = await req.json();
  if (!["pending", "approved", "rejected"].includes(approvalStatus)) {
    return NextResponse.json({ message: "Invalid approval status." }, { status: 400 });
  }
  if (approvalStatus === "rejected" && !rejectionReason?.trim()) {
    return NextResponse.json({ message: "Please provide a reason for rejection." }, { status: 400 });
  }

  await connectToDatabase();
  const product = await Product.findByIdAndUpdate(
    id,
    { approvalStatus, rejectionReason: approvalStatus === "rejected" ? rejectionReason.trim() : undefined },
    { new: true }
  );
  if (!product) return NextResponse.json({ message: "Product not found." }, { status: 404 });

  const seller = await Seller.findById(product.seller);
  if (seller) {
    await createNotification({
      userId: seller.user.toString(),
      type: "product_status",
      title: approvalStatus === "approved" ? "Your product was approved! ✔️" : approvalStatus === "rejected" ? "Your product listing was rejected" : "Product status updated",
      body: approvalStatus === "rejected" ? `"${product.name}" — ${rejectionReason}` : product.name,
      link: `/seller/dashboard/products/edit/${product._id}`,
    });
  }

  return NextResponse.json({ message: "Updated!", product });
}
