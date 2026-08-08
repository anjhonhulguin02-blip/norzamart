import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import connectToDatabase from "@/lib/mongodb";
import Subscriber from "@/lib/models/subscriber";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ message: "Please enter a valid email address." }, { status: 400 });
    }

    await connectToDatabase();

    const existing = await Subscriber.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return NextResponse.json({ message: "You're already subscribed!" });
    }

    await Subscriber.create({ email });
    return NextResponse.json({ message: "Subscribed!" }, { status: 201 });
  } catch (error) {
    console.error("NEWSLETTER SUBSCRIBE ERROR:", error);
    return NextResponse.json({ message: "Something went wrong." }, { status: 500 });
  }
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ message: "Not authorized." }, { status: 403 });

  await connectToDatabase();
  const subscribers = await Subscriber.find({}).sort({ createdAt: -1 });
  return NextResponse.json({ subscribers });
}
