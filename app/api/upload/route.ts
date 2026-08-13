import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import cloudinary from "@/lib/cloudinary";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Please log in first." }, { status: 401 });
  }

  const { image, folder } = await req.json();
  if (!image || typeof image !== "string") {
    return NextResponse.json({ message: "No image provided." }, { status: 400 });
  }

  // Government IDs are identity documents, not display assets — store them as
  // Cloudinary "authenticated" resources (no public URL) instead of the plain
  // public uploads used for logos/banners. Callers must fetch a signed URL
  // through an access-controlled, audited endpoint to view them.
  const isPrivate = folder === "government-ids";

  try {
    const result = await cloudinary.uploader.upload(image, {
      folder: `norzamart/${folder || "misc"}`,
      ...(isPrivate ? { type: "authenticated" } : {}),
    });
    return NextResponse.json({ url: isPrivate ? result.public_id : result.secure_url });
  } catch (error) {
    console.error("CLOUDINARY UPLOAD ERROR:", error);
    return NextResponse.json({ message: "Image upload failed." }, { status: 500 });
  }
}
