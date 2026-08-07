import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import Seller from "@/lib/models/seller";

export async function getSellerFromSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  await connectToDatabase();
  const seller = await Seller.findOne({ user: (session.user as any).id });
  return seller;
}