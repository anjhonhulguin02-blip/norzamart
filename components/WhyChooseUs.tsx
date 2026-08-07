const features = [
  { icon: '🚚', title: 'Fast Local Delivery', desc: 'Sourced and delivered within Norzagaray — no long waits from distant warehouses.' },
  { icon: '🤝', title: 'Trusted Local Sellers', desc: 'Every store is run by real neighbors in your barangay, not anonymous resellers.' },
  { icon: '🌱', title: 'Genuinely Fresh', desc: 'We show you exactly when a product was listed, so you know what\'s truly fresh.' },
  { icon: '🔒', title: 'Secure & Simple', desc: 'Your account and orders are protected, with clear, honest information at every step.' },
];

export default function WhyChooseUs() {
  return (
    <div className="max-w-7xl mx-auto px-4 mt-14">
      <h2 className="text-xl font-black text-gray-900 tracking-tight drop-shadow-sm mb-6 text-center">Why Choose NorzaMart</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
        {features.map((f) => (
          <div key={f.title} className="bg-white/50 backdrop-blur-xl border border-white/70 rounded-2xl p-6 text-center shadow-sm hover:shadow-md transition-all">
            <span className="text-3xl block mb-3">{f.icon}</span>
            <h3 className="font-display font-semibold text-basil text-sm mb-1.5">{f.title}</h3>
            <p className="text-ink/60 text-xs font-body leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}