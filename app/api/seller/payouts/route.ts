import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Payout from "@/lib/models/payout";
import { getSellerFromSession, requireApprovedSeller } from "@/lib/getSellerFromSession";
import { getSellerBalance } from "@/lib/getSellerBalance";
import { withSellerPayoutLock, PayoutLockBusyError } from "@/lib/withSellerPayoutLock";

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

class InsufficientBalanceError extends Error {
  available: number;
  constructor(available: number) {
    super("Insufficient balance");
    this.available = available;
  }
}

function isValidAmount(amount: unknown): amount is number {
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) return false;
  // At most 2 decimal places.
  return Math.round(amount * 100) / 100 === amount;
}

export async function POST(req: Request) {
  const seller = await requireApprovedSeller();
  if (!seller) {
    return NextResponse.json({ message: "Not authorized." }, { status: 401 });
  }

  const { amount, method, accountName, accountNumber } = await req.json();

  if (!isValidAmount(amount)) {
    return NextResponse.json(
      { message: "Please enter a valid amount (up to 2 decimal places)." },
      { status: 400 }
    );
  }
  if (!["gcash", "bank"].includes(method)) {
    return NextResponse.json({ message: "Invalid payout method." }, { status: 400 });
  }
  if (!accountName?.trim() || !accountNumber?.trim()) {
    return NextResponse.json({ message: "Please provide your account details." }, { status: 400 });
  }

  await connectToDatabase();

  try {
    // Everything that determines whether this withdrawal is allowed —
    // reading the balance and creating the Payout — happens inside the
    // lock, so a second concurrent request can't read the same
    // not-yet-reserved balance and also pass.
    const payout = await withSellerPayoutLock(seller._id, async () => {
      const { available } = await getSellerBalance(seller._id.toString());
      if (amount > available) {
        throw new InsufficientBalanceError(available);
      }
      return Payout.create({
        seller: seller._id,
        amount,
        method,
        accountName: accountName.trim(),
        accountNumber: accountNumber.trim(),
      });
    });

    return NextResponse.json({ message: "Withdrawal request submitted!", payout }, { status: 201 });
  } catch (err) {
    if (err instanceof PayoutLockBusyError) {
      return NextResponse.json(
        { message: "You already have a withdrawal request in progress — please try again in a moment." },
        { status: 409 }
      );
    }
    if (err instanceof InsufficientBalanceError) {
      return NextResponse.json(
        { message: `You can only withdraw up to ₱${err.available.toFixed(2)}.` },
        { status: 400 }
      );
    }
    throw err;
  }
}
