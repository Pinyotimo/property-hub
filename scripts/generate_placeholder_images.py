from PIL import Image, ImageDraw, ImageFont
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
media_dir = os.path.join(BASE_DIR, 'media', 'property_images')
os.makedirs(media_dir, exist_ok=True)

images = {
    'sketch.jpg': 'Sketch',
    'museum_art.jpg': 'Museum Art'
}

for name, text in images.items():
    path = os.path.join(media_dir, name)
    if os.path.exists(path):
        print('Already exists:', path)
        continue
    img = Image.new('RGB', (800, 500), color=(200, 200, 200))
    d = ImageDraw.Draw(img)
    try:
        f = ImageFont.load_default()
    except Exception:
        f = None
    if f:
        bbox = d.textbbox((0,0), text, font=f)
        w = bbox[2] - bbox[0]
        h = bbox[3] - bbox[1]
    else:
        w, h = d.textlength(text), 10
    d.text(((800-w)/2, (500-h)/2), text, fill=(50,50,50), font=f)
    img.save(path)
    print('Created placeholder:', path)
