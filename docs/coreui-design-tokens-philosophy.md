# CoreUI Design Token Philosophy

## Assertion

Enterprise and corporate web application teams require a **small, disciplined set of design tokens** — not a comprehensive utility-scale token library. The tokens they will actually configure in practice are limited to brand color, semantic status colors, a typographic scale, border radius, and a baseline spacing unit. A library that exposes hundreds of tokens shifts the burden of coherence onto consuming teams, which is the opposite of what a scaffold project should do.

---

## Evidence

### Token bloat is a documented, widespread failure mode

A [2023 analysis by Supernova](https://productrocket.ro/articles/design-tokens-guide/) found that **42% of design system teams reported "token bloat" as their top maintenance challenge**, with the average enterprise system containing over 2,000 tokens. The same research is unambiguous about the remedy: more tokens is not better. Every token is a decision that must be maintained, documented, and communicated. Systems should start with fewer tokens than seem necessary and add them only when a concrete use case demands one.

A [real-world account of white-label system drift](https://www.webmastered.com/blog/white-label-design-system-debt-theming-customization/) illustrates the pattern clearly: twelve tokens power a typical white-label theme at launch — brand colors, a font stack, spacing units, border radii. By the time the fifteenth client goes live on the same system, the token count has surpassed 200, and no one on the team can confidently explain what half of them control. **The only protection against this drift is controlled scope at launch.**

### What enterprise B2B teams actually configure

The customization surface enterprise clients will use is narrow by nature. [Research on enterprise UX](https://bricxlabs.com/blogs/enterprise-ux-design) notes that even simple color changes typically require approval from security, branding, and accessibility teams — which is why enterprise design evolves more slowly than consumer interfaces. Teams are not exploring a broad palette; they are anchoring to a brand standard and verifying contrast.

[Accessible color token guidance for enterprise systems](https://www.aufaitux.com/blog/color-tokens-enterprise-design-systems-best-practices/) confirms that B2B executive dashboards rely on sober, stable tones — slate, navy, controlled accents — to signal clarity and control. The emotional landscape is narrow, and the design decisions that flow from it are correspondingly constrained.

**A concrete multi-brand example:** a 2024 project building a shared component library for four distinct brands used [a single JSON file of approximately 60 primitive tokens](https://productrocket.ro/articles/design-tokens-guide/) per brand, with the entire component library shared unchanged across all four. That figure includes a full color ramp with shading steps. The semantic and component layers above the primitives were architectural — not part of the customization surface at all.

### The three-tier architecture earns its keep even at small scale

The [W3C Design Tokens Community Group specification](https://tr.designtokens.org/format/) and nearly every mature implementation use a three-tier hierarchy: **primitive → semantic → component**. The architecture is not about complexity for its own sake — it is what makes a brand swap work as a single config change rather than touching hundreds of tokens.

[Feature-Sliced Design's token guidance](https://feature-sliced.design/blog/design-tokens-architecture) frames the minimal viable semantic set as: text, surfaces, borders, primary action, and states — the 20% of tokens that drive 80% of UI. This is the scope that SvelteBuilder targets.

The [semantic layer is where token architectures most commonly fail](https://productrocket.ro/articles/design-tokens-guide/). Teams get primitives right (they are just a list of values) and component tokens right (they map directly to code), but semantic tokens require articulating the *why* behind each decision. When teams skip this layer, a brand change touches hundreds of tokens instead of a handful. **SvelteBuilder owns the semantic and component layers internally. Consuming projects configure primitives only.**

### Accessibility makes the semantic layer mandatory, not optional

Dark mode and high-contrast themes are the practical forcing function for a semantic layer even in projects that do not initially plan for them. Enterprise clients with accessibility requirements — WCAG AA compliance, high-contrast mode — get zero-extra-token support when the semantic layer is in place, and a significant rewrite when it is not. SvelteBuilder ships all default token values with verified WCAG AA contrast, and dark mode and high-contrast are first-class outcomes of the semantic layer with no changes required in component code.

---

## SvelteBuilder CoreUI Token Surface

The following table defines the **configurable primitive token surface** — what a consuming project sets. All semantic and component tokens derived from these are internal to `sveltebuilder-coreui` and are not part of the public API.

| Category | Token(s) | Purpose |
|---|---|---|
| **Brand** | `--color-brand` | Primary interactive and action color |
| | `--color-brand-subtle` | Tint for hover states and brand-tinted backgrounds |
| **Neutral** | `--color-neutral-50` | Near-white surface |
| | `--color-neutral-100` | Light background, zebra rows |
| | `--color-neutral-200` | Borders, dividers |
| | `--color-neutral-400` | Placeholder text, disabled states |
| | `--color-neutral-700` | Secondary text |
| | `--color-neutral-900` | Primary text |
| **Status** | `--color-danger` | Destructive actions, errors |
| | `--color-danger-subtle` | Error background, inline error fields |
| | `--color-warning` | Caution indicators |
| | `--color-warning-subtle` | Warning background |
| | `--color-success` | Confirmation, positive states |
| | `--color-success-subtle` | Success background |
| | `--color-info` | Informational, neutral alerts |
| | `--color-info-subtle` | Info background |
| **Typography** | `--font-family-base` | Body and UI text |
| | `--font-family-mono` | Code, data, reference values |
| | `--font-size-base` | Root font size (rem anchor) |
| | `--font-scale` | Type scale ratio (e.g. 1.25 Major Third) |
| **Shape** | `--radius-base` | Single border-radius value used across the app |
| **Density** | `--space-unit` | Base spacing unit (default: 4px); all spacing is multiples |
| **Accessibility** | `--color-focus-ring` | Keyboard focus indicator |
| | `--shadow-card` | Elevation for cards and overlays |

This is approximately **25 configurable primitives**. All spacing, sizing, and interactive variants are derived from these in the semantic layer.

---

## Architectural Requirements

1. **The semantic and component layers are internal to `sveltebuilder-coreui` and are not part of its public API.** Consuming projects configure primitive tokens only. Direct overrides of semantic or component tokens are unsupported.

2. **No token is added without a concrete component use case.** The configurable surface grows when a component requires it, not speculatively. Every token in the public surface must be referenced by at least one component in the library.

3. **All default token values must ship with verified WCAG AA contrast.** Status color pairs (e.g. `--color-danger` on white, `--color-danger-subtle` as a background with dark text) are validated at build time. Consuming teams that override defaults are responsible for their own contrast verification.

4. **Dark mode and high-contrast mode are driven entirely by the semantic layer.** No component-level conditional styling for themes is permitted. A theme switch is a token swap; component code does not know or care which theme is active.

5. **`--radius-base` is a single value.** Components may compute stepped variants (`calc(var(--radius-base) * 0.5)`, etc.) internally, but the customization surface exposes one knob. Multi-radius systems are not a goal.

6. **`--space-unit` is the sole spacing primitive.** All internal spacing is expressed as multiples of this unit. No component hard-codes a pixel value for margin or padding.

7. **The token system is platform-agnostic in format.** Primitives are defined in a format consumable by Style Dictionary or equivalent tooling, enabling future output to non-web targets without architectural changes.
