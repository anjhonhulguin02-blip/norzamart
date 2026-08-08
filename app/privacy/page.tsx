import Navbar from '@/components/Navbar';
import SiteFooter from '@/components/SiteFooter';

export const metadata = { title: 'Privacy Policy — NorzaMart' };

const SECTIONS = [
  {
    title: '1. Information We Collect',
    body: `When you create an account, we collect your name, email address, phone number, and any delivery
    addresses you save. When you place an order, we collect the order details, delivery barangay, and payment
    method you select. Sellers additionally provide store information and a government ID for verification.`,
  },
  {
    title: '2. How We Use Your Information',
    body: `We use your information to process orders, connect you with sellers, show you products available in
    your barangay, send order and account notifications, and improve the marketplace. We do not sell your
    personal information to third parties.`,
  },
  {
    title: '3. Sharing With Sellers',
    body: `When you place an order, the seller you're buying from receives your name, delivery address, and
    contact details needed to fulfill that order. Sellers cannot see your information unless you've interacted
    with their store (ordered, messaged, or reviewed a product).`,
  },
  {
    title: '4. Data Storage & Security',
    body: `Your data is stored on secured cloud infrastructure. Passwords are encrypted and never stored in
    plain text. While we take reasonable steps to protect your information, no online platform can guarantee
    absolute security.`,
  },
  {
    title: '5. Your Choices',
    body: `You can review and update your personal information, delivery preferences, and notification settings
    at any time from your Account Settings page. You may also request account deactivation by contacting
    support.`,
  },
  {
    title: '6. Cookies',
    body: `NorzaMart uses essential cookies to keep you signed in and remember your cart. We do not use
    third-party advertising trackers.`,
  },
  {
    title: '7. Changes to This Policy',
    body: `We may update this policy as NorzaMart grows. Significant changes will be communicated through the
    platform.`,
  },
];

export default function PrivacyPage() {
  return (
    <main className="w-full min-h-screen bg-gradient-to-br from-green-100 via-emerald-50 to-teal-100 flex flex-col justify-between">
      <div>
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-14">
          <h1 className="font-display text-3xl md:text-4xl font-semibold text-basil mb-2">Privacy Policy</h1>
          <p className="text-ink/50 text-xs font-body mb-8">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</p>

          <div className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-3xl p-8 shadow-lg flex flex-col gap-6">
            {SECTIONS.map((s) => (
              <div key={s.title}>
                <h2 className="font-display text-base font-semibold text-ink mb-1.5">{s.title}</h2>
                <p className="text-ink/70 text-sm font-body leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
