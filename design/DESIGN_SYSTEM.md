# SecureIQ RAG x edocode455 — Design System Specification

## 🎨 Theme: Pitch Black & Neon Cyber Green (`#00FF29`)

Extracted directly from the official **`@edocode455`** brand asset.

---

### 1. Color Palette Tokens

#### Base Surfaces (Black Depth)
| Token | Hex | Role | Usage |
|---|---|---|---|
| `--color-background` | `#000000` | True Pitch Black | Page canvas, main background |
| `--color-surface` | `#0A0D0A` | Primary Surface | Sidebar, table container cards |
| `--color-surface-2` | `#111712` | Secondary Surface | Input fields, table header bars, drawers |
| `--color-surface-3` | `#1A241B` | Active Interactive | Active tab rows, hover highlights |

#### Borders & Outlines
| Token | Hex | Role | Usage |
|---|---|---|---|
| `--color-border` | `#1F2E23` | Dark Green-Gray Border | Card perimeter, row dividers |
| `--color-border-light` | `#2D4232` | Elevated Outline | Hover focus rings, card hover states |
| `--color-border-accent` | `rgba(0, 255, 41, 0.4)` | Cyber Border | Active glowing tabs, modal borders |

#### Accents & Highlights (The edocode455 Green)
| Token | Hex | Role | Usage |
|---|---|---|---|
| `--color-accent` | `#00FF29` | **edocode Neon Cyber Green** | Primary action buttons, active pills, logos |
| `--color-accent-hover` | `#33FF55` | Accent Hover | Button hover, bright illumination |
| `--color-accent-muted` | `rgba(0, 255, 41, 0.12)` | Subtle Glow Chip | AI badges, status tags |
| `--color-accent-dark` | `#007F14` | Deep Cyber Green | Secondary gradients, borders |

#### Glow Effects
- **Glow Accent**: `0 0 25px -3px rgba(0, 255, 41, 0.35)`
- **Glow Accent Sub**: `0 0 12px -2px rgba(0, 255, 41, 0.25)`

#### Typography
- Primary Heading / Title: `#FFFFFF` (Pure Crisp White)
- Body / Meta: `#9CA3AF` (Refined Silver)
- Code / Monospace: JetBrains Mono / Fira Code with `#00FF29` text for CVE IDs and CVSS metrics
