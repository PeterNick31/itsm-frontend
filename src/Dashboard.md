---
name: Northstar ITSM Cloud
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#434655'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#747686'
  outline-variant: '#c4c5d7'
  surface-tint: '#2151da'
  primary: '#0037b0'
  on-primary: '#ffffff'
  primary-container: '#1d4ed8'
  on-primary-container: '#cad3ff'
  inverse-primary: '#b7c4ff'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#004870'
  on-tertiary: '#ffffff'
  tertiary-container: '#006194'
  on-tertiary-container: '#b2d9ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dce1ff'
  primary-fixed-dim: '#b7c4ff'
  on-primary-fixed: '#001551'
  on-primary-fixed-variant: '#0039b5'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#cce5ff'
  tertiary-fixed-dim: '#93ccff'
  on-tertiary-fixed: '#001d31'
  on-tertiary-fixed-variant: '#004b73'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.025em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  title-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
    letterSpacing: -0.01em
  title-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: -0.005em
  body-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.02em
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-md: 1.25rem
  gutter-lg: 1.5rem
  margin: 1rem
  margin-md: 1.5rem
  margin-lg: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.875rem
  space-lg: 1.25rem
  space-xl: 1.75rem
  space-2xl: 2.5rem
---

## Brand & Style

This design system delivers a high-focus, precision-engineered enterprise experience for IT service management, incident orchestration, and DevOps workflows. Borrowing the operational clarity of developer platforms and the kinetic refinement of modern financial tools, the system balances dense operational telemetry with effortless visual respiration.

### Aesthetics & Philosophy
- **Restrained Precision:** Form strictly follows function. Visual hierarchy is established through spatial rhythm and subtle tonal shifts rather than heavy ornamental lines or drop shadows.
- **Micro-Contrast & Separation:** Clean white and light zinc workspaces framed against a deeply focused, matte dark slate sidebar navigation.
- **Utilitarian Elegance:** Information density is handled with crisp letterforms, disciplined padding scales, and muted, low-saturation status badges that avoid visual screaming while communicating urgency accurately.
- **Target Audience:** Systems engineers, IT directors, site reliability engineers, and enterprise operations teams who need cognitive calm during high-priority incidents and operational reviews.

## Colors

The palette leverages a technical balance: a disciplined spectrum of slate neutrals, paired with a calm, deliberate cobalt primary tone and a commanding midnight slate for global persistent chrome.

### Core Palette Roles
- **Primary (`#1d4ed8`):** Deep electric cobalt. Reserved for decisive primary actions, active navigation states, primary focus rings, and high-priority progress indicators.
- **Secondary (`#0f172a`):** Dense midnight slate. Anchors the persistent global sidebar, global command menu accents, and primary text elements.
- **Tertiary (`#0284c7`):** Precision sky cyan. Used exclusively for secondary metrics, real-time sync indicators, and active workflow connectors.
- **Neutral (`#64748b`):** Muted slate core. Drives balanced borders (`#e2e8f0` and `#f1f5f9`), secondary body copy, passive iconography, and micro-grid boundaries.

### Background & Surface Hierarchy
- **Canvas Base (`#f8fafc`):** Subtle cool off-white behind dynamic dashboard cards and detail canvas regions.
- **Surface Pure (`#ffffff`):** Crisp white reserved for primary interactive cards, tables, ticket sheets, and dialog surfaces.
- **Sidebar Chrome (`#090d16` to `#0f172a`):** Matte dark navy/slate surface that isolates global context from contextual work surfaces.

### Semantic & Status Application
- **Critical / P1 (`#ef4444` / Tint: `#fef2f2`):** Unresolved service outages, blocking incidents.
- **Warning / Degraded (`#f59e0b` / Tint: `#fffbeb`):** Approaching SLAs, partial degradations.
- **Success / Operational (`#10b981` / Tint: `#ecfdf5`):** Healthy systems, resolved tickets, compliant statuses.
- **Informational / In Progress (`#0ea5e9` / Tint: `#f0f9ff`):** Scheduled changes, active investigations.
*Rule: Status badges must always feature muted pastel fills paired with high-contrast text and a hairline matching border to prevent visual clutter.*

## Typography

The typography couples the welcoming geometry and confident poise of Plus Jakarta Sans for structural navigation and high-level headers with the utilitarian legibility of Inter for body text, data matrices, and UI controls.

### Structural Hierarchy & Usage
- **Display & Headlines (Plus Jakarta Sans):** Applied to view titles, metric figures, ticket identifiers, and system modal headers. Subtle negative letter-spacing ensures a contemporary, crisp punch at scale.
- **Body & Data (Inter):** Applied across all table rows, message logs, ticket descriptions, and form structures. Inter provides tall x-height and distinct numerals essential for technical telemetry.
- **Technical Monospace (JetBrains Mono):** Deployed for incident hash IDs, IP configurations, query strings, and terminal/log snippets.
- **Type Pairing Rule:** Never mix weights above 600 in data views; density is achieved through clean font size variance, subtle color weighting (`#0f172a` primary vs `#64748b` secondary), and precise tabular numbers (`font-variant-numeric: tabular-nums`).

## Layout & Spacing

The architecture operates on an 8-point base grid (with a 4-point micro-scale for compact form elements and icons), enforcing strict spatial rhythm across dashboards, split-pane triage views, and management lists.

