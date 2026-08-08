import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import SearchLog from "@/lib/models/searchlog";

export async function GET() {
  await connectToDatabase();
  const popular = await SearchLog.find({}).sort({ count: -1 }).limit(8).select("term count").lean();
  return NextResponse.json({ popular });
}
