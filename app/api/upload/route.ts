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

  try {
    const result = await cloudinary.uploader.upload(image, {
      folder: `norzamart/${folder || "misc"}`,
    });
    return NextResponse.json({ url: result.secure_url });
  } catch (error) {
    console.error("CLOUDINARY UPLOAD ERROR:", error);
    return NextResponse.json({ message: "Image upload failed." }, { status: 500 });
  }
}
