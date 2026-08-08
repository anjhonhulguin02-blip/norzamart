import Navbar from '@/components/Navbar';
import SiteFooter from '@/components/SiteFooter';
import Link from 'next/link';

export const metadata = { title: 'About — NorzaMart' };

export default function AboutPage() {
  return (
    <main className="w-full min-h-screen bg-gradient-to-br from-green-100 via-emerald-50 to-teal-100 flex flex-col justify-between">
      <div>
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-14">
          <span className="inline-block bg-tomato text-white text-[10px] uppercase font-black tracking-wider px-3 py-1.5 rounded-full">
            Our Story
          </span>
          <h1 className="font-display text-3xl md:text-4xl font-semibold text-basil mt-4 mb-6">About NorzaMart</h1>

          <div className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-3xl p-8 shadow-lg flex flex-col gap-5 text-ink/80 font-body text-sm leading-relaxed">
            <p>
              NorzaMart is a community marketplace built for Norzagaray, Bulacan. Instead of routing orders through
              distant warehouses, we connect buyers directly with sari-sari stores, backyard growers, home cooks,
              and neighborhood vendors across all 13 barangays.
            </p>
            <p>
              Every store on NorzaMart is run by a real neighbor — someone selling produce, meat, seafood, or daily
              goods from their own community. Our goal is simple: make it easy to find and support the sellers
              already around you, with the same convenience you'd expect from a big marketplace app.
            </p>
            <p>
              We're still growing. If you're a shopper, thank you for buying local. If you're thinking about
              selling, we'd love to have your store on the platform —{' '}
              <Link href="/seller/register" className="text-basil font-bold hover:underline">
                get started here
              </Link>.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-8">
            {[
              ['🏡', 'Hyperlocal', 'Every seller delivers within Norzagaray — no long shipping waits.'],
              ['🤝', 'Community-first', 'We prioritize real neighbors over anonymous resellers.'],
              ['🌱', 'Genuinely fresh', 'Listings show exactly when a product was posted.'],
            ].map(([icon, title, desc]) => (
              <div key={title} className="bg-white/50 border border-white/70 rounded-2xl p-5 text-center">
                <span className="text-2xl block mb-2">{icon}</span>
                <p className="font-bold text-sm text-ink">{title}</p>
                <p className="text-ink/60 text-xs font-body mt-1">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
