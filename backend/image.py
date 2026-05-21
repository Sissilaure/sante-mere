# generate_test_image.py
from PIL import Image, ImageDraw, ImageFont
import textwrap, os

# Configuration
W, H = 800, 1000
bg_color = (255, 255, 240)  # crème
text_color = (0, 0, 0)
blue_color = (0, 51, 102)

# Création de l'image
img = Image.new('RGB', (W, H), bg_color)
draw = ImageDraw.Draw(img)

# Police (taille 20, par défaut)
try:
    font = ImageFont.truetype("arial.ttf", 20)
    font_small = ImageFont.truetype("arial.ttf", 16)
    font_bold = ImageFont.truetype("arialbd.ttf", 24)
except:
    font = ImageFont.load_default()
    font_small = font
    font_bold = font

# En-tête
draw.text((50, 40), "CARNET DE SANTÉ MATERNELLE & INFANTILE", fill=blue_color, font=font_bold)
draw.text((50, 80), "Nom de l'enfant : Awa DIOP", fill=text_color, font=font)
draw.text((50, 110), "Date de naissance : 15/03/2024", fill=text_color, font=font)

# Tableau des vaccins
y_start = 160
col_x = [50, 300, 500, 650]
headers = ["Vaccin", "Date", "Statut", "Signature"]
for i, h in enumerate(headers):
    draw.text((col_x[i], y_start), h, fill=blue_color, font=font_small)

# Données factices
vaccins = [
    ("BCG", "16/03/2024", "Fait", ""),
    ("Hépatite B naissance", "16/03/2024", "Fait", ""),
    ("DTC-HepB-Hib 1", "01/05/2024", "Fait", ""),
    ("Polio 1", "01/05/2024", "Fait", ""),
    ("Pneumocoque 1", "01/05/2024", "Fait", ""),
    ("Rotavirus 1", "01/05/2024", "Fait", ""),
    ("DTC-HepB-Hib 2", "15/06/2024", "Fait", ""),
    ("Polio 2", "15/06/2024", "Fait", ""),
    ("Rotavirus 2", "15/06/2024", "Fait", ""),
    ("DTC-HepB-Hib 3", "15/07/2024", "Planifié", ""),
    ("Polio 3", "15/07/2024", "Planifié", ""),
    ("Pneumocoque 2", "15/07/2024", "Planifié", ""),
    ("Rotavirus 3", "15/07/2024", "Planifié", ""),
]

y = y_start + 35
for vac in vaccins:
    for j, val in enumerate(vac):
        draw.text((col_x[j], y), val, fill=text_color, font=font_small)
    y += 25
    if y > H - 50:
        break

# Trait d'écriture manuscrite simulé
draw.line([(50, 30), (200, 35)], fill=(100,100,100), width=2)
draw.line([(350, 90), (500, 85)], fill=(100,100,100), width=2)

# Sauvegarde
output_path = "carnet_test.png"
img.save(output_path)
print(f"Image de test créée : {os.path.abspath(output_path)}")