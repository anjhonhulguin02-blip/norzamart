# NorzaMart Design System

## North star

**Neighborhood market, refined.** NorzaMart should feel as warm and specific as a trusted local market, but as clear and dependable as a modern delivery product. The signature visual is a quiet woven-market pattern: grounded, tactile, and local without becoming rustic or decorative clutter.

### Product principles

1. **Local proof first** — show barangay, seller verification, freshness, and delivery coverage near the action they support.
2. **One obvious next step** — each section has one primary action; filters and secondary links remain visually quieter.
3. **Honest surfaces** — use solid paper-like cards, visible borders, and restrained shadows instead of stacked glass effects.
4. **Fast to scan** — product name, price, unit, origin, and availability must be understandable in one pass.
5. **Comfortable on touch** — all controls are at least 44px high or have a 44px hit area.

## Brand tokens

### Color

| Token | Value | Use | Verified contrast |
| --- | --- | --- | --- |
| `forest` / primary | `#174F38` | Primary actions, strong headings, active states | 9.49:1 with white |
| `leaf` / primary-hover | `#2E7656` | Hover, secondary brand accents | 5.47:1 with white |
| `tomato` / accent | `#C84A36` | Deals, urgent badges, accent CTA | 4.68:1 with white |
| `cream` / canvas | `#F7F3EA` | Page background | 12.58:1 with ink |
| `paper` / surface | `#FFFCF6` | Cards, menus, forms | 13.60:1 with ink |
| `ink` / text | `#183127` | Primary text | — |
| `stone` / muted text | `#5F6D64` | Secondary copy | 4.92:1 on cream |
| `line` / border | `#D8E0D8` | Dividers and card borders | Non-text/decorative |
| `mint` / soft accent | `#8FD3AF` | Decorative fields, success surface | 8.28:1 with deep forest |
| `sun` / highlight | `#EABF58` | Decorative highlight only | Never used alone for meaning |
| `danger` | `#B9382D` | Errors and destructive actions | Pair with text/icon |

Do not use black text on the primary green or tomato accent. Both brand actions use white text. Do not place `stone` text over translucent imagery.

### Typography

- **Display:** Fraunces, variable. Use for the wordmark, hero, and major editorial headings only. Weight 600; optical sizing enabled.
- **Body/UI:** Inter. Use for navigation, forms, descriptions, and labels. Weight 400–700.
- **Commerce data:** Geist Mono with system fallback. Use for prices, order IDs, timers, and tabular counts.
- Body text is 16px minimum on mobile forms and 14–16px elsewhere; line-height is 1.55–1.7.
- Keep long text to 65–72 characters per line. Prefer natural wrapping over truncation for essential content.

### Type scale

| Role | Mobile | Desktop | Line height |
| --- | --- | --- | --- |
| Display | 44px | 68px | 0.98–1.02 |
| H1 | 36px | 56px | 1.04 |
| H2 | 28px | 40px | 1.1 |
| H3 | 20px | 24px | 1.25 |
| Body | 16px | 16px | 1.6 |
| Small | 13px | 14px | 1.5 |
| Label | 12px | 12px | 1.25, uppercase with 0.08em tracking |

## Layout system

- **Container:** maximum 1280px; gutters 16px mobile, 24px tablet, 32px desktop.
- **Section spacing:** 56px mobile, 72px tablet, 96px desktop.
- **Grid:** 4 columns mobile, 8 tablet, 12 desktop. Product grids use 2 / 3 / 4 / 5 columns at 375 / 768 / 1024 / 1440 widths.
- **Spacing scale:** 4, 8, 12, 16, 24, 32, 48, 64, 80, 96.
- **Breakpoints to verify:** 375px, 768px, 1024px, and 1440px.
- Sticky navigation must never cover anchored or keyboard-focused content.

## Shape, border, and elevation

