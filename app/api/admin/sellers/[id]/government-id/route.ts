import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import connectToDatabase from "@/lib/mongodb";
import Seller from "@/lib/models/seller";
import AuditLog from "@/lib/models/auditLog";
import cloudinary from "@/lib/cloudinary";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ message: "Not authorized." }, { status: 403 });

  await connectToDatabase();
  const seller = await Seller.findById(id).select("governmentId");
  if (!seller?.governmentId) {
    return NextResponse.json({ message: "Government ID not found." }, { status: 404 });
  }

  await AuditLog.create({
    actor: (session.user as any).id,
    action: "view_government_id",
    targetType: "Seller",
    targetId: id,
  });

  // Older records stored the raw public Cloudinary URL; new uploads store just
  // the public_id for an "authenticated" resource, which needs a signed URL.
  const raw: string = seller.governmentId;
  const url = raw.startsWith("http")
    ? raw
    : cloudinary.url(raw, { type: "authenticated", sign_url: true, secure: true });

  return NextResponse.json({ url });
}
