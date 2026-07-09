#!/usr/bin/env python
# Regenerates the Avatar world map tile pyramid from a source image.
#
# Coordinate scheme (matches the existing tiles): the source image is placed
# FULL-WIDTH on a square canvas, centered vertically, with WHITE padding bars
# top and bottom to fill the square. The square is then sliced into a standard
# XYZ {z}/{x}/{y} Leaflet pyramid at 256x256, zoom 0..MAX_ZOOM.
#
# Usage:  python scripts/avatar_tiler.py
# Review the SOURCE / OUT / MAX_ZOOM constants below before running.

from PIL import Image

SOURCE = "src/img/avatar/avatar_world_map.jpg"
OUT    = "src/tiles/avatar"
MAX_ZOOM = 5           # match backgounds.json "maxZoom": 5
TILE   = 256
PAD_COLOR = (255, 255, 255)   # white letterbox, matches existing tiles

# --- 1. Build a single square "master" image: full-width, centered vertically. ---
src = Image.open(SOURCE).convert("RGB")
sw, sh = src.size
side = max(sw, sh)                      # square side == source width (full-width)
master = Image.new("RGB", (side, side), PAD_COLOR)
offset_y = (side - sh) // 2             # centered vertically
master.paste(src, (0, offset_y))
print(f"source: {sw}x{sh}  master: {side}x{side}  (map at y={offset_y}..{offset_y+sh})")

# --- 2. Render the pyramid by downscaling the master per zoom level. ---
total = 0
for z in range(0, MAX_ZOOM + 1):
    n = 2 ** z                              # tiles per side at this zoom
    mosaic = master.resize((n * TILE, n * TILE), Image.LANCZOS)
    for x in range(n):
        for y in range(n):
            tile = mosaic.crop((x * TILE, y * TILE, (x + 1) * TILE, (y + 1) * TILE))
            tile.save(f"{OUT}/{z}/{x}/{y}.jpg", "JPEG", quality=88)
            total += 1
    print(f"  zoom {z}: {n}x{n} = {n*n} tiles")

print(f"done: {total} tiles written to {OUT}/")
