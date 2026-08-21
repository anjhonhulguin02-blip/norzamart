import Link from 'next/link';

export default function SiteFooter() {
  return (
    <footer className="nm-market-weave mt-20 w-full border-t border-white/10 bg-forest-deep text-white">
      <div className="nm-container grid grid-cols-1 gap-8 py-12 sm:grid-cols-3 md:py-14">
        <div>
          <h2 className="mb-3 font-display text-2xl font-semibold tracking-[-0.04em] text-white">
            Norza<span className="text-tomato">Mart</span>
          </h2>
          <p className="max-w-sm text-sm leading-6 text-white/68">
            A community marketplace supporting local sellers across all 13 barangays of Norzagaray.
          </p>
        </div>

        <div>
          <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.1em] text-mint-glow">Company</h3>
          <ul className="flex flex-col text-sm text-white/72">
            <li><Link href="/about" className="inline-flex min-h-11 min-w-11 items-center transition-colors hover:text-white">About</Link></li>
            <li><Link href="/seller/register" className="inline-flex min-h-11 min-w-11 items-center transition-colors hover:text-white">Become a seller</Link></li>
            <li><Link href="/contact" className="inline-flex min-h-11 min-w-11 items-center transition-colors hover:text-white">Contact</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.1em] text-mint-glow">Help and legal</h3>
          <ul className="flex flex-col text-sm text-white/72">
            <li><Link href="/privacy" className="inline-flex min-h-11 min-w-11 items-center transition-colors hover:text-white">Privacy policy</Link></li>
            <li><Link href="/terms" className="inline-flex min-h-11 min-w-11 items-center transition-colors hover:text-white">Terms of service</Link></li>
            <li><Link href="/faq" className="inline-flex min-h-11 min-w-11 items-center transition-colors hover:text-white">Frequently asked questions</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 py-5 text-center font-mono text-[11px] text-white/55">
        NorzaMart © {new Date().getFullYear()} · Built for the Norzagaray community
      </div>
    </footer>
  );
}
