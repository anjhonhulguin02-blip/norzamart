import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Barangay from "@/lib/models/barangay";
import { requireAdmin } from "@/lib/requireAdmin";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ message: "Not authorized." }, { status: 401 });
  }

  const { id } = await params;
  await connectToDatabase();
  const barangay = await Barangay.findByIdAndDelete(id);

  if (!barangay) {
    return NextResponse.json({ message: "Barangay not found." }, { status: 404 });
  }

  return NextResponse.json({ message: "Barangay deleted." });
}
