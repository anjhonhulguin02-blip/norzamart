import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import BuyerSidebar from "@/components/buyer/BuyerSidebar";

export default async function BuyerDashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-cream-mist flex">
      <BuyerSidebar />
      <div className="flex-1 p-6 md:p-10">{children}</div>
    </div>
  );
}