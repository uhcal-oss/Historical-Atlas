"""
Desaturate land/soil to grayscale, then recolor specific map
elements (orange text, gray terrain, light details) to pale cream (#fdfab7).
"""
import numpy as np
from PIL import Image

SOURCE = "src/img/avatar/avatar_world_map.jpg"
OUTPUT = "src/img/avatar/avatar_world_map_bw.jpg"

img = Image.open(SOURCE).convert("RGB")
arr = np.array(img, dtype=np.uint8)
print(f"Loaded {arr.shape[1]}x{arr.shape[0]}")

r, g, b = arr[:,:,0].astype(np.float32), arr[:,:,1].astype(np.float32), arr[:,:,2].astype(np.float32)

def to_hsv(r, g, b):
    cmax = np.maximum(np.maximum(r, g), b)
    cmin = np.minimum(np.minimum(r, g), b)
    delta = cmax - cmin
    h = np.zeros_like(cmax)
    m = delta > 0
    idx = (cmax == r) & m; h[idx] = 60 * (((g[idx] - b[idx]) / delta[idx]) % 6)
    idx = (cmax == g) & m; h[idx] = 60 * (((b[idx] - r[idx]) / delta[idx]) + 2)
    idx = (cmax == b) & m; h[idx] = 60 * (((r[idx] - g[idx]) / delta[idx]) + 4)
    h = (h + 360) % 360
    s = np.where(cmax > 0, delta / cmax * 100, 0)
    v = cmax / 255.0 * 100
    return h, s, v

h, s, v = to_hsv(r, g, b)
total = arr.shape[0] * arr.shape[1]

# ── Step 1: Desaturate land ──────────────────────────────────────────
land_mask = (h >= 10) & (h <= 140) & (s > 10) & (v > 30) & (v < 95)
warm_red_mask = (
    ((h >= 0) & (h < 10)) | ((h > 330) & (h <= 360))
) & (s > 15) & (v > 30) & (v < 90) & (r > g * 0.7) & (r > b * 0.7)
land_mask = land_mask | warm_red_mask

land_count = np.sum(land_mask)
print(f"Land desaturated: {land_count} ({land_count/total*100:.1f}%)")

gray_luma = 0.299 * r + 0.587 * g + 0.114 * b

arr_out = arr.copy()
arr_out[land_mask, 0] = np.clip(gray_luma[land_mask], 0, 255).astype(np.uint8)
arr_out[land_mask, 1] = np.clip(gray_luma[land_mask], 0, 255).astype(np.uint8)
arr_out[land_mask, 2] = np.clip(gray_luma[land_mask], 0, 255).astype(np.uint8)

# ── Step 2: Recolor orange text/labels (HSV on arr_out) ─────────────
ro, go, bo = arr_out[:,:,0].astype(np.float32), arr_out[:,:,1].astype(np.float32), arr_out[:,:,2].astype(np.float32)
h2, s2, v2 = to_hsv(ro, go, bo)

orange_mask = (
    (h2 >= 15) & (h2 <= 50) & (s2 > 20) &
    (v2 > 60) & (v2 <= 100)
)

# ── Step 3: Recolor additional colors (color-distance on original) ──
color_targets = [
    ((154, 154, 154), 16),   # #9a9a9a
    ((162, 162, 162), 16),   # #a2a2a2
    ((219, 229, 239), 12),   # #dbe5ef
    ((245, 243, 230), 16),   # #f5f3e6
]

extra_mask = np.zeros(total, dtype=bool).reshape(arr.shape[0], arr.shape[1])
for (tr, tg, tb), thresh in color_targets:
    dist = np.sqrt((r - tr)**2 + (g - tg)**2 + (b - tb)**2)
    extra_mask |= dist < thresh

recolor_mask = orange_mask | extra_mask
recolor_count = np.sum(recolor_mask)
print(f"Pixels to recolor -> #fdfab7: {recolor_count} ({recolor_count/total*100:.1f}%)")

arr_out[recolor_mask] = [253, 250, 183]

img_out = Image.fromarray(arr_out, "RGB")
img_out.save(OUTPUT, "JPEG", quality=95)
print(f"Saved to {OUTPUT}")
