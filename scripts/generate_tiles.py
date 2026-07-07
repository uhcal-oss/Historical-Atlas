"""
Generate a tile pyramid from the Avatar world map image.
Output: src/tiles/avatar/{z}/{x}/{y}.jpg (standard XYZ tile scheme)
"""
import os
import sys
from PIL import Image

TILE_SIZE = 256
SOURCE_IMAGE = "src/img/avatar/avatar_world_map.jpg"
OUTPUT_DIR = "src/tiles/avatar"
MAX_ZOOM = 5

def generate_tiles():
    img = Image.open(SOURCE_IMAGE)
    img_w, img_h = img.size
    print(f"Source image: {img_w}x{img_h}")

    for z in range(MAX_ZOOM + 1):
        world_size = TILE_SIZE * (2 ** z)
        # Scale image to fit within world_size, preserving aspect ratio
        scale = min(world_size / img_w, world_size / img_h)
        new_w = int(img_w * scale)
        new_h = int(img_h * scale)
        resized = img.resize((new_w, new_h), Image.LANCZOS)

        # Create square canvas, center the image
        canvas = Image.new("RGB", (world_size, world_size), (255, 255, 255))
        offset_x = (world_size - new_w) // 2
        offset_y = (world_size - new_h) // 2
        canvas.paste(resized, (offset_x, offset_y))

        # Slice into tiles
        tiles_per_axis = 2 ** z
        for ty in range(tiles_per_axis):
            for tx in range(tiles_per_axis):
                left = tx * TILE_SIZE
                upper = ty * TILE_SIZE
                tile = canvas.crop((left, upper, left + TILE_SIZE, upper + TILE_SIZE))

                tile_dir = os.path.join(OUTPUT_DIR, str(z), str(tx))
                os.makedirs(tile_dir, exist_ok=True)

                tile_path = os.path.join(tile_dir, f"{ty}.jpg")
                tile.save(tile_path, "JPEG", quality=90)

        print(f"Zoom {z}: {tiles_per_axis}x{tiles_per_axis} tiles ({world_size}x{world_size} px)")

    total_tiles = sum((2 ** z) ** 2 for z in range(MAX_ZOOM + 1))
    print(f"Done! Generated {total_tiles} tiles across {MAX_ZOOM + 1} zoom levels.")

if __name__ == "__main__":
    generate_tiles()
