import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import SellerSidebar from "@/components/seller/SellerSidebar";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import connectToDatabase from "@/lib/mongodb";
import Seller from "@/lib/models/seller";

export default async function SellerDashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/');
  }

  await connectToDatabase();
  const seller = await Seller.findOne({ user: (session.user as any).id });

  if (!seller) {
    redirect('/seller/register');
  }

  return (
    <div className="min-h-screen bg-cream-mist flex">
      <SellerSidebar />
      <div className="flex-1 p-6 md:p-10">
        <AnnouncementBanner className="mb-5" />
        {children}
      </div>
    </div>
  );
}