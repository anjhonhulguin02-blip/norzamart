"use client";

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { AnimatePresence, motion } from 'framer-motion';

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

interface Props {
  navItems: NavItem[];
  brandSuffix?: string;
  dark?: boolean;
}

export default function DashboardMobileTopbar({ navItems, brandSuffix, dark = false }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Relying only on each Link's onClick to close the drawer races against
  // Next's own navigation — sometimes the route change wins and the drawer is
  // left open on the new page. Watching pathname is the reliable way to close
  // it exactly when navigation actually completes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // The drawer overlay is rendered into document.body via a portal rather than
  // inline here — this div has backdrop-blur (a CSS "filter"), which creates a
  // new containing block for position:fixed descendants, so a fixed overlay
  // nested inside it gets clipped to the topbar's own height instead of
  // covering the viewport.
  const drawer = open && createPortal(
    <AnimatePresence>
      {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-ink/40"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
              className={`absolute right-0 top-0 h-full w-72 max-w-[80vw] p-5 flex flex-col ${dark ? 'bg-ink text-white' : 'bg-white'}`}
            >
              <div className="flex items-center justify-between mb-6">
                <span className="font-display text-lg font-semibold">Menu</span>
                <button onClick={() => setOpen(false)} aria-label="Close menu" className="text-xl">✕</button>
              </div>

              <nav className="flex flex-col gap-1 flex-1 overflow-y-auto">
                {navItems.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        active
                          ? 'bg-basil text-white'
                          : dark ? 'text-white/70 hover:bg-white/10' : 'text-ink/70 hover:bg-basil/5'
                      }`}
                    >
                      <span>{item.icon}</span> {item.label}
                    </Link>
                  );
                })}
              </nav>

              <button
                onClick={() => { setOpen(false); signOut({ callbackUrl: '/' }); }}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-tomato hover:bg-tomato/5 transition-all mt-4"
              >
                🚪 Logout
              </button>
            </motion.div>
          </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );

  return (
    <>
      <div className={`md:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3.5 border-b ${
        dark ? 'bg-ink text-white border-white/10' : 'bg-white/80 backdrop-blur-xl border-ink/10'
      }`}>
        <Link href="/" className={`font-display text-lg font-semibold ${dark ? '' : 'text-basil'}`}>
          Norza<span className="text-tomato">Mart</span>
          {brandSuffix && <span className={`text-xs font-body font-normal ml-1 ${dark ? 'text-white/40' : 'text-ink/40'}`}>{brandSuffix}</span>}
        </Link>
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className={`w-9 h-9 flex items-center justify-center rounded-lg text-xl ${dark ? 'text-white' : 'text-ink'}`}
        >
          ☰
        </button>
      </div>
      {drawer}
    </>
  );
}
