import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Payout from "@/lib/models/payout";
import { getSellerFromSession } from "@/lib/getSellerFromSession";
import { getSellerBalance } from "@/lib/getSellerBalance";

export async function GET() {
  const seller = await getSellerFromSession();
  if (!seller) {
    return NextResponse.json({ message: "Not authorized." }, { status: 401 });
  }

  await connectToDatabase();
  const [balance, payouts] = await Promise.all([
    getSellerBalance(seller._id.toString()),
    Payout.find({ seller: seller._id }).sort({ createdAt: -1 }),
  ]);

  return NextResponse.json({ balance, payouts });
}

export async function POST(req: Request) {
  const seller = await getSellerFromSession();
  if (!seller) {
    return NextResponse.json({ message: "Not authorized." }, { status: 401 });
  }

  const { amount, method, accountName, accountNumber } = await req.json();
  const numAmount = Number(amount);

  if (!numAmount || numAmount <= 0) {
    return NextResponse.json({ message: "Please enter a valid amount." }, { status: 400 });
  }
  if (!["gcash", "bank"].includes(method)) {
    return NextResponse.json({ message: "Invalid payout method." }, { status: 400 });
  }
  if (!accountName?.trim() || !accountNumber?.trim()) {
    return NextResponse.json({ message: "Please provide your account details." }, { status: 400 });
  }

  await connectToDatabase();
  const { available } = await getSellerBalance(seller._id.toString());

  if (numAmount > available) {
    return NextResponse.json({ message: `You can only withdraw up to ₱${available.toFixed(2)}.` }, { status: 400 });
  }

  const payout = await Payout.create({
    seller: seller._id,
    amount: numAmount,
    method,
    accountName: accountName.trim(),
    accountNumber: accountNumber.trim(),
  });

  return NextResponse.json({ message: "Withdrawal request submitted!", payout }, { status: 201 });
}
