"""
Desaturate only the land/soil areas of the Avatar world map.
Then recolor orange text/labels (#f6a147) to pale cream (#fdfab7).
"""
import numpy as np
from PIL import Image

SOURCE = "src/img/avatar/avatar_world_map.jpg"
OUTPUT = "src/img/avatar/avatar_world_map_bw.jpg"

img = Image.open(SOURCE).convert("RGB")
arr = np.array(img, dtype=np.uint8)
print(f"Loaded {arr.shape[1]}x{arr.shape[0]}")

# Normalize RGB to 0-1 for calculations
r, g, b = arr[:,:,0].astype(np.float32), arr[:,:,1].astype(np.float32), arr[:,:,2].astype(np.float32)

# Compute HSV manually (faster than colorsys for full image)
cmax = np.maximum(np.maximum(r, g), b)
cmin = np.minimum(np.minimum(r, g), b)
delta = cmax - cmin

# Hue
h = np.zeros_like(cmax)
mask = delta > 0
idx = (cmax == r) & mask
h[idx] = 60 * (((g[idx] - b[idx]) / delta[idx]) % 6)
idx = (cmax == g) & mask
h[idx] = 60 * (((b[idx] - r[idx]) / delta[idx]) + 2)
idx = (cmax == b) & mask
h[idx] = 60 * (((r[idx] - g[idx]) / delta[idx]) + 4)
h = (h + 360) % 360

# Saturation
s = np.where(cmax > 0, delta / cmax * 100, 0)

# Value
v = cmax / 255.0 * 100

# ── Step 1: Desaturate land/soil ──────────────────────────────────
land_mask = (
    (h >= 10) & (h <= 140) & (s > 10) &
    (v > 30) & (v < 95)
)

warm_red_mask = (
    ((h >= 0) & (h < 10)) | ((h > 330) & (h <= 360))
) & (s > 15) & (v > 30) & (v < 90) & (r > g * 0.7) & (r > b * 0.7)

land_mask = land_mask | warm_red_mask

land_count = np.sum(land_mask)
total = arr.shape[0] * arr.shape[1]
print(f"Land pixels to desaturate: {land_count} ({land_count/total*100:.1f}%)")

gray = 0.299 * r + 0.587 * g + 0.114 * b

arr_out = arr.copy()
arr_out[land_mask, 0] = np.clip(gray[land_mask], 0, 255).astype(np.uint8)
arr_out[land_mask, 1] = np.clip(gray[land_mask], 0, 255).astype(np.uint8)
arr_out[land_mask, 2] = np.clip(gray[land_mask], 0, 255).astype(np.uint8)

# ── Step 2: Recolor orange text/labels to pale cream ──────────────
# Target: remaining orange elements like #f6a147 → #fdfab7 (253,250,183)
ro, go, bo = arr_out[:,:,0].astype(np.float32), arr_out[:,:,1].astype(np.float32), arr_out[:,:,2].astype(np.float32)

cmax2 = np.maximum(np.maximum(ro, go), bo)
cmin2 = np.minimum(np.minimum(ro, go), bo)
delta2 = cmax2 - cmin2

h2 = np.zeros_like(cmax2)
m2 = delta2 > 0
idx = (cmax2 == ro) & m2
h2[idx] = 60 * (((go[idx] - bo[idx]) / delta2[idx]) % 6)
idx = (cmax2 == go) & m2
h2[idx] = 60 * (((bo[idx] - ro[idx]) / delta2[idx]) + 2)
idx = (cmax2 == bo) & m2
h2[idx] = 60 * (((ro[idx] - go[idx]) / delta2[idx]) + 4)
h2 = (h2 + 360) % 360

s2 = np.where(cmax2 > 0, delta2 / cmax2 * 100, 0)
v2 = cmax2 / 255.0 * 100

orange_mask = (
    (h2 >= 15) & (h2 <= 50) &
    (s2 > 20) & (s2 <= 100) &
    (v2 > 60) & (v2 <= 100)
)

orange_count = np.sum(orange_mask)
print(f"Orange pixels to recolor: {orange_count} ({orange_count/total*100:.1f}%)")

arr_out[orange_mask] = [253, 250, 183]

img_out = Image.fromarray(arr_out, "RGB")
img_out.save(OUTPUT, "JPEG", quality=95)
print(f"Saved to {OUTPUT}")
