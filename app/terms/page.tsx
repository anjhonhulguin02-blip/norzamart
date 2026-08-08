import Navbar from '@/components/Navbar';
import SiteFooter from '@/components/SiteFooter';

export const metadata = { title: 'Terms of Service — NorzaMart' };

const SECTIONS = [
  {
    title: '1. Using NorzaMart',
    body: `By creating an account, you agree to provide accurate information and to use NorzaMart only for
    lawful purchases and sales within Norzagaray. You're responsible for keeping your account credentials
    confidential.`,
  },
  {
    title: '2. Orders & Payment',
    body: `Placing an order is an offer to buy from the listed seller at the listed price. Sellers may accept,
    prepare, and mark orders as delivered; buyers may cancel an order only while it is still "Pending".
    NorzaMart currently supports Cash on Delivery, GCash, and Bank Transfer as payment method preferences.`,
  },
  {
    title: '3. Sellers',
    body: `Sellers must provide accurate store and product information and a valid government ID for
    verification. New listings are reviewed before appearing publicly. Sellers are responsible for the quality,
    safety, and accuracy of the products they list, and for fulfilling orders within their stated delivery
    coverage and estimated delivery time.`,
  },
  {
    title: '4. Reviews & Conduct',
    body: `Reviews must reflect a genuine experience with a product or seller. NorzaMart may remove reviews or
    listings that are fraudulent, abusive, or violate these terms, and may suspend accounts that repeatedly do
    so.`,
  },
  {
    title: '5. Coupons & Promotions',
    body: `Promo codes are subject to the minimum spend, discount cap, and expiry shown at the time they're
    applied. NorzaMart may limit, modify, or end a promotion at any time.`,
  },
  {
    title: '6. Limitation of Liability',
    body: `NorzaMart facilitates transactions between independent buyers and sellers and is not itself the
    seller of marketplace products. We are not liable for the quality, safety, or legality of items listed by
    sellers, though we do review new listings before they go live.`,
  },
  {
    title: '7. Changes to These Terms',
    body: `We may update these terms as the platform evolves. Continued use of NorzaMart after a change means
    you accept the updated terms.`,
  },
];

export default function TermsPage() {
  return (
    <main className="w-full min-h-screen bg-gradient-to-br from-green-100 via-emerald-50 to-teal-100 flex flex-col justify-between">
      <div>
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-14">
          <h1 className="font-display text-3xl md:text-4xl font-semibold text-basil mb-2">Terms of Service</h1>
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
