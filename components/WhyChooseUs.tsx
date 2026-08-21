"use client";

import { motion, useReducedMotion } from 'framer-motion';
import { ShieldCheckIcon, StoreIcon, TruckIcon } from './ui/NorzaIcons';

const features = [
  {
    icon: TruckIcon,
    title: 'Fast local delivery',
    desc: 'Shorter routes within Norzagaray help everyday orders arrive sooner.',
    visual: 'bg-tomato-wash text-tomato',
  },
  {
    icon: StoreIcon,
    title: 'Neighborhood sellers',
    desc: 'Shop from real local stores and sellers serving your community.',
    visual: 'bg-mint-wash text-basil',
  },
  {
    icon: ShieldCheckIcon,
    title: 'Clear, secure orders',
    desc: 'Know the product, seller, delivery coverage, and order status at every step.',
    visual: 'bg-forest-deep text-mint-glow',
  },
];

export default function WhyChooseUs() {
  const reduceMotion = useReducedMotion();

  return (
    <section id="why-norzamart" className="nm-container nm-section scroll-mt-36">
      <div className="mb-5 max-w-2xl">
        <p className="nm-kicker">Services to help you shop</p>
        <h2 className="nm-section-title mt-1">Local shopping, made clearer.</h2>
        <p className="mt-2 text-sm leading-6 text-stone">Simple support from browsing to doorstep.</p>
      </div>

      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.18 }}
        variants={{ hidden: {}, show: { transition: { staggerChildren: reduceMotion ? 0 : 0.075 } } }}
        className="grid grid-cols-1 gap-4 md:grid-cols-3"
      >
        {features.map((feature) => {
          const FeatureIcon = feature.icon;
          return (
            <motion.article
              key={feature.title}
              variants={{
                hidden: reduceMotion ? { opacity: 1 } : { opacity: 0, y: 18, scale: 0.98 },
                show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.38, ease: 'easeOut' } },
              }}
              whileHover={reduceMotion ? undefined : { y: -4 }}
              className="overflow-hidden rounded-[0.9rem] border border-line bg-white shadow-[0_8px_26px_rgba(24,49,39,0.07)]"
            >
              <div className="min-h-36 p-5 sm:p-6">
                <h3 className="font-body text-xl font-black leading-tight tracking-[-0.03em] text-ink">{feature.title}</h3>
                <p className="mt-3 text-sm leading-6 text-stone">{feature.desc}</p>
              </div>
              <div className={`relative flex h-32 items-center justify-center overflow-hidden ${feature.visual}`}>
                <span aria-hidden="true" className="absolute -left-6 -top-10 h-28 w-28 rounded-full border-[20px] border-current opacity-10" />
                <span aria-hidden="true" className="absolute -bottom-12 right-5 h-32 w-32 rounded-full border-[24px] border-current opacity-10" />
                <motion.span
                  whileHover={reduceMotion ? undefined : { rotate: -4, scale: 1.07 }}
                  transition={{ type: 'spring', stiffness: 250, damping: 18 }}
                  className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white/72 shadow-[0_12px_30px_rgba(24,49,39,0.14)] backdrop-blur-sm"
                >
                  <FeatureIcon size={42} />
                </motion.span>
              </div>
            </motion.article>
          );
        })}
      </motion.div>
    </section>
  );
}
