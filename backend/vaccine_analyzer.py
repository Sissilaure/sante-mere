import json
import base64
from typing import Tuple, Optional, List, Dict
from datetime import datetime
from openrouter import openrouter_chat

# ------------------ Calendrier OMS de référence ------------------
OMS_SCHEDULE = [
    (0, 'BCG'),
    (0, 'Hépatite B (naissance)'),
    (1.5, 'DTC-HepB-Hib 1'),
    (1.5, 'Polio 1'),
    (1.5, 'Pneumocoque 1'),
    (1.5, 'Rotavirus 1'),
    (2.5, 'DTC-HepB-Hib 2'),
    (2.5, 'Polio 2'),
    (2.5, 'Rotavirus 2'),
    (3.5, 'DTC-HepB-Hib 3'),
    (3.5, 'Polio 3'),
    (3.5, 'Pneumocoque 2'),
    (3.5, 'Rotavirus 3'),
    (9, 'Rougeole-Rubéole'),
    (9, 'Fièvre jaune'),
    (9, 'Vitamine A'),
    (15, 'Rappel DTC-HepB-Hib'),
    (15, 'Rappel Polio'),
    (15, 'Rappel Pneumocoque'),
]

# ------------------ Normalisation des noms ------------------
def normalize_vaccine_name(name: str) -> str:
    n = name.lower().strip()
    if 'bcg' in n:
        return 'BCG'
    if 'hépatite' in n and 'naissance' in n:
        return 'Hépatite B (naissance)'
    if 'dtc' in n or 'diphterie' in n:
        if '1' in n:
            return 'DTC-HepB-Hib 1'
        if '2' in n:
            return 'DTC-HepB-Hib 2'
        if '3' in n:
            return 'DTC-HepB-Hib 3'
        if 'rappel' in n:
            return 'Rappel DTC-HepB-Hib'
        return 'DTC-HepB-Hib'
    if 'polio' in n:
        if '1' in n:
            return 'Polio 1'
        if '2' in n:
            return 'Polio 2'
        if '3' in n:
            return 'Polio 3'
        if 'rappel' in n:
            return 'Rappel Polio'
        return 'Polio'
    if 'pneumocoque' in n:
        if '1' in n:
            return 'Pneumocoque 1'
        if '2' in n:
            return 'Pneumocoque 2'
        if 'rappel' in n:
            return 'Rappel Pneumocoque'
        return 'Pneumocoque'
    if 'rotavirus' in n or 'rota' in n:
        if '1' in n:
            return 'Rotavirus 1'
        if '2' in n:
            return 'Rotavirus 2'
        if '3' in n:
            return 'Rotavirus 3'
        return 'Rotavirus'
    if 'rougeole' in n or 'rubéole' in n or 'rr' in n:
        return 'Rougeole-Rubéole'
    if 'fièvre jaune' in n or 'amaril' in n:
        return 'Fièvre jaune'
    if 'vitamine a' in n:
        return 'Vitamine A'
    return name

# ------------------ Évaluation du statut vaccinal ------------------
def evaluate_vaccination_status(vaccines: List[Dict], age_month: float):
    done_or_planned = set()
    done_vaccines = []
    planned_vaccines = []

    for v in vaccines:
        nom = normalize_vaccine_name(v.get('nom', ''))
        statut = v.get('statut', 'Inconnu')
        date = v.get('date')
        if statut == 'Fait' and date:
            done_vaccines.append({'vaccine': nom, 'date': date})
            done_or_planned.add(nom)
        elif statut == 'Planifié':
            planned_vaccines.append({'vaccine': nom, 'date': date})
            done_or_planned.add(nom)

    expected_before = [v for v in OMS_SCHEDULE if v[0] <= age_month]
    upcoming = [v for v in OMS_SCHEDULE if age_month < v[0] <= age_month + 1]

    up_to_date = [item for item in done_vaccines if any(e[1] == item['vaccine'] for e in expected_before)]
    upcoming_vaccines = [item for item in planned_vaccines if any(e[1] == item['vaccine'] for e in upcoming)]
    missing_urgent = [{'vaccine': vaccine} for age, vaccine in expected_before if vaccine not in done_or_planned]

    return up_to_date, upcoming_vaccines, missing_urgent

# ------------------ Fonction principale d'analyse ------------------
def analyze_vaccine_image(file, age_input: Optional[str]) -> Tuple[Dict, Optional[str]]:
    try:
        # Convertir l'image en base64
        img_bytes = file.read()
        mime_type = file.mimetype or 'image/jpeg'
        b64 = base64.b64encode(img_bytes).decode('utf-8')

        prompt = '''
Tu es un expert en santé numérique africain chargé d'analyser une photo de carnet de santé (souvent manuscrit).
Extrais les informations suivantes au format JSON strict :

{
  "date_de_naissance": "YYYY-MM-DD" ou null si illisible,
  "vaccins": [
    {
      "nom": "nom du vaccin tel qu'écrit",
      "date": "YYYY-MM-DD" ou null si pas de date lisible,
      "statut": "Fait" (si date passée), "Planifié" (si date future), ou "Inconnu" (si écriture illisible)
    }
  ]
}
- Si plusieurs doses d'un même vaccin, liste-les séparément.
- Ne fais aucune supposition, utilise uniquement ce que tu lis.
- Renvoie UNIQUEMENT le JSON, sans texte avant ni après.
'''

        response = openrouter_chat([
            {'role': 'system', 'content': 'Tu es un expert en santé numérique africain chargé d analyser une photo de carnet de santé (souvent manuscrit). Extrais les informations suivantes au format JSON strict. Réponds uniquement par le JSON demandé.'},
            {'role': 'user', 'content': prompt},
            {'role': 'user', 'content': [
                {'type': 'input_image', 'image_url': f'data:{mime_type};base64,{b64}'},
            ]},
        ])
        text = response.strip()

        # Nettoyage du texte JSON
        import re
        text = re.sub(r'```json\s*|\s*```', '', text).strip()
        extraction = json.loads(text)

        # Déterminer l'âge de l'enfant
        age_month = None
        if age_input and age_input.isdigit():
            age_month = float(age_input)
        elif extraction.get('date_de_naissance'):
            birth = datetime.strptime(extraction['date_de_naissance'], '%Y-%m-%d')
            now = datetime.now()
            age_month = (now.year - birth.year) * 12 + (now.month - birth.month)

        if age_month is None:
            return None, "Impossible de déterminer l'âge de l'enfant. Veuillez renseigner l'âge en mois."

        up, upcoming, missing = evaluate_vaccination_status(
            extraction.get('vaccins', []),
            age_month
        )

        # Générer le conseil
        if missing:
            conseil = '⚠️ Attention : votre enfant a manqué des vaccins essentiels. Rendez-vous immédiatement au centre de santé le plus proche.'
        elif upcoming:
            conseil = '📅 Un ou plusieurs vaccins sont à prévoir prochainement. Prenez rendez-vous pour ne pas les oublier.'
        else:
            conseil = '✅ Tous les vaccins sont à jour. Continuez à suivre le calendrier vaccinal.'

        return {
            'upToDate': up,
            'upcomingVaccines': upcoming,
            'missingUrgent': missing,
            'conseil': conseil,
            'ageMonth': age_month
        }, None

    except json.JSONDecodeError:
        return None, "Impossible de lire les données. La photo est-elle nette ? Essayez avec une meilleure luminosité."
    except Exception as e:
        import traceback
        traceback.print_exc()
        return None, str(e)