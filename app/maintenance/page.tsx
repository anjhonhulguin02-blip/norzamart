import type { Metadata } from 'next';
import BrandedStatusScreen from '@/components/ui/BrandedStatusScreen';

export const metadata: Metadata = {
  title: 'Under Maintenance — NorzaMart',
  robots: { index: false, follow: false },
};

export default function MaintenancePage() {
  return (
    <BrandedStatusScreen
      icon="🛠️"
      title="We'll be right back"
      message="NorzaMart is undergoing scheduled maintenance to make things better. Please check back shortly — thanks for your patience!"
      showDots
    />
  );
}
