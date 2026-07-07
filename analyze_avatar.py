from PIL import Image
import colorsys
from collections import defaultdict

img = Image.open('src/img/avatar/avatar_world_map.jpg')
w, h = img.size
pixels = img.load()

categories = defaultdict(list)  # category -> list of (r, g, b, h, s, v)

def classify(r, g, b):
    rn, gn, bn = r / 255.0, g / 255.0, b / 255.0
    h, s, v = colorsys.rgb_to_hsv(rn, gn, bn)
    h_deg = h * 360
    s_pct = s * 100
    v_pct = v * 100

    if 180 <= h_deg <= 300 and s_pct > 20 and v_pct > 40:
        cat = 'water'
    elif 10 <= h_deg <= 80 and s_pct > 20:
        cat = 'land'
    elif s_pct < 20:
        cat = 'gray'
    elif v_pct < 40:
        cat = 'dark'
    else:
        cat = 'other'

    categories[cat].append((r, g, b, h_deg, s_pct, v_pct))

# Sample every 50px
for x in range(0, w, 50):
    for y in range(0, h, 50):
        r, g, b = pixels[x, y]
        classify(r, g, b)

total = sum(len(v) for v in categories.values())
print("=" * 70)
print("AVATAR MAP COLOR ANALYSIS (every 50px sample)")
print("=" * 70)
print(f"Total sampled pixels: {total} (from {w}x{h} image)")
print()

for cat in ['water', 'land', 'gray', 'dark', 'other']:
    vals = categories.get(cat, [])
    if not vals:
        print(f"{cat:>8}:    0  (  0.0%)  — no pixels")
        continue
    pct = len(vals) / total * 100
    avg_r = int(sum(v[0] for v in vals) / len(vals))
    avg_g = int(sum(v[1] for v in vals) / len(vals))
    avg_b = int(sum(v[2] for v in vals) / len(vals))
    avg_h = sum(v[3] for v in vals) / len(vals)
    avg_s = sum(v[4] for v in vals) / len(vals)
    avg_v = sum(v[5] for v in vals) / len(vals)
    print(f"{cat:>8}: {len(vals):5} ({pct:5.1f}%)  avg RGB=({avg_r:3d}, {avg_g:3d}, {avg_b:3d})  HSV=({avg_h:6.1f}°, {avg_s:5.1f}%, {avg_v:5.1f}%)")

# Regional water/land analysis
print()
print("=" * 70)
print("REGIONAL WATER vs LAND CLASSIFICATION")
print("=" * 70)

regions = {
    'Top (0-25%)':        (0, 0, w // 4, h // 4),
    'Mid-Left (25-50% H, 0-33% W)': (0, h // 4, w // 3, h // 2),
    'Mid-Right (50-75% H, 66-100% W)': (2 * w // 3, h // 2, w, 3 * h // 4),
    'Bottom-Left (75-100% H, 0-33% W)': (0, 3 * h // 4, w // 3, h),
}

for name, (x1, y1, x2, y2) in regions.items():
    water_px = 0
    land_px = 0
    reg_total = 0
    for x in range(max(0, x1), min(w, x2), 50):
        for y in range(max(0, y1), min(h, y2), 50):
            r, g, b = pixels[x, y]
            rn, gn, bn = r / 255.0, g / 255.0, b / 255.0
            hh, ss, vv = colorsys.rgb_to_hsv(rn, gn, bn)
            h_deg = hh * 360
            s_pct = ss * 100
            v_pct = vv * 100
            reg_total += 1
            if 180 <= h_deg <= 300 and s_pct > 20 and v_pct > 40:
                water_px += 1
            elif 10 <= h_deg <= 80 and s_pct > 20:
                land_px += 1
    other = reg_total - water_px - land_px
    if reg_total:
        print(f"\n{name}:")
        print(f"  Water: {water_px:4d} ({water_px/reg_total*100:5.1f}%)")
        print(f"  Land:  {land_px:4d} ({land_px/reg_total*100:5.1f}%)")
        print(f"  Other: {other:4d} ({other/reg_total*100:5.1f}%)")
