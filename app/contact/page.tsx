import Navbar from '@/components/Navbar';
import SiteFooter from '@/components/SiteFooter';

export const metadata = { title: 'Contact — NorzaMart' };

export default function ContactPage() {
  return (
    <main className="w-full min-h-screen bg-gradient-to-br from-green-100 via-emerald-50 to-teal-100 flex flex-col justify-between">
      <div>
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-14">
          <span className="inline-block bg-tomato text-white text-[10px] uppercase font-black tracking-wider px-3 py-1.5 rounded-full">
            We're here to help
          </span>
          <h1 className="font-display text-3xl md:text-4xl font-semibold text-basil mt-4 mb-6">Contact Us</h1>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-2xl p-6 shadow-sm">
              <span className="text-2xl block mb-2">📧</span>
              <p className="font-bold text-sm text-ink">Email Support</p>
              <p className="text-ink/60 text-xs font-body mt-1 mb-3">For order issues, account help, or general questions.</p>
              <a href="mailto:support@norzamart.ph" className="text-basil font-bold text-sm hover:underline">support@norzamart.ph</a>
            </div>

            <div className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-2xl p-6 shadow-sm">
              <span className="text-2xl block mb-2">🏬</span>
              <p className="font-bold text-sm text-ink">Selling on NorzaMart</p>
              <p className="text-ink/60 text-xs font-body mt-1 mb-3">Questions about becoming a verified seller.</p>
              <a href="mailto:sellers@norzamart.ph" className="text-basil font-bold text-sm hover:underline">sellers@norzamart.ph</a>
            </div>

            <div className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-2xl p-6 shadow-sm sm:col-span-2">
              <span className="text-2xl block mb-2">💬</span>
              <p className="font-bold text-sm text-ink">Already have an order or a store?</p>
              <p className="text-ink/60 text-xs font-body mt-1">
                Buyers and sellers can message each other directly in-app for order-specific questions —
                look for the "Chat with Seller" button on any product page, or check your Messages tab.
              </p>
            </div>
          </div>

          <p className="text-ink/40 text-xs font-body mt-8 text-center">
            We typically respond within 1–2 business days.
          </p>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
