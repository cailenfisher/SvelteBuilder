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

The [semantic layer is where token architectures most commonly fail](https://productrocket.ro/articles/design-tokens-guide/). Teams get primitives right (they are just a list of values) and component tokens right (they map directly to code), but semantic tokens require articulating the *why* behind each decision. When teams skip this layer, a brand change touches hundreds of tokens instead of a handful. **SvelteBuilder owns the semantic and component layers internally (in coreui's `_internal.css`). Consuming projects configure the public tokens only.**

### Accessibility makes the semantic layer mandatory, not optional

Dark mode and high-contrast themes are the practical forcing function for a semantic layer even in projects that do not initially plan for them. Enterprise clients with accessibility requirements — WCAG AA compliance, high-contrast mode — get zero-extra-token support when the semantic layer is in place, and a significant rewrite when it is not. In SvelteBuilder, dark mode is an outcome of the semantic layer with no changes in component code, and high-contrast mode is meant to work the same way once it is built. Default token values are chosen for WCAG AA contrast; automated verification waits on the planned accessibility audit.

---

## SvelteBuilder CoreUI Token Surface

The following table is the **configurable token surface**: what a consuming project sets. It is
defined in `@sveltebuilder/coreui/styles/tokens.css`. Everything derived from these lives in
`_internal.css` and is not part of the public API.

| Category | Token | Purpose |
|---|---|---|
| **Brand** | `--brand` | Primary interactive and action color, and the focus ring. Hover, active, soft-tint and text variants are derived with `color-mix()`. |
| **Neutral** | `--chrome` | The single neutral reference. Light-mode surfaces, borders, and every text shade are mixed from it toward white or black. |
| **Status** | `--danger` | Destructive actions, errors |
| | `--warning` | Caution indicators |
| | `--success` | Confirmation, positive states |
| | `--info` | Informational, neutral alerts |
| **Typography** | `--font` | Body and UI text |
| | `--font-mono` | Code, IDs, reference values |
| | `--font-size-base` | Root font size, set on `<html>`; the rem-based type scale follows it |
| | `--leading-base` | Root line height |
| **Shape** | `--radius` | Single corner radius; stepped variants are computed from it |

That is **11 configurable tokens**. This is deliberately smaller than the roughly 25 an earlier
draft of this document proposed. A single `--brand` and a single `--chrome` replace hand-picked
`-subtle` pairs and a six-step neutral ramp: `color-mix()` derives the tints, so a team sets one
color per role instead of keeping several values in step with each other. Each status color gets
`-soft`, `-text`, `-border`, `-hover` and `-fg` variants the same way.

---

## Architectural Requirements

1. **The derived layer is internal to `@sveltebuilder/coreui` and is not part of its public API.** Consuming projects configure the 11 tokens only. Assigning derived tokens (`--brand-hover`, `--surface-raised`, `--text-soft`, and so on) is unsupported; reading them in application CSS is fine.

2. **No token is added without a concrete component use case.** The configurable surface grows when a component requires it, not speculatively. Every token in the public surface must be referenced by at least one component in the library.

3. **All default token values must meet WCAG AA contrast.** This applies to each status color as text, white on `--brand` and on solid status fills, and text on the derived `-soft` backgrounds. It is not yet checked automatically; verification is part of the planned WCAG 2.2 AA audit. Teams that override defaults are responsible for checking their own contrast.

4. **Dark mode is driven entirely by the derived layer.** Under `prefers-color-scheme: dark`, or `data-color-scheme="dark"` on an ancestor, `_internal.css` swaps surfaces, borders and text to a dark palette and re-tints the brand and status variants. No component contains theme-conditional styling: a theme switch is a token swap, and component code does not know which theme is active. High-contrast mode is not built yet and should follow the same mechanism.

5. **`--radius` is a single value.** `_internal.css` computes stepped variants (`--radius-sm`, `--radius-lg`, `--radius-xl`, `--radius-2xl`) as multiples of it, but the customization surface exposes one knob. Multi-radius systems are not a goal.

6. **Spacing is a fixed internal scale, not a public token.** Components use the `--space-*` steps (multiples of 4px) and never hard-code margin or padding values. Density is not configurable yet. If a real need appears, the remedy is a single public unit the scale derives from, not per-step overrides.

7. **Tokens are plain CSS custom properties.** There is no build step and no token pipeline. Exporting to non-web targets (for example through Style Dictionary) is not a current goal. If it becomes one, the 11 public tokens are the surface to export.
