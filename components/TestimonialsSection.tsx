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
    <section className="nm-container nm-section">
      <div className="mx-auto max-w-2xl text-center">
        <p className="nm-kicker">From the community</p>
        <h2 className="nm-section-title mt-2">What our customers say</h2>
      </div>
      <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {reviews.map((r, i) => (
          <article key={i} className="nm-surface p-5">
            <div className="flex items-center gap-3 mb-2">
              <span className="w-9 h-9 rounded-full bg-basil/10 flex items-center justify-center text-sm font-bold text-basil">
                {r.userName.charAt(0).toUpperCase()}
              </span>
              <div>
                <p className="font-bold text-sm text-ink">{r.userName}</p>
                <p className="text-ink/40 text-[11px]">{r.productName}</p>
              </div>
            </div>
            <div className="flex gap-0.5 text-[#9b6610]" aria-label={`${r.rating} out of 5 stars`}>
              {Array.from({ length: 5 }, (_, star) => <StarIcon key={star} size={14} filled={star < r.rating} />)}
            </div>
            <p className="mt-3 line-clamp-3 text-sm leading-6 text-ink/75">{r.comment}</p>
            <p className="mt-3 text-[11px] text-stone">{new Date(r.createdAt).toLocaleDateString()}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
import { StarIcon } from './ui/NorzaIcons';