- Small controls: 10–12px radius.
- Cards: 18px radius.
- Feature panels: 24–28px radius.
- Pills are reserved for filters, compact statuses, and short actions—not every container.
- Card border: 1px solid `line`; emphasized cards use a 2px forest edge or an inset accent.
- Elevation 1: `0 1px 2px rgba(24,49,39,.05), 0 10px 30px rgba(24,49,39,.06)`.
- Elevation 2: `0 18px 50px rgba(24,49,39,.12)` for menus and active overlays only.

## Signature visual language

- Use the **market-weave** pattern as a very low-contrast background field in the hero and page canvas.
- Use asymmetry in the hero: editorial copy on the left, local-market illustration/proof card on the right.
- Product photography sits on a warm neutral well, not transparent glass.
- Use a clipped tomato corner or small seal for deals and “fresh today” labels.
- Motion is subtle: 160–220ms for controls, 300–400ms for section entry, transform/opacity only.

## Component rules

### Navigation

- Two-tier behavior on small screens: wordmark/actions first row, full-width search second row.
- Search has a visible label for assistive tech, a 48px field height, and suggestions anchored below it.
- Icon controls use consistent 20px outline SVGs inside 44px targets and require accessible names.

### Buttons

- Primary: forest fill, white text, 48px minimum height.
- Accent: tomato fill, white text; only for urgent commerce actions or promotions.
- Secondary: paper surface, forest text, 1px line/forest border.
- Disabled: semantic `disabled`, 45% opacity, no pointer interaction.
- Focus: 3px mint/forest ring with a 2px offset.

### Product cards

- Image ratio 4:3 with reserved space to avoid layout shift.
- Reading order: badge → image → provenance → product name → rating → price/unit → stock/action.
- Price uses tabular/mono figures. Product names may wrap to two lines.
- Wishlist and basket actions remain separate semantic controls; do not nest buttons inside links.
- Mobile grid uses compact padding and two columns; the basket button still remains at least 44px high.

### Section heading

- Optional short kicker, Fraunces H2, one-sentence helper copy, and at most one trailing action/filter group.
- Avoid emoji prefixes in structural headings. Use consistent SVG icons only when the icon adds meaning.

### Forms and feedback

- Visible labels for all fields; placeholders are examples, not labels.
- Errors appear below the related field, explain the cause and recovery, and use `aria-describedby`/live regions as appropriate.
- Loading actions disable the initiating control and retain its width.

## Responsive behavior

- **Mobile (375px):** hero is one column; utility search occupies a full row; product grid is two columns; long filter groups scroll or wrap without clipping.
- **Tablet (768px):** hero becomes a balanced 7/5 split; product grid is three columns; section heading and controls can share a row.
- **Desktop (1024–1440px):** hero uses a 7/5 or 8/4 split; navigation stays single row; product grid is four to five columns.
- No viewport may introduce horizontal page scrolling. Text resizing to 200% must preserve essential labels and controls.

## Accessibility and quality bar

- WCAG AA text contrast: 4.5:1 minimum; UI boundaries and meaningful icons: 3:1 minimum.
- Keyboard order follows visual order. Focus indicators are never removed without a replacement.
- Decorative SVGs use `aria-hidden="true"`; icon-only controls receive an accessible name and current state where applicable.
- Do not rely on color, hover, animation, or gesture alone to communicate state.
- Respect `prefers-reduced-motion`; content must remain visible with animation disabled.
- Images use descriptive alt text, responsive sizing, and reserved dimensions.
- Verify touch targets, overflow, focus, loading/error/empty states, and reduced motion at every target width.

## Anti-patterns

- Repeated glassmorphism and blurred transparent cards.
- Emoji as navigation, status, or section icons.
- Gray-on-gray text below contrast requirements.
- Multiple competing primary CTAs in one viewport.
- Huge generic gradients, floating blobs, or arbitrary rounded cards with no content logic.
- Hover-only information, tiny action icons, or animation that shifts layout.
