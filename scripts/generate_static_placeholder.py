from PIL import Image, ImageDraw, ImageFont
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
static_dir = os.path.join(BASE_DIR, 'static', 'images')
os.makedirs(static_dir, exist_ok=True)
path = os.path.join(static_dir, 'default-property.jpg')
if os.path.exists(path):
    print('Static placeholder already exists:', path)
else:
    img = Image.new('RGB', (800, 500), color=(220,220,220))
    d = ImageDraw.Draw(img)
    try:
        f = ImageFont.load_default()
    except Exception:
        f = None
    text = 'No Image'
    if f:
        bbox = d.textbbox((0,0), text, font=f)
        w = bbox[2] - bbox[0]
        h = bbox[3] - bbox[1]
    else:
        w, h = d.textlength(text), 10
    d.text(((800-w)/2, (500-h)/2), text, fill=(90,90,90), font=f)
    img.save(path, quality=85)
    print('Created static placeholder:', path)
