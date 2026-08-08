import Navbar from '@/components/Navbar';
import SiteFooter from '@/components/SiteFooter';
import FaqAccordion from '@/components/FaqAccordion';

export const metadata = { title: 'FAQ — NorzaMart' };

const FAQS = [
  {
    question: 'What barangays does NorzaMart deliver to?',
    answer: 'NorzaMart covers all 13 barangays of Norzagaray, Bulacan. Each seller sets their own delivery coverage — some deliver everywhere, others to specific barangays — shown on every product page.',
  },
  {
    question: 'How do I pay for my order?',
    answer: 'You can choose Cash on Delivery, GCash, or Bank Transfer at checkout. Your preferred method can also be saved in Account Settings.',
  },
  {
    question: 'How long does delivery take?',
    answer: "Delivery time depends on the seller you're ordering from — check the \"Estimated Delivery\" note on the product page or at checkout. Many local sellers offer same-day delivery.",
  },
  {
    question: 'Can I cancel an order?',
    answer: 'Yes, as long as the order is still "Pending" and hasn\'t been accepted by the seller yet. You can cancel it from My Orders in your dashboard.',
  },
  {
    question: 'How do I become a seller?',
    answer: 'Open the profile menu and choose "Sell on NorzaMart", or visit the seller registration page directly. You\'ll need your store details and a government ID — new stores are reviewed before going live.',
  },
  {
    question: 'Why isn\'t my new product showing up yet?',
    answer: "New product listings are reviewed by our team before they appear in the marketplace, usually within a day. You'll get a notification once it's approved (or if it needs changes).",
  },
  {
    question: 'Is my payment or personal information safe?',
    answer: "We never store your card details — payments are handled via Cash on Delivery, GCash, or bank transfer directly with the seller. See our Privacy Policy for details on how we handle your data.",
  },
  {
    question: 'How do I contact a seller?',
    answer: 'Use the "Chat with Seller" button on any of their product pages, or message them directly from your Messages tab.',
  },
];

export default function FaqPage() {
  return (
    <main className="w-full min-h-screen bg-gradient-to-br from-green-100 via-emerald-50 to-teal-100 flex flex-col justify-between">
      <div>
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-14">
          <h1 className="font-display text-3xl md:text-4xl font-semibold text-basil mb-2">Frequently Asked Questions</h1>
          <p className="text-ink/60 text-sm font-body mb-8">Can't find what you're looking for? <a href="/contact" className="text-basil font-bold hover:underline">Contact us</a>.</p>

          <FaqAccordion items={FAQS} />
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
