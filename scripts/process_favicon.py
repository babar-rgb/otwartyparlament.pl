
import sys
import shutil
from PIL import Image, ImageDraw, ImageOps

input_path = "/Users/kajtek/.gemini/antigravity/brain/d4d008d9-7e32-4b79-b58e-4f2e2847828f/favicon_circle_navy_1768668427311.png"
output_path_favicon = "public/favicon.png"
output_path_logo = "public/logo.png"

def make_circle_transparent(input_p, output_p):
    try:
        img = Image.open(input_p).convert("RGBA")
        
        # Create a circular mask
        mask = Image.new('L', img.size, 0)
        draw = ImageDraw.Draw(mask)
        w, h = img.size
        # Draw a circle filling the image
        draw.ellipse((0, 0, w, h), fill=255)
        
        # Apply the mask
        output = ImageOps.fit(img, mask.size, centering=(0.5, 0.5))
        output.putalpha(mask)
        
        output.save(output_p, "PNG")
        print(f"Successfully processed to {output_p}")
    except Exception as e:
        print(f"Error processing image: {e}")

if __name__ == "__main__":
    make_circle_transparent(input_path, output_path_favicon)
    make_circle_transparent(input_path, output_path_logo)
