# NorzaMart Homepage Override — Norzagaray Market Stage

This page override extends `../MASTER.md`. The master palette, accessibility rules, touch targets, and shared form behavior remain authoritative.

## Direction

The homepage is a bright, product-first local-commerce storefront inspired **only by the supplied MP4 retail reference**. Its signature is the **Norzagaray Market Stage**: real marketplace products arranged on dimensional tomato-red platforms against a mint market sky. The layout borrows the video reference's clarity and choreography without copying its brand, colors, assets, or wording. The previously supplied static marketplace screenshot is explicitly excluded from this page's design direction.

## Visual hierarchy

1. White commerce header with search and account actions.
2. One clean commerce navigation row on desktop, with an accessible animated category mega-menu and a compact overflow row only on smaller screens.
3. Light mint Market Stage hero with dimensional tomato platforms and real product imagery.
4. Optional barangay delivery context, without a decorative statistics strip.
5. Tall tonal category panels, followed by flat featured-product merchandising.
6. A light promotional deals banner, flat product grids, and a three-card shopping-support section.
7. Light local-store and seller-spotlight sections, social proof, and a mint offer signup.

## Homepage tokens

- Canvas: white (`#FFFFFF`) with soft neutral-green panels (`#F4F7F4`).
- Hero sky and soft panels: mint wash (`#E4F2E8`) and white (`#FFFFFF`).
- Product-stage platforms and promotion controls: tomato (`#C84A36`) with deep tomato faces (`#9B3529`).
- Primary type and commerce actions: basil / forest deep (`#174F38`, `#0D3021`).
- Headings: Inter 800 with tight retail tracking. Fraunces is reserved for the NorzaMart wordmark and rare brand moments.
- Corners: 12–14px for retail cards and controls; 22px for the hero and major promotional panels.
- Shadows: restrained commerce-card shadows plus one stronger, directional stage shadow in the hero.
- Section rhythm: roughly 48px mobile and 64px desktop; product merchandising stays intentionally dense.
- Product cards: no heavy enclosing border or elevated marketplace tile; use a light neutral image well and an outline pill basket action.
- Hero stage: group up to four background-free product cutouts by category on each stepped tomato platform, matching the compressed product clusters in the MP4 composition. Never wrap hero products in white information cards.
- Dark forest is limited to the slim utility bar and small high-contrast visual details. It must not become a full seller band, deal board, or newsletter block.

## Responsive rules

- Mobile: stacked hero with a simplified stage, horizontally scrollable navigation/category rails, 2-column product grid, and 44px minimum interactive targets.
- Tablet: split hero, 3-column product grid, 2-column seller layouts.
- Desktop: 7/5 hero split, 4-column product grid up to 1439px and 5 columns at 1440px, 4-column local-store band.
- No horizontal page overflow at 320px. Dense navigation rails may scroll internally with visible content cues.

## Interaction and accessibility

- Preserve a single, clear focus indicator on all controls.
- Motion hierarchy: one orchestrated hero entrance, short menu transitions, and low-distance grid reveals. No decorative infinite movement.
- Use transform and opacity only. Render final states immediately when `prefers-reduced-motion: reduce` is active.
- Product cards keep independent wishlist and basket controls outside their covering links.
- Red is reserved for offers and campaign actions, never normal body copy.
- All customer-facing copy is written in English.

## Excluded mixed-reference patterns

- No red secondary navigation bar.
- No navy or deep-green marketplace/deal-board sections.
- No thick black heading rules or dense ecommerce-card shadows.
- No boxed category icon tiles; use the MP4-inspired tall category posters.
