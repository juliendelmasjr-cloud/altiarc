# frame.md — Altiarc · La boutique 24/7

Brand truth for this film. Source: altiarc.fr (`/index.html`, `:root` tokens). Same universe as
`videos/altiarc-ville-iso/frame.md` (series) — this file extends it with a day/night cycle.

## Palette (by role)

| Role                         | Hex                    | Source            | Use in the film                                             |
| ---------------------------- | ---------------------- | ----------------- | ----------------------------------------------------------- |
| Background (night)           | `#0c0c0c`              | `--bg`            | Night sky, end card                                         |
| Surface                      | `#141414` / `#1e1e1e`  | `--bg2` / `--bg3` | Panels, UI cards                                            |
| Foreground                   | `#ffffff`              | `--fg`            | Wordmark, UI text on dark                                   |
| **System / chatbot**         | `#818CF8`              | `--cyan` (indigo) | The chatbot, its replies, the vitrine glow, neon at night   |
| AI glow                      | `#C084FC`              | `--violet`        | Chatbot core, typing dots (tint only)                       |
| **Value / result**           | `#c9a84c`              | `--gold`          | Rendez-vous, filled agenda slots, counters, `altiarc.fr`    |
| Question                     | `#F472B6`              | `--rose`          | Visitor question accent only (bubble tail / dot)            |

Day/night is **light, not new hues**: the day sky is the night palette lifted toward a pale
indigo-tinted grey (`#c9ccdc` → dusk `#b98a6a`-ish gold/rose glow → night `#0c0c0c`). The sun is warm
white, the moon is cool indigo-white. Two-color discipline holds: indigo = the chatbot works,
gold = value delivered, rose = a question waiting.

## Type roles

| Role    | Family     | Weights   | Video sizes                           |
| ------- | ---------- | --------- | ------------------------------------- |
| Display | Outfit     | 800 / 300 | Wordmark 176px, baseline 48px         |
| UI      | Outfit     | 400 / 600 | Bubbles 28–34px, chat panel 32–36px   |
| Data    | Space Mono | 400 / 700 | Clock, counters, labels 22–30px       |

## Shapes & motion

- Isometric orthographic camera, true iso angle, one continuous camera (no cut to another set).
- Question bubbles: white cards on day / `#1e1e1e` cards at night, radius 22px, rose tail dot.
  Reply bubbles: indigo-tinted cards with indigo border. Pills 999px.
- Easing: `power4.out` on dives/landings, `power2.inOut` on repositioning, no spring on the camera.

## Bans

- No gradient text, no neon cyan, no full-screen linear gradients (banding).
- No robot mascot with a mouth/limbs — the chatbot is a glowing bubble with two eyes, nothing more.
- No slideshow, no screensaver motion — every move carries a question to an answer to a result.
- No static end card without a held, intentional final frame.
