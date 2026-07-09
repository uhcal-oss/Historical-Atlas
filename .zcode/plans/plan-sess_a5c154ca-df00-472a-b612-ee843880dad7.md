# Mobile UI improvements — both pages

## Landing page (`src/index.html` + `src/styles/index.css` + `src/styles/index.scss`)

### 1. Fix viewport meta tag
- Add `width=device-width` and remove `user-scalable=no` (accessibility)
- **File:** `src/index.html:7`

### 2. Fix container overflow for tablets (500–999px gap)
- Add `max-width: 100%` to `#index-page-content` base rule
- Fix `border-radius: none` → `border-radius: 0` in the 900px media query
- **File:** `src/styles/index.css` (base rules + 900px breakpoint)

### 3. Restore login/register on mobile (replace hide with a compact layout)
- Remove `#connexion-registration-div { display: none !important }` from 500px breakpoint
- At ≤500px: stack header vertically (flex-direction: column), shrink login buttons to fit
- **File:** `src/styles/index.css` (500px media query)

### 4. Improve map table on mobile
- Add `text-overflow: ellipsis; white-space: nowrap` to `.title-column` so clipped titles show "..." instead of hard cutoff
- **File:** `src/styles/index.css` (base `.title-column` rule + 500px overrides)

### 5. Clean up duplicate/conflicting rules in 500px breakpoint
- Remove the first declarations that are immediately overridden (`.map-frame`, `.iframe-publicmap`, `.link-frame`, `#index-page-content`)
- Keep only the effective final values
- **File:** `src/styles/index.css` (500px media query)

### 6. Mirror all changes to SCSS
- **File:** `src/styles/index.scss`

---

## Map editor (`src/histoAtlas.html` + `src/histoAtlas.css` + `src/timeSlider.css`)

### 7. Add viewport meta tag (critical — currently missing entirely)
- Add `<meta name="viewport" content="width=device-width, initial-scale=1">` to `<head>`
- **File:** `src/histoAtlas.html`

### 8. Add responsive media queries to `histoAtlas.css`
New `@media (max-width: 700px)` block:

- **Layers panel** (currently 250px min-width → would eat entire phone screen):
  - Reduce `min-width` to `170px`, `max-height` to `50vh`
  - Shrink `.layers-list-line-select` to `160px`
  - Shrink `.layers-list-input-text` to `130px`

- **Background panel** (currently 200px min-width):
  - Reduce `min-width` to `150px`

- **Time slider** (currently fixed 300px → overflows phones):
  - Set `width: calc(100vw - 160px)` so it fits between controls
  - Stack time control vertically if needed

- **Action toolbar buttons** (currently 20×20px inline → too small to tap):
  - Override inline image size to `28×28px` via `.leaflet-touch .action-button img`
  - Enlarge `.leaflet-bar a` to `36×36px` in touch context

- **Popup textarea** (currently fixed 420px → overflows):
  - Set `max-width: 90vw; width: auto`

- **Properties control buttons** (currently 200px):
  - Set `width: auto; min-width: 140px`

### 9. Add responsive rules to `timeSlider.css`
New `@media (max-width: 700px)`:
- `.time-slider { width: calc(100vw - 180px); }` (was fixed 300px)

---

## Files modified (total: 6)
| File | Changes |
|---|---|
| `src/index.html` | Viewport meta fix |
| `src/styles/index.css` | Container fix, login restore, ellipsis, cleanup duplicates |
| `src/styles/index.scss` | Mirror CSS changes |
| `src/histoAtlas.html` | Add viewport meta |
| `src/histoAtlas.css` | New 700px media query with all responsive rules |
| `src/timeSlider.css` | New 700px media query for slider width |

No JS changes needed — all fixes are HTML + CSS only.

## Bump cache-busters
- `?v=10` → `?v=11` on `histoAtlas.css`, `timeSlider.css`, and `index.css` references