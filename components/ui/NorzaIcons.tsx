import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function IconBase({ size = 20, children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return <IconBase {...props}><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></IconBase>;
}

export function BasketIcon(props: IconProps) {
  return <IconBase {...props}><path d="m5 10 3-6m11 6-3-6M3.5 10h17l-1.2 9H4.7z" /><path d="M9 13v3m6-3v3" /></IconBase>;
}

export function ChatIcon(props: IconProps) {
  return <IconBase {...props}><path d="M20 15a4 4 0 0 1-4 4H9l-5 2v-5a7 7 0 1 1 16-1Z" /></IconBase>;
}

export function HeartIcon({ filled = false, ...props }: IconProps & { filled?: boolean }) {
  return (
    <IconBase {...props} fill={filled ? 'currentColor' : 'none'}>
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />
    </IconBase>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return <IconBase {...props}><path d="m7 10 5 5 5-5" /></IconBase>;
}

export function ArrowRightIcon(props: IconProps) {
  return <IconBase {...props}><path d="M5 12h14m-6-6 6 6-6 6" /></IconBase>;
}

export function ArrowLeftIcon(props: IconProps) {
  return <IconBase {...props}><path d="M19 12H5m6 6-6-6 6-6" /></IconBase>;
}

export function HomeIcon(props: IconProps) {
  return <IconBase {...props}><path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10M9 20v-6h6v6" /></IconBase>;
}

export function SettingsIcon(props: IconProps) {
  return <IconBase {...props}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6 1.7 1.7 0 0 0 10 3v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" /></IconBase>;
}

export function StoreIcon(props: IconProps) {
  return <IconBase {...props}><path d="M4 10v10h16V10" /><path d="M3 4h18l-1 6a3 3 0 0 1-4 1 3 3 0 0 1-4 0 3 3 0 0 1-4 0 3 3 0 0 1-4-1Z" /><path d="M9 20v-5h6v5" /></IconBase>;
}

export function MapPinIcon(props: IconProps) {
  return <IconBase {...props}><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></IconBase>;
}

export function CheckBadgeIcon(props: IconProps) {
  return <IconBase {...props}><path d="m9 12 2 2 4-5" /><path d="M12 2.8 14.2 4l2.5-.1 1.2 2.2 2.2 1.2-.1 2.5 1.2 2.2-1.2 2.2.1 2.5-2.2 1.2-1.2 2.2-2.5-.1-2.2 1.2L9.8 20l-2.5.1-1.2-2.2-2.2-1.2.1-2.5L2.8 12 4 9.8l-.1-2.5 2.2-1.2 1.2-2.2 2.5.1Z" /></IconBase>;
}

export function LeafIcon(props: IconProps) {
  return <IconBase {...props}><path d="M20 4C12 4 5 8 5 15a5 5 0 0 0 5 5c7 0 10-8 10-16Z" /><path d="M4 21c2-5 6-9 12-12" /></IconBase>;
}

export function TruckIcon(props: IconProps) {
  return <IconBase {...props}><path d="M3 5h11v11H3zM14 9h4l3 3v4h-7z" /><circle cx="7" cy="18" r="2" /><circle cx="17" cy="18" r="2" /></IconBase>;
}

export function ShieldCheckIcon(props: IconProps) {
  return <IconBase {...props}><path d="M12 3 5 6v5c0 4.8 2.8 8 7 10 4.2-2 7-5.2 7-10V6Z" /><path d="m9 12 2 2 4-5" /></IconBase>;
}

export function UsersIcon(props: IconProps) {
  return <IconBase {...props}><circle cx="9" cy="8" r="3" /><path d="M3 20v-2a6 6 0 0 1 12 0v2" /><path d="M16 5a3 3 0 0 1 0 6m1 3a5 5 0 0 1 4 5v1" /></IconBase>;
}

export function PackageIcon(props: IconProps) {
  return <IconBase {...props}><path d="m4 7 8-4 8 4-8 4Z" /><path d="M4 7v10l8 4 8-4V7M12 11v10" /></IconBase>;
}

export function CategoryGridIcon(props: IconProps) {
  return <IconBase {...props}><rect x="3" y="3" width="7" height="7" rx="1.4" /><rect x="14" y="3" width="7" height="7" rx="1.4" /><rect x="3" y="14" width="7" height="7" rx="1.4" /><rect x="14" y="14" width="7" height="7" rx="1.4" /></IconBase>;
}

export function BottleIcon(props: IconProps) {
  return <IconBase {...props}><path d="M9 3h6M10 3v4l-2 3v10h8V10l-2-3V3" /><path d="M8 13h8" /></IconBase>;
}

export function EggIcon(props: IconProps) {
  return <IconBase {...props}><path d="M18 15.5a6 6 0 0 1-12 0C6 11.2 9.1 4 12 4s6 7.2 6 11.5Z" /></IconBase>;
}

export function FruitIcon(props: IconProps) {
  return <IconBase {...props}><path d="M12 8c3-2.2 7-.5 7 4 0 5-3 9-7 9s-7-4-7-9c0-4.5 4-6.2 7-4Z" /><path d="M12 7c.2-2.1 1.5-3.5 3.7-4" /><path d="M11.8 6.2C9.6 6.3 8 5.2 7.3 3.3c2.2-.2 4 .7 4.5 2.9Z" /></IconBase>;
}

export function MeatIcon(props: IconProps) {
  return <IconBase {...props}><path d="M16.7 3.7c2.9 2.9 2.7 7.2-.5 9.8-2.4 1.9-5.3 2.2-7.2.3-2.1-2.1-1.7-5.5.7-7.9 2.3-2.3 5.2-4.1 7-2.2Z" /><path d="m9.2 14.2-3 3" /><path d="M6.3 16.8a2 2 0 1 0-2.8 2.8 2 2 0 1 0 2.8 2.8 2 2 0 0 0 0-2.8 2 2 0 0 0 0-2.8Z" /></IconBase>;
}

export function GrainIcon(props: IconProps) {
  return <IconBase {...props}><path d="M12 22V4" /><path d="M12 8C9.2 8 7.5 6.5 7.2 4c2.8 0 4.5 1.4 4.8 4ZM12 13c-2.8 0-4.5-1.5-4.8-4 2.8 0 4.5 1.4 4.8 4ZM12 18c-2.8 0-4.5-1.5-4.8-4 2.8 0 4.5 1.4 4.8 4Z" /><path d="M12 10c2.8 0 4.5-1.5 4.8-4-2.8 0-4.5 1.4-4.8 4ZM12 15c2.8 0 4.5-1.5 4.8-4-2.8 0-4.5 1.4-4.8 4ZM12 20c2.8 0 4.5-1.5 4.8-4-2.8 0-4.5 1.4-4.8 4Z" /></IconBase>;
}

export function FishIcon(props: IconProps) {
  return <IconBase {...props}><path d="M4 12c3-4 7.2-5.5 12-2.8L21 6v12l-5-3.2C11.2 17.5 7 16 4 12Z" /><circle cx="9" cy="11" r="1" /></IconBase>;
}

export function MarketCategoryIcon({ category = '', ...props }: IconProps & { category?: string }) {
  const normalized = category.toLowerCase();
  if (normalized.includes('beverage') || normalized.includes('drink')) return <BottleIcon {...props} />;
  if (normalized.includes('dairy') || normalized.includes('egg')) return <EggIcon {...props} />;
  if (normalized.includes('fruit')) return <FruitIcon {...props} />;
  if (normalized.includes('household') || normalized.includes('home')) return <HomeIcon {...props} />;
  if (normalized.includes('meat') || normalized.includes('poultry') || normalized.includes('chicken') || normalized.includes('beef') || normalized.includes('pork')) return <MeatIcon {...props} />;
  if (normalized.includes('rice') || normalized.includes('grain')) return <GrainIcon {...props} />;
  if (normalized.includes('seafood') || normalized.includes('fish')) return <FishIcon {...props} />;
  if (normalized.includes('vegetable') || normalized.includes('produce')) return <LeafIcon {...props} />;
  return <CategoryGridIcon {...props} />;
}

export function MegaphoneIcon(props: IconProps) {
  return <IconBase {...props}><path d="M4 13v-2a2 2 0 0 1 2-2h3l8-4v14l-8-4H6a2 2 0 0 1-2-2Z" /><path d="m8 15 1 5h3l-1-4" /><path d="M20 9v6" /></IconBase>;
}

export function CloseIcon(props: IconProps) {
  return <IconBase {...props}><path d="m6 6 12 12M18 6 6 18" /></IconBase>;
}

export function FlameIcon(props: IconProps) {
  return <IconBase {...props}><path d="M12 22c4 0 7-3 7-7 0-3-1.5-5.5-4.5-8 .2 2-1 3.5-2 4.5-.5-3-2-6-4-8.5.2 4-3.5 6.8-3.5 12 0 4 3 7 7 7Z" /><path d="M9 18c0-2 1.3-3.1 2.2-4.5.2 1.4 1.2 2.2 1.8 3.2.6-1 1-1.8.8-2.7 1.1 1 1.7 2.2 1.7 3.5A3.5 3.5 0 0 1 12 21a3 3 0 0 1-3-3Z" /></IconBase>;
}

export function TrendIcon(props: IconProps) {
  return <IconBase {...props}><path d="m3 17 6-6 4 4 8-9" /><path d="M15 6h6v6" /></IconBase>;
}

export function AwardIcon(props: IconProps) {
  return <IconBase {...props}><circle cx="12" cy="8" r="5" /><path d="m8.5 12-1 9 4.5-2 4.5 2-1-9" /></IconBase>;
}

export function StarIcon({ filled = false, ...props }: IconProps & { filled?: boolean }) {
  return <IconBase {...props} fill={filled ? 'currentColor' : 'none'}><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.6l6.2-.9Z" /></IconBase>;
}

export function BellIcon(props: IconProps) {
  return <IconBase {...props}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" /><path d="M10 21h4" /></IconBase>;
}

export function TagIcon(props: IconProps) {
  return <IconBase {...props}><path d="M20 13 13 20l-9-9V4h7Z" /><circle cx="8" cy="8" r="1.5" /></IconBase>;
}

export function WalletIcon(props: IconProps) {
  return <IconBase {...props}><path d="M4 6h14a2 2 0 0 1 2 2v10H4a2 2 0 0 1-2-2V6a3 3 0 0 1 3-3h12" /><path d="M16 11h6v4h-6a2 2 0 0 1 0-4Z" /></IconBase>;
}
