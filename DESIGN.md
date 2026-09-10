---
name: Modern Ledger & EMI Tracker
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#464555'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#777587'
  outline-variant: '#c7c4d8'
  surface-tint: '#4d44e3'
  primary: '#3525cd'
  on-primary: '#ffffff'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#c3c0ff'
  secondary: '#006c49'
  on-secondary: '#ffffff'
  secondary-container: '#6cf8bb'
  on-secondary-container: '#00714d'
  tertiary: '#960014'
  on-tertiary: '#ffffff'
  tertiary-container: '#bc1d25'
  on-tertiary-container: '#ffd0cc'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffdad7'
  tertiary-fixed-dim: '#ffb3ad'
  on-tertiary-fixed: '#410004'
  on-tertiary-fixed-variant: '#930013'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.03em
  display-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.025em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.04em
  currency-display:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '800'
    lineHeight: 42px
    letterSpacing: -0.03em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  space-xxs: 0.25rem
  space-xs: 0.5rem
  space-sm: 0.75rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
  gutter-mobile: 1rem
  gutter-tablet: 1.5rem
  gutter-desktop: 2rem
  margin-mobile: 1rem
  margin-tablet: 2rem
  margin-desktop: auto
  max-content-width: 1200px
---

## Brand & Style

This design system embodies precise, trustworthy, and modern minimalism. It is engineered specifically for personal finance clarity, peer-to-peer balance reconciliation, and multi-tenor EMI tracking. The visual tone balances financial rigor with approachable clarity, eliminating the friction, cognitive overhead, and anxiety associated with tracking money, shared tabs, and recurring debts.

### Design Principles
- **Clarity Over Clutter:** Dense financial tables are distilled into generous spacing, crisp typography, and unambiguous semantic color tokens. Whitespace serves as an active structural boundary.
- **Directional Color Discipline:** Emerald and crimson are strictly reserved for directional financial balance ("You will receive" versus "You owe") and actionable confirmation states. They never bleed into general brand chrome.
- **Controlled Tactility:** Subtle dual-tone elevation—soft outer drop-shadows matched with faint internal borders—instills tangible, reliable structure to cards, transaction feeds, and breakdown modals.
- **Effortless Scalability:** Responsive components adapt fluidly from dense desktop balance sheets to streamlined one-thumb mobile ledgers.

## Colors

The palette establishes an absolute visual hierarchy anchored by neutral off-whites, balanced slates, vibrant indigo, and strictly functional credit/debit indicators.

### Color Tokens & Roles

- **Primary Accent (`#4F46E5` - Royal Indigo):** Central brand identity, primary interactive calls-to-action (e.g., "Add Expense", "Create EMI Plan"), focused input rings, and active navigation indicators. Deepened to `#4338CA` on hover.
- **Secondary / Credit Positive (`#10B981` - Crisp Emerald):** Directional balance for receivables ("You'll Receive", "Lent", positive cashflow), completed payments, and positive repayment trends. Deepened to `#059669` for contrast-critical text labels.
- **Tertiary / Debit Negative (`#EF4444` - Soft Crimson):** Directional balance for debt obligations ("You Owe", "Borrowed", overdue EMI), destructive actions, and arrears notices. Deepened to `#DC2626` for accessible text contrast.
- **Base Backgrounds:**
  - Canvas / Page background: `#F8FAFC` (Slate 50).
  - Elevated Cards / Modals / Surfaces: `#FFFFFF` (Pure White).
  - Subsurface / Inset Wells: `#F1F5F9` (Slate 100).
- **Text & Borders:**
  - Primary text: `#0F172A` (Slate 900) - Headers, balances, and critical values.
  - Secondary text: `#475569` (Slate 600) - Captions, payment timestamps, descriptions.
  - Muted / Placeholder text: `#94A3B8` (Slate 400).
  - Hairline borders: `#E2E8F0` (Slate 200).
  - Subtly tinted borders: `rgba(79, 70, 229, 0.08)` for primary-active components.

## Typography

Plus Jakarta Sans is utilized uniformly across headlines, numerical ledger readouts, data points, and body copy. Its geometric clarity and subtle warmth provide optimal readability for dense currency values and structured status logs without the sterile appearance of standard system fonts.

### Typographic Hierarchy Rules
- **Monetary Readouts:** All primary ledger numbers use tabular figure alignment (`font-variant-numeric: tabular-nums`) with heavy weights (`700` or `800`) to guarantee vertical column consistency across decimal points.
- **Currency Symbols:** Currency symbols (`$`, `€`, `£`, `₹`) align baseline-first, styled at `0.85x` the scale of the accompanying integer for refined balance.
- **Letter Spacing:** Headlines utilize tighter tracking (`-0.02em` to `-0.03em`) to anchor the eye, while uppercase auxiliary chips and data labels leverage positive letter spacing (`0.02em` to `0.04em`) to ensure legibility at micro scales.

## Layout & Spacing

This design system uses a strictly regulated 8pt grid with 4pt sub-steps (`0.25rem`) for compact tags, icons, and micro-alignments. Whitespace serves as an active visual divider, reducing the requirement for heavy horizontal rules.

### Grid & Breakpoints
- **Desktop (≥1024px):** Fixed-width centered container with a maximum width of `1200px` (or `1440px` for wide monitor views). 12-column fluid grid, `2rem` (32px) gutters, and automatic margins. Key layouts use an asymmetric 8:4 split (8 columns for ledger streams/schedules, 4 columns for balance cards, quick settlement actions, and EMI projection tools).
- **Tablet (768px – 1023px):** 8-column layout, `1.5rem` (24px) gutters, and `2rem` margins. Side panels fold below primary summaries.
- **Mobile (<768px):** 4-column layout, `1rem` (16px) gutters, and `1rem` margins. Metrics and split breakdowns shift to single-column vertical stacks or horizontal carousels with swipe snap.

