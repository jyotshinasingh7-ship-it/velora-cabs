# Velora UI Context

Last verified: 2026-07-17

> **Do not redesign or replace the current visual system without explicit owner approval.**

## Brand and assets

- Navigation uses “Velora Mobility”; metadata/package also use “Velora Cabs.” Tagline: “Premium rides, every mile.”
- Primary logo is `/images/logo.png`; `/logo.png` also exists. Fleet images cover airport, corporate, e-rickshaw, premium, sedan, SUV, and tempo.
- Lucide supplies icons; Framer Motion supplies page/section motion.

## Visual system

- Dark near-black/navy foundation: `#05070c`, `#050816`, surfaces `#0b1018`, `#111827`, and `#080b11`.
- Primary accent: amber/gold `#fbbf24` and Tailwind `amber-400/300`; occasional blue radial glow.
- Semantic accents include emerald success, red danger, and amber warning.
- Backgrounds use subtle radial gradients, translucent white layers, borders, blur, and deep shadows.
- Typography is Geist with Geist Mono available. Headings commonly use bold/black weights, white text, amber spans, uppercase micro-labels, and wide tracking.
- Corners favor `rounded-xl`, `rounded-2xl`, and larger hero/card radii. Cards use `border-white/10`, `bg-white/[0.03–0.06]`, blur, and shadow.
- Spacing uses centered `max-w-7xl` containers, responsive `px-4 sm:px-6 lg:px-8`, generous section padding, and compact dashboard grids.

## Components and patterns

- Primary buttons are amber with black bold text; secondary buttons use translucent dark surfaces and light borders. Destructive actions use restrained red surfaces.
- Inputs use the shared `.field-input`: 3.5rem minimum height, 1rem radius, dark translucent fill, white text, and amber focus border.
- Badges are compact pills with semantic translucent colors.
- Modals/panels use dark elevated surfaces, viewport-aware layouts, backdrop blur, and rounded corners.
- Admin tables/cards favor dense operational information with shared headers/search controls.
- Feedback generally appears inline through status/error/success blocks rather than browser alerts.

## Major areas

- **Navbar:** fixed 80px desktop header, logo/brand, anchor and route links, Earn With Us dropdown, phone CTA, auth controls, and full-height mobile drawer. Scroll state adds an opaque blurred surface.
- **Footer/homepage:** dark marketing sections composed from Hero, Services, Fleet, WhyChooseUs, TrustBadges, Stats, Corporate, Testimonials, FAQ, and Contact.
- **Customer dashboard:** responsive cards for profile, booking stats, active booking/lifecycle, history, payment/rating, and notification bell.
- **Driver dashboard:** sidebar/topbar, operational cards, online state, live map, incoming request popup/countdown, ride lifecycle controls, notification bell, and ride-alert controls.
- **Admin portal:** fixed 72-width desktop sidebar, header, dark content workspace, and five-item bottom navigation on mobile.
- **Onboarding:** existing dark cards and field styling with inline validation/status states; no upload controls.
- **Booking:** form and map layout, Places suggestion overlays, route/fare state, amber actions, and responsive stacking.
- **Notifications:** bell count plus dark dropdown/panel, newest-first items, read controls, timestamps, types, and local action links.
- **Ride alert:** visible request remains primary; sound is optional and user-enabled with enable, sound toggle, and test controls.
- **Post-ride payment shell:** a completed unpaid/ambiguous ride remains visible in the customer dashboard. The existing dark/gold payment card shows the locked paise breakdown, payment/settlement state, selected-method styling, and a disabled truthful provider boundary. Corporate postpaid shows “Billed to company”; legacy ambiguity shows review required. No commission or driver-wallet internals are exposed.

## Responsive and accessibility expectations

- Body minimum width is 320px. Desktop navigation switches at `lg`; major grids stack on smaller screens.
- Global `focus-visible` uses a 2px amber outline; reduced-motion media query minimizes animation/transitions.
- Icon-only buttons need labels; forms need associated labels; live errors/status should use suitable ARIA roles.
- Preserve usable Places z-index above maps, viewport-fit modals, scrollable admin/mobile navigation, and no horizontal overflow.

## Known risks and inconsistencies

- Brand naming alternates between Velora Mobility and Velora Cabs.
- Several large client pages have dense inline styling and may differ subtly in spacing/error conventions.
- Admin mobile bottom navigation exposes only a subset of routes.
- Runtime checks at 320/375/390/768/1024 widths are not evidenced.
- Keyboard/focus behavior for custom dropdowns, Maps autocomplete, and ride modals needs verification.
- Some starter SVG assets may be unused; no removal is authorized.
- The ride sound asset format/playback needs browser verification.
- The Unit 003A post-ride payment shell is locally built but still requires authenticated Preview browser verification; public staging configuration is fixed, while remote Preview build evidence remains pending because the local Windows Vercel adapter cannot package otherwise-valid static route output.

These observations are documentation only and are not authorization to redesign or perform unrelated cleanup.
