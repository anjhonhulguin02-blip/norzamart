import type { ReactNode } from 'react';

interface Props {
  icon: string;
  title: string;
  message: string;
  action?: ReactNode;
  showDots?: boolean;
}

/** Full-screen branded status page — shares the visual language of
 * app/loading.tsx (cream-mist ground, soft glow accents, Fraunces wordmark)
 * for the maintenance page and the offline banner, so a user sees one
 * consistent "NorzaMart is handling something" moment regardless of which
 * of the three actually applies. */
export default function BrandedStatusScreen({ icon, title, message, action, showDots = false }: Props) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-cream-mist px-6">
      <div aria-hidden className="absolute -top-24 -left-20 w-80 h-80 bg-mint-glow rounded-full opacity-25 blur-3xl" />
      <div aria-hidden className="absolute -bottom-28 -right-20 w-96 h-96 bg-basil-light rounded-full opacity-10 blur-3xl" />

      <div className="relative flex flex-col items-center text-center gap-3 max-w-sm">
        <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight mb-2">
          <span className="text-basil">Norza</span><span className="text-tomato">Mart</span>
        </h1>
        <span className="text-5xl" aria-hidden="true">{icon}</span>
        <h2 className="font-display text-xl sm:text-2xl font-semibold text-ink mt-1">{title}</h2>
        <p className="text-sm text-ink/60 font-body leading-relaxed">{message}</p>
        {action}
        {showDots && (
          <div className="flex items-center gap-2 mt-2" role="status" aria-label="Loading">
            <span className="w-2 h-2 rounded-full bg-basil animate-loading-dot" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 rounded-full bg-basil animate-loading-dot" style={{ animationDelay: '160ms' }} />
            <span className="w-2 h-2 rounded-full bg-basil animate-loading-dot" style={{ animationDelay: '320ms' }} />
          </div>
        )}
      </div>
    </div>
  );
}