## Elevation & Depth

Visual hierarchy is achieved through clean surface layering paired with ultra-diffused, cool-slate ambient shadows and hairline perimeter strokes. This avoids muddy drop shadows, ensuring a bright, high-clarity interface.

### Surface Tiers & Shadow Stack
1. **Tier 0 (Base / Canvas):** Flat `#F8FAFC`. Zero elevation.
2. **Tier 1 (Surface Cards & Transaction Tiles):** Pure white background (`#FFFFFF`), continuous perimeter hairline stroke of `1px solid #E2E8F0`, and ambient drop shadow: `0px 1px 3px rgba(15, 23, 42, 0.03), 0px 6px 16px -4px rgba(15, 23, 42, 0.05)`.
3. **Tier 2 (Floating Widgets & Hover States):** Applied on transaction card hover and sticky filter bars. Perimeter stroke transitions to `1px solid #CBD5E1`. Shadow: `0px 4px 6px -1px rgba(15, 23, 42, 0.04), 0px 12px 24px -4px rgba(15, 23, 42, 0.08)`.
4. **Tier 3 (Modals, Slide-overs & Settlement Sheets):** Highest elevation. `0px 20px 32px -8px rgba(15, 23, 42, 0.12), 0px 8px 12px -4px rgba(15, 23, 42, 0.04)` over a backdrop blur overlay (`backdrop-filter: blur(8px); background-color: rgba(15, 23, 42, 0.35)`).

### Inner Focus & Wells
- **Recessed Insets (Progress tracks, search wells):** `#F1F5F9` background with subtle inner shadow `inset 0px 1px 2px rgba(15, 23, 42, 0.04)`.

## Shapes

The design system uses a refined, rounded geometric language centered on level 2 roundedness, emphasizing soft, approachable corners without drifting into playful novelty.

### Corner Radius Standards
- **Primary Surfaces & Cards:** Standard `rounded-2xl` (`1rem` / 16px) for all primary balance metric cards, EMI trackers, and modal windows.
- **Interactive Inputs & Buttons:** Strict `rounded-xl` (`0.75rem` / 12px) for form inputs, dropdown selectors, and call-to-action buttons.
- **Pills & Chips:** Fully pill-shaped (`9999px`) for status tags, peer avatars, transaction filters, and "Receive / Owe" category badges.
- **Micro Elements:** `rounded-lg` (`0.5rem` / 8px) for table nested rows, tooltips, and checkboxes.

## Components

### Buttons
- **Primary:** Solid `#4F46E5`, white text, `rounded-xl`, height 44px (40px on mobile). Hover: `#4338CA`. Active: scale `0.99`. Subtle bottom edge highlight (`box-shadow: inset 0 1px 0 rgba(255,255,255,0.2)`).
- **Secondary (Neutral):** White surface, `1px solid #E2E8F0`, `#0F172A` label text. Hover: `#F8FAFC`, border `#CBD5E1`.
- **Soft Success ("Settle / Paid"):** Background `#ECFDF5`, text `#059669`, border `1px solid rgba(16, 185, 129, 0.2)`.
- **Soft Destructive ("Delete / Dispute"):** Background `#FEF2F2`, text `#DC2626`, border `1px solid rgba(239, 68, 68, 0.2)`.

### Balance Summary Cards
- White `rounded-2xl` surfaces with a 24px internal padding.
- **"You'll Receive" Card:** Displays secondary emerald badge, deep emerald numerical value (`#059669`), paired with an upward diagonal arrow indicator (`↗`).
- **"You Owe" Card:** Displays tertiary rose badge, deep crimson numerical value (`#DC2626`), paired with a downward diagonal arrow indicator (`↘`).
- **Net Balance Card:** Highlighted with a primary indigo accent indicator or subtle gradient boundary.

### Chips & Badges
- Fully rounded pills (`9999px`), height 24px, horizontal padding 10px, typography `label-sm`.
- **Credit / Receive Chip:** Background `#ECFDF5`, border `1px solid #A7F3D0`, text `#065F46`.
- **Debit / Owe Chip:** Background `#FEF2F2`, border `1px solid #FECACA`, text `#991B1B`.
- **EMI Status Chip (Active / Upcoming):** Background `#EEF2FF`, border `1px solid #C7D2FE`, text `#3730A3`.

### Transaction & Ledger Items
- Clean horizontal row layout with `0.75rem` vertical spacing.
- Left: 40px rounded avatar or category icon tile in soft slate/neutral fill (`#F1F5F9`).
- Center: Counterparty name (`label-lg`), payment note, and relative timestamp (`body-sm` in slate 500).
- Right: Monetary readout (`tabular-nums font-bold`) colored dynamically in `#059669` (with a leading `+`) or `#DC2626` (with a leading `-`).

### EMI Progress & Schedule Bars
- Dedicated EMI items display an instalment counter (e.g., `Installment 4 of 12`).
- Track: 6px tall, `#E2E8F0` rounded track with a smooth animated fill in `#4F46E5`.
- Due date chips shift dynamically to amber (`#D97706`) within 3 days of maturity, and soft crimson (`#DC2626`) if overdue.

### Form Inputs
- Height 44px, `rounded-xl`, border `1px solid #CBD5E1`, background `#FFFFFF`.
- Focus state: Outline `2px solid #4F46E5` with `2px` focus ring offset.
- Numeric amount inputs feature a fixed, bold prefix symbol anchored on the left with secondary label typography.

### Checkboxes & Radios
- Size 20x20px, `rounded-md` (checkbox) or `rounded-full` (radio).
- Active state: `#4F46E5` fill with crisp white checkmark icon; neutral state: `1.5px solid #CBD5E1`.