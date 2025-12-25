# ⚡ SportPulse Design System: Master Specification

This document outlines the **"Liquid Kinetic"** design language. The application must strictly adhere to these constants to ensure brand consistency across all platforms.

---

## 1. Core Visual Identity

The interface simulates a deep, viscous digital environment where glass layers float above moving energy sources.

### 🎨 Color Palette (Dark Mode Default)

| Token | Hex Code | Reference Variable | Usage |
| :--- | :--- | :--- | :--- |
| **Background** | `#000000` | `colors.background` | Main page background. |
| **Electric Indigo** | `#4b29ff` | `colors.brand.indigo` | Primary active states, deep ambient glows. |
| **Acid Lime** | `#deff90` | `colors.brand.lime` | **Primary CTA**, "Pro" accents, high-contrast highlights. |
| **Surface** | `#09090b` | N/A | Base color for glass cards (90% opacity). |
| **Neon Purple** | `#bd00ff` | `colors.neon.purple` | Secondary accents, gradients. |

### ✒️ Typography

#### 1. Display Font: `Bayon`
*   **CSS Class:** `font-display`
*   **Usage:** Headings (`h1`-`h6`), Buttons, Badges, Stat Numbers.
*   **Characteristics:**
    *   Uppercased (usually).
    *   `tracking-wide` or `tracking-tight` depending on size.
    *   Effect: Often paired with `drop-shadow` or `text-transparent bg-clip-text`.

#### 2. Body Font: `Inter` (or `Outfit`)
*   **CSS Class:** `font-sans`
*   **Usage:** Paragraphs, inputs, metadata.
*   **Characteristics:** Clean, high legibility. Text colors are usually `text-white` (100%), `text-white/60` (Secondary), `text-white/40` (Tertiary).

---

## 2. Component Physics ("The Glass System")

Components are not solid; they are manipulators of the background light.

### 🪟 Glass Card (`GlassCard`)
*   **Base:** `backdrop-filter backdrop-blur-[40px]`
*   **Color:** `bg-[#09090b]/90` (Heavy dark glass) or `bg-white/5` (Light glass).
*   **Border:** `border border-white/10`.
*   **Radius:** `rounded-[32px]` (Super-ellipse).
*   **Shadow:** `shadow-[0_8px_32px_0_rgba(0,0,0,0.6)]` (Deep diffusion).
*   **Inner Light:** `shadow-[inset_0_0_40px_rgba(255,255,255,0.02)]`.

### 🔘 Glass Button (`GlassButton`)
*   **Primary (Action):**
    *   Bg: `bg-brand-lime` (#deff90).
    *   Text: `text-black` (High contrast).
    *   Font: `Bayon` (Display).
    *   Glow: `shadow-[0_0_30px_rgba(222,255,144,0.3)]`.
*   **Secondary (Ghost/Glass):**
    *   Bg: `bg-[#18181b]/90`.
    *   Border: `border border-white/20`.
    *   Text: `text-white`.

### 🧬 Atmospheric Layers
The application **must** implement these two layers in `z-index: 0`:

1.  **Kinetic Blobs:**
    *   Two or three large (`w-[600px]+`), blur-heavy (`blur-[100px]`) circles.
    *   Colors: Indigo (`#4b29ff`) and Lime (`#deff90`).
    *   Animation: `animate-blob` (15s infinite float).
    *   Blend Mode: `mix-blend-screen`.
2.  **Noise Texture:**
    *   SVG Fractal Noise filter.
    *   Opacity: `0.04` (4%).
    *   Blend Mode: `mix-blend-overlay`.
    *   CSS: `.bg-noise`.

---

## 3. Motion & Animation

*   `animate-blob`: Moves elements in a slow triangle path (0,0) -> (50,-80) -> (-40,40).
*   `animate-slide-up`: `translateY(40px)` to `0` with fade-in (0.8s cubic-bezier). Used for all entering content.
*   `animate-pop`: Scale 0.9 to 1 with bounce. Used for badges/icons.
*   `animate-pulse-slow`: 4s gentle opacity fade. Used for background glows.
*   `animate-marquee`: Linear scrolling for infinite lists (e.g., sports pills).

---

## 4. Application Structure Blueprint

The application should narratively unfold the app's core features using the design tokens above.

### Section 1: Splash & Loading
*   **Centerpiece:** The "Pulse Orb" Logo (from `Splash.tsx`).
    *   *Construction:* 3 layers of gradients, rotation, and icons floating.
*   **Typography:** "SportPulse" title in `Bayon` font.
*   **Animation:** 4-stage kinetic animation (trails → impact → stable → exit).

### Section 2: "The Swipe" (Matching)
*   **Visual:** Render the `ProfileCard` (from `Home.tsx`).
*   **Effect:** Tilt effect or floating animation (`animate-float`) to simulate the 3D card stack.
*   **Copy:** "Find your training partner."

### Section 3: "AI Coach" (Intelligence)
*   **Visual:** A glass chat bubble (from `Chat.tsx`) showing a workout plan.
*   **Palette:** Shift background blobs to deep Indigo/Purple to signify "Intelligence/AI".
*   **Icon:** `Bot` or `Sparkles` in `text-brand-lime`.

### Section 4: "Tribes" (Community)
*   **Visual:** Map pins popping up (from `Map.tsx`).
*   **Copy:** "Join Clubs. Dominate Local Spots."

### Section 5: Footer/Navigation
*   Simple glass bar.
*   5 tabs: Home, Matches, Map, Chat, Profile.

---

## 5. Technical Implementation Notes

*   **Icons:** Use `lucide-react` with `strokeWidth={1.5}` for elegance, or `2.5` for active states.
*   **Gradients:** Use `bg-gradient-to-br` heavily.
*   **Dark Mode:** Force Dark Mode styles (Application is primarily dark).
*   **Accessibility:** Support `prefers-reduced-motion` for animations.
*   **Mobile First:** Design for 375px width first, then scale up.

---

## 6. Brand Guidelines

### Logo Usage
*   Primary: `/logo.png` (PNG format)
*   Fallback: Text-based "SportPulse" with display font

### Taglines
*   Primary: "Find your match"
*   Secondary: "Train together. Grow together."
*   App Store: "The Ultimate Sports Community App"

### Sports Focus
*   24 supported sports from Tennis to Climbing
*   Icon-first representation with lucide-react icons
