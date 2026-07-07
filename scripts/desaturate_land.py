"""
Desaturate only the land/soil areas of the Avatar world map.
Water, text, and other non-land details keep their original colors.
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

# Land mask: warm hues (brown, tan, yellow, green) with some saturation, not too dark
# H range: 10-140 covers orange through yellow to green
# Exclude: low saturation (gray), very dark (text/lines), very bright (highlights)
land_mask = (
    (h >= 10) & (h <= 140) &
    (s > 10) &
    (v > 30) & (v < 95)
)

# Additional: include reddish-brown dirt tones (H 0-10, but only if brown-ish)
warm_red_mask = (
    ((h >= 0) & (h < 10)) | ((h > 330) & (h <= 360))
) & (s > 15) & (v > 30) & (v < 90) & (r > g * 0.7) & (r > b * 0.7)

land_mask = land_mask | warm_red_mask

land_count = np.sum(land_mask)
total = arr.shape[0] * arr.shape[1]
print(f"Land pixels to desaturate: {land_count} ({land_count/total*100:.1f}%)")

# Compute grayscale luminance
gray = 0.299 * r + 0.587 * g + 0.114 * b

# Apply: keep original for non-land, use grayscale for land
arr_out = arr.copy()
arr_out[land_mask, 0] = np.clip(gray[land_mask], 0, 255).astype(np.uint8)
arr_out[land_mask, 1] = np.clip(gray[land_mask], 0, 255).astype(np.uint8)
arr_out[land_mask, 2] = np.clip(gray[land_mask], 0, 255).astype(np.uint8)

img_out = Image.fromarray(arr_out, "RGB")
img_out.save(OUTPUT, "JPEG", quality=95)
print(f"Saved to {OUTPUT}")