### Layout Model
- **Persistent Global Shell:** A fixed 240px dark slate sidebar collapses to a 64px icon-only rail on compact screens. Top navigation remains minimal (48px height) housing breadcrumbs, global search, and real-time incident counters.
- **Fluid Master-Detail Layout:** Central workspace utilizes dynamic horizontal split views. The ticket queue maintains a minimum width of 380px, while detail views expand into the remaining canvas with dedicated 1.5rem margins.
- **Breakpoint Rules:**
  - **Mobile (<768px):** Sidebar converts to an off-canvas drawer. Single column stacked layout. Margins drop to `1rem` (`margin`), grid gutters to `1rem` (`gutter`).
  - **Tablet (768px - 1024px):** Collapsed sidebar rail (64px). 2-column or list-to-detail overlay transitions. Gutters at `1.25rem` (`gutter-md`).
  - **Desktop (1024px+):** Expanded sidebar, multi-column analytics grid, persistent multi-pane workspaces. Outer margins scale to `2rem` (`margin-lg`), grid gutters set to `1.5rem` (`gutter-lg`).

## Elevation & Depth

To avoid visual fatigue during long operational shifts, this design system completely eliminates heavy, muddy drop shadows. Depth and hierarchy are achieved exclusively through disciplined surface tinting, hairline dividers, and surgical ambient light.

### Depth Strategy
- **Base Level (Canvas):** Flat cool grey (`#f8fafc`).
- **Surface Level 1 (Workspaces & Panels):** Solid white (`#ffffff`) bounded by a single-pixel hairline border in `#e2e8f0`. No drop shadow.
- **Surface Level 2 (Flyouts & Dropdowns):** Solid white with a `#cbd5e1` hairline border and an ultra-subtle ambient diffusion: `0 4px 12px -2px rgba(15, 23, 42, 0.04), 0 2px 4px -1px rgba(15, 23, 42, 0.02)`.
- **Surface Level 3 (Dialogs & Critical Modals):** Pure white surface, crisp `#94a3b8` 1px outer ring, anchored by a deep backdrop overlay of `rgba(15, 23, 42, 0.4)` with a `backdrop-blur(4px)` treatment.
- **Divider Standards:** All row dividers, column boundaries, and section breaks must be strictly 1px solid using `#f1f5f9` (internal subtle) or `#e2e8f0` (external container borders). Double borders or nested card outlines are forbidden.

## Shapes

Form geometry emphasizes architectural composure. Sharp curves are avoided in favor of understated, subtle corners that feel sturdy, disciplined, and modern.

### Corner Radius System
- **Compact UI Elements (`rounded`, 0.25rem / 4px):** Applied to badges, table tags, status dots, icon containers, and form control inputs.
- **Interactive Containers (`rounded-lg`, 0.5rem / 8px):** Applied to standard buttons, dropdown menus, action cards, and ticket list rows.
- **Major Surfaces (`rounded-xl`, 0.75rem / 12px):** Applied to primary modal dialogs, dashboard metric panels, and full-screen drawer panels.
- **Fully Rounded (`rounded-full`):** Reserved exclusively for user avatars and circular real-time status pulses.

## Components

### Buttons
- **Primary:** Filled `#1d4ed8` with white text. Height: 36px (compact 32px for table actions). Font size 13px, weight 500. Hover: `#1e40af`. Active state transitions smoothly with a 1px inset boundary.
- **Secondary / Outline:** Background white, border 1px solid `#e2e8f0`, text `#0f172a`. Hover: background `#f8fafc`, border `#cbd5e1`.
- **Ghost:** Transparent background, text `#475569`. Hover: background `#f1f5f9`, text `#0f172a`.
- **Destructive:** Border 1px solid `#fee2e2`, text `#dc2626`, background `#fff`. Hover: background `#fef2f2`, border `#fca5a5`.

### Chips & Semantic Tags
- Height: 22px. Font size: 11px, weight 500, uppercase or sentence case with `0.02em` tracking.
- Border: 1px continuous hairline.
- Priority Critical: Background `#fef2f2`, border `#fecaca`, text `#991b1b`.
- Priority Low/Info: Background `#f0f9ff`, border `#bae6fd`, text `#075985`.
- Service Healthy: Background `#ecfdf5`, border `#a7f3d0`, text `#065f46`.

### Input Fields & Controls
- **Inputs:** Height: 36px. Border: 1px solid `#e2e8f0`. Background: `#ffffff`. Font: Inter 13px. Placeholder: `#94a3b8`. Focus: border color `#1d4ed8`, with an outer ring of `0 0 0 2px rgba(29, 78, 216, 0.12)`.
- **Checkboxes & Radios:** Size: 16px × 16px. Border: 1px solid `#cbd5e1`. Checked: background `#1d4ed8`, border `#1d4ed8`. Radius: 4px for checkboxes, 100% for radios.

### Data Tables & Lists
- **Table Headers:** Height: 36px. Background: `#f8fafc`. Border-bottom: 1px solid `#e2e8f0`. Text: Inter 11px, weight 600, uppercase tracking `#475569`.
- **Table Rows:** Height: 44px. Border-bottom: 1px solid `#f1f5f9`. Background hover: `#f8fafc` across the entire row. No vertical column borders.
- **Selected Row:** Background `#eff6ff`, border-left: 2px solid `#1d4ed8`.

### Cards & Surfaces
- Flat pure white background, 1px solid `#e2e8f0`.
- Padding: 16px or 20px uniform.
- No drop shadow; cards sit flush on the `#f8fafc` canvas, creating definition through border contrast.

### Sidebar Navigation
- Background: `#0f172a`. Item height: 34px. Border radius: 6px.
- Navigation links: text `#94a3b8`, 13px weight 500. Icons: 16px monochromatic stroke.
- Active Link: text `#ffffff`, background `rgba(255, 255, 255, 0.08)`. Left indicator bar in `#38bdf8` (optional highlight).