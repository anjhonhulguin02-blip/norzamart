import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import Follow from "@/lib/models/follow";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ ids: [] });
  }

  await connectToDatabase();
  const follows = await Follow.find({ user: (session.user as any).id }).select("seller").lean();
  return NextResponse.json({ ids: follows.map((f: any) => f.seller.toString()) });
}
