"use client";

import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Accessible modal dialog: role="dialog"/aria-modal, focus trap, Escape to
 * close, background scroll lock, and focus restoration to whatever triggered
 * it. Rendered through a portal into document.body — a couple of pages wrap
 * their trigger in a backdrop-blur container, which creates a new containing
 * block for position:fixed children and would otherwise clip the overlay.
 */
export default function Dialog({ open, onClose, title, children, maxWidth = 'max-w-md' }: DialogProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  // document.body doesn't exist during server/static rendering; defer the
  // portal until after client-side mount rather than referencing it eagerly.
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  // Unmount is driven by a timer matched to the exit transition's duration
  // rather than AnimatePresence's automatic exit-tracking or framer-motion's
  // onAnimationComplete callback — both were observed in dev to leave a
  // fully-transparent-but-still-pointer-events-auto overlay stuck in the DOM
  // (the opacity transition visibly completes, but nothing ever unmounts it).
  const [shouldRender, setShouldRender] = useState(open);
  useEffect(() => {
    if (open) {
      setShouldRender(true);
      return;
    }
    if (!shouldRender) return;
    const timeout = setTimeout(() => setShouldRender(false), 220);
    return () => clearTimeout(timeout);
  }, [open, shouldRender]);

  useEffect(() => {
    if (!open) return;

    previouslyFocused.current = document.activeElement as HTMLElement;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusFirst = () => {
      const first = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      (first || panelRef.current)?.focus();
    };
    // Wait a tick for the enter animation/mount to finish before moving focus.
    const focusTimeout = setTimeout(focusFirst, 10);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;

      const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      clearTimeout(focusTimeout);
      document.removeEventListener('keydown', handleKeyDown, true);
      document.body.style.overflow = originalOverflow;
      previouslyFocused.current?.focus();
    };
  }, [open, onClose]);

  if (!mounted || !shouldRender) return null;

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: open ? 1 : 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 top-0 left-0 w-screen h-screen bg-ink/40 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
      onClick={onClose}
    >
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        initial={{ scale: 0.94, opacity: 0 }}
        animate={{ scale: open ? 1 : 0.94, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
        className={`bg-white/90 backdrop-blur-lg border border-white/60 shadow-2xl rounded-3xl w-full ${maxWidth} p-8 relative mx-4 outline-none`}
      >
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-4 right-4 text-ink/40 hover:text-ink text-lg font-bold bg-transparent border-none cursor-pointer outline-none transition-colors focus-visible:ring-2 focus-visible:ring-basil/40 rounded-full w-8 h-8 flex items-center justify-center"
        >
          ✕
        </button>
        <h2 id={titleId} className="font-display text-2xl font-semibold text-center text-basil mb-1">
          {title}
        </h2>
        {children}
      </motion.div>
    </motion.div>,
    document.body
  );
}
