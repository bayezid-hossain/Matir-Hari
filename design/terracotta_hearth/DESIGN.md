# Design System Document: The Artisanal Interface

## 1. Overview & Creative North Star
**Creative North Star: "The Modern Heirloom"**

This design system rejects the "fast-food" aesthetic of bright, synthetic colors and rigid, boxed grids. Instead, it draws inspiration from the tactile nature of Bengali pottery and the rhythmic, organic flow of Mymensingh’s heritage. We are building a "Modern Heirloom"—an interface that feels as grounded as an earthen pot (*Matir Hari*) but functions with the frictionless precision of high-end editorial digital products.

To break the "template" look, designers must embrace **Intentional Asymmetry**. Hero images should bleed off-edge, and typography should utilize high-contrast scales (pairing massive display type with petite, wide-tracked labels) to create a sense of curated space rather than a packed list.

---

## 2. Colors: The Earth & The Kiln
Our palette is rooted in the physical materials of the craft. 

### Core Palette
- **Primary (#902d13):** Deep Terracotta. Used for moments of high intent.
- **Secondary (#795900):** Warm Ochre. Used for prestige elements and "Trust Score" indicators.
- **Surface (#fbf9f5):** The "Soft Off-White." This is our canvas; it should feel like sun-dried clay.

### The "No-Line" Rule
**Explicit Instruction:** Do not use 1px solid borders to section content. Boundaries must be defined solely through background color shifts. A `surface-container-low` section sitting on a `surface` background provides all the separation needed. If the UI feels "blurry," increase the contrast between surface tiers, do not add a line.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. 
- **Base:** `surface` (#fbf9f5)
- **Nested Content:** Use `surface-container-low` (#f5f3ef) for secondary information.
- **Elevated Interaction:** Use `surface-container-highest` (#e4e2de) for active card states.

### The "Glass & Gradient" Rule
To add "soul," avoid flat terracotta blocks. Use a subtle linear gradient from `primary` (#902d13) to `primary_container` (#b14529) at a 135-degree angle for main CTAs. For floating headers, apply a backdrop-blur (12px to 20px) over a semi-transparent `surface` color to create a "frosted glass" effect that lets food photography bleed through softly.

---

## 3. Typography: Editorial Authority
We utilize a dual-font strategy to balance heritage with readability.

- **Display & Headlines (Plus Jakarta Sans):** A modern sans-serif with geometric leanings. Use `display-lg` (3.5rem) for promotional headers to create an editorial, magazine-like feel.
- **Body & UI (Be Vietnam Pro):** A highly legible, clean sans-serif designed for small-screen density. 

**Hierarchy Strategy:**
- **Title-LG (1.375rem):** Use for dish names.
- **Label-SM (0.6875rem):** Use for "Trust Score" or "Authenticity" markers, always in All-Caps with 0.05rem letter spacing to elevate the brand's premium feel.

---

## 4. Elevation & Depth: Tonal Layering
Traditional shadows are often "dirty." In this system, we use light and tone.

- **The Layering Principle:** Achieve depth by stacking. Place a `surface-container-lowest` card on a `surface-container-low` background. This creates a "soft lift" without a single drop shadow.
- **Ambient Shadows:** For floating action buttons or high-priority food cards, use a diffused shadow: 
  - `box-shadow: 0 12px 32px rgba(144, 45, 19, 0.08);` 
  - *Note: The shadow is tinted with our Primary color, not black.*
- **The "Ghost Border" Fallback:** If a border is required for accessibility, use `outline-variant` (#dac1b8) at 20% opacity. It should be felt, not seen.

---

## 5. Components: Tactile & Purposeful

### Buttons: The "Kiln-Fired" CTA
- **Primary:** Gradient fill (`primary` to `primary-container`), `md` (0.75rem) rounded corners. Text in `on-primary`.
- **Secondary:** Surface-only with a `primary` label. No border.
- **Sizing:** Minimum height of 56px for mobile ergonomics.

### Cards: Photography-First
- **Rule:** Forbid divider lines within cards. Use `spacing-4` (1rem) of vertical white space to separate the dish title from the price.
- **Visuals:** Food must be shot in *Matir Hari* (earthen pots). Use an image ratio of 4:3 with `md` (0.75rem) corner radius.

### Trust Score Indicators (Signature Component)
- **Visual Style:** Use the `secondary` (Ochre) scale. 
- **Construction:** A small, circular progress ring using `secondary` and `secondary-fixed-dim`. This mimics the golden-brown hue of perfectly fired pottery.

### Input Fields
- **Style:** Understated. Use `surface-container-high` as the background fill. No border unless focused. Upon focus, a 2px `primary` bottom-border animates from the center.

---

## 6. Do’s and Don’ts

### Do:
- **Use High-Quality Imagery:** The system relies on the rich textures of traditional Bengali food. Flat, clip-art style icons are strictly prohibited.
- **Embrace White Space:** Use the `spacing-8` (2rem) and `spacing-10` (2.5rem) tokens generously between sections to maintain a "premium" feel.
- **Nester Tiers:** Use `surface-container-lowest` for the most important cards to make them "pop" against a `surface-container-low` background.

### Don’t:
- **No Pure Black:** Never use #000000. Use `on-surface` (#1b1c1a) for text to maintain a soft, organic warmth.
- **No Hard Shadows:** Avoid shadows with low blur and high opacity. They break the "Modern Heirloom" aesthetic.
- **No Standard Grids:** Avoid perfectly centered, symmetrical layouts in Hero sections. Offset the text to the left and let the earthen pot imagery occupy the right/bottom-right bleed.