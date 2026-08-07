import Link from 'next/link';

export default function SiteFooter() {
  return (
    <footer className="w-full bg-white/40 backdrop-blur-md border-t border-white/50 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-2 sm:grid-cols-4 gap-8">
        <div>
          <h4 className="font-display text-lg font-semibold text-basil mb-3">
            Norza<span className="text-tomato">Mart</span>
          </h4>
          <p className="text-ink/50 text-xs font-body leading-relaxed">
            A community marketplace supporting local sellers across all 13 barangays of Norzagaray.
          </p>
        </div>

        <div>
          <h5 className="text-xs font-bold text-ink/70 uppercase tracking-wide mb-3">Company</h5>
          <ul className="flex flex-col gap-2 text-xs text-ink/60 font-body">
            <li><Link href="/" className="hover:text-basil transition-colors">About</Link></li>
            <li><Link href="/seller/register" className="hover:text-basil transition-colors">Become a Seller</Link></li>
            <li><a href="#" className="hover:text-basil transition-colors">Contact</a></li>
          </ul>
        </div>

        <div>
          <h5 className="text-xs font-bold text-ink/70 uppercase tracking-wide mb-3">Legal</h5>
          <ul className="flex flex-col gap-2 text-xs text-ink/60 font-body">
            <li><a href="#" className="hover:text-basil transition-colors">Privacy Policy</a></li>
            <li><a href="#" className="hover:text-basil transition-colors">Terms of Service</a></li>
            <li><a href="#" className="hover:text-basil transition-colors">FAQ</a></li>
          </ul>
        </div>

        <div>
          <h5 className="text-xs font-bold text-ink/70 uppercase tracking-wide mb-3">Connect</h5>
          <ul className="flex flex-col gap-2 text-xs text-ink/60 font-body">
            <li><a href="#" className="hover:text-basil transition-colors">Facebook</a></li>
            <li><a href="#" className="hover:text-basil transition-colors">Instagram</a></li>
            <li><a href="#" className="hover:text-basil transition-colors">TikTok</a></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/50 py-5 text-center text-xs text-gray-500 font-mono">
        NorzaMart © {new Date().getFullYear()} • Powered by Next.js & Tailwind CSS
      </div>
    </footer>
  );
}