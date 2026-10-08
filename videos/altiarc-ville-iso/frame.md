# frame.md — Altiarc · Ville isométrique

Brand truth for this film. Source: altiarc.fr (`/index.html` of the altiarc repo, `:root` tokens).

## Palette (by role)

| Role                         | Hex                     | Source            | Use in the film                                              |
| ---------------------------- | ----------------------- | ----------------- | ------------------------------------------------------------ |
| Background                   | `#0c0c0c`               | `--bg`            | Scene background, end card                                   |
| Surface                      | `#141414` / `#1e1e1e`   | `--bg2` / `--bg3` | Ground slab, panels, building dark faces                     |
| Foreground                   | `#ffffff`               | `--fg`            | Wordmark, primary UI text                                    |
| Muted                        | `rgba(255,255,255,.5)`  | `--muted`         | Secondary UI text                                            |
| **System / data (accent 1)** | `#818CF8`               | `--cyan` (indigo) | Data ribbons, conveyors, processing, the AI core             |
| AI glow                      | `#C084FC`               | `--violet`        | Core glow, chatbot identity (tint only)                      |
| **Value / result (accent 2)**| `#c9a84c`               | `--gold`          | Processed results, ROI, `altiarc.fr`                          |
| Friction                     | `#F472B6`               | `--rose`          | Incoming repetitive tasks only — disappears once processed   |

Two-color discipline: **indigo = the system works**, **gold = value delivered**. Rose exists only
before processing. No other hues.

## Type roles

| Role    | Family     | Weights  | Video sizes                         |
| ------- | ---------- | -------- | ----------------------------------- |
| Display | Outfit     | 800 / 300| Wordmark 168px, panel titles 44–56px |
| UI      | Outfit     | 400 / 600| Chat & panel body 30–36px           |
| Data    | Space Mono | 400 / 700| Metrics, labels, URL 22–28px        |

(Outfit and Space Mono are bundled by the renderer. Plus Jakarta Sans from the site is not used — two families only.)

## Shapes & motion

- Isometric world: orthographic camera, true iso angle (35.26° / 45°), soft key light from top-left, faces in three tones of `#1e1e1e`–`#2a2a33` tinted toward indigo.
- Radii: panels 28px, pills 999px. Borders 2px `rgba(129,140,248,.35)`.
- Easing: site `--ease-out` = `cubic-bezier(0.16, 1, 0.3, 1)` → `power4.out` on dives/landings, `power2.inOut` on repositioning legs. No spring/back on the camera.

## Bans

- No gradient text, no neon cyan, no full-screen linear gradients (banding).
- No stock-illustration clichés (robots with faces, glowing brains).
- No slideshow (each beat a fresh card) — the camera stays in one world.
- No screensaver motion — every move carries a task from intake to result.
- No static end card without a held, intentional final frame.
