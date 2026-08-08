import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import BuyerSidebar from "@/components/buyer/BuyerSidebar";
import AnnouncementBanner from "@/components/AnnouncementBanner";

export default async function BuyerDashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-cream-mist flex">
      <BuyerSidebar />
      <div className="flex-1 p-6 md:p-10">
        <AnnouncementBanner className="mb-5" />
        {children}
      </div>
    </div>
  );
}