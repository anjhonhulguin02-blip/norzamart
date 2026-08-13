import { useCallback, useState, type RefObject } from "react";

/** Computes a viewport-fixed position anchored to a trigger element's actual
 * on-screen rect, for dropdowns that must render via a portal (see below).
 *
 * Naively centering or right-aligning a dropdown relative to its own small
 * trigger wrapper breaks down whenever that trigger isn't near the edge
 * it's anchored to — on mobile, icons like the profile avatar or bell sit
 * close to the left edge, so a right-aligned (or even centered) dropdown
 * still runs off-screen to the left. This instead aligns the menu's left
 * edge with the trigger's left edge by default, then clamps that position
 * (and the menu's width) so the whole box always stays within the viewport
 * with a fixed margin, regardless of where the trigger sits. */
export function useAnchoredMenuPosition(triggerRef: RefObject<HTMLElement | null>) {
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);

  const measure = useCallback((preferredWidth: number, margin = 16) => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const width = Math.min(preferredWidth, window.innerWidth - margin * 2);
    let left = rect.left;
    if (left + width > window.innerWidth - margin) left = window.innerWidth - margin - width;
    if (left < margin) left = margin;
    setPos({ top: rect.bottom + 8, left, width });
  }, [triggerRef]);

  return { pos, measure };
}
