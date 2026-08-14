export default function Loading() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-cream-mist">
      <div aria-hidden className="absolute -top-24 -left-20 w-80 h-80 bg-mint-glow rounded-full opacity-25 blur-3xl" />
      <div aria-hidden className="absolute -bottom-28 -right-20 w-96 h-96 bg-basil-light rounded-full opacity-10 blur-3xl" />

      <div className="relative flex flex-col items-center gap-5">
        <h1 className="animate-loading-wordmark font-display text-4xl sm:text-5xl font-semibold tracking-tight">
          <span className="text-basil">Norza</span><span className="text-tomato">Mart</span>
        </h1>
        <p className="text-[11px] font-body font-semibold uppercase tracking-[0.2em] text-ink/40">
          Fresh · Local · Delivered
        </p>
        <div className="flex items-center gap-2 mt-1" role="status" aria-label="Loading">
          <span className="w-2 h-2 rounded-full bg-basil animate-loading-dot" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 rounded-full bg-basil animate-loading-dot" style={{ animationDelay: '160ms' }} />
          <span className="w-2 h-2 rounded-full bg-basil animate-loading-dot" style={{ animationDelay: '320ms' }} />
        </div>
      </div>
    </div>
  );
}
