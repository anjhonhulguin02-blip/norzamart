interface Testimonial {
  userName: string;
  rating: number;
  comment: string;
  productName: string;
  createdAt: string;
}

export default function TestimonialsSection({ reviews }: { reviews: Testimonial[] }) {
  if (reviews.length === 0) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 mt-14">
      <h2 className="text-xl font-black text-gray-900 tracking-tight drop-shadow-sm mb-6 text-center">What Our Customers Say</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
        {reviews.map((r, i) => (
          <div key={i} className="bg-white/50 backdrop-blur-xl border border-white/70 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <span className="w-9 h-9 rounded-full bg-basil/10 flex items-center justify-center text-sm font-bold text-basil">
                {r.userName.charAt(0).toUpperCase()}
              </span>
              <div>
                <p className="font-bold text-sm text-ink">{r.userName}</p>
                <p className="text-ink/40 text-[11px]">{r.productName}</p>
              </div>
            </div>
            <span className="text-yellow-500 text-sm">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
            <p className="text-ink/70 text-sm font-body mt-2 line-clamp-3">{r.comment}</p>
            <p className="text-ink/30 text-[10px] mt-2">{new Date(r.createdAt).toLocaleDateString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}