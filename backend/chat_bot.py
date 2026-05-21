import traceback
from typing import Tuple
from openrouter import openrouter_chat

SYSTEM_PROMPT = """
Tu es SageFemmeIA, une assistante virtuelle spécialisée dans la santé maternelle en Afrique.
Tu es empathique, rassurante et tu fournis des informations générales sur la grossesse, l'accouchement, la nutrition, les signes de danger, et le suivi prénatal.
⚠️ Tu n'es pas médecin. Rappelle toujours qu'en cas d'urgence ou de symptômes graves, il faut consulter un professionnel de santé immédiatement.
Réponds de manière claire, courte, et en français simple. Si une question est hors sujet médical, réponds poliment que tu es là pour les questions de grossesse.
"""

def chat_with_openrouter(messages) -> Tuple[str, str]:
    """Répond uniquement à la DERNIÈRE question utilisateur, sans historique."""
    try:
        # Extraire la dernière question
        last_user = None
        for m in reversed(messages):
            if m.get('role') == 'user':
                last_user = m['text']
                break
        if not last_user:
            return None, "Aucune question détectée"

        # Construire un prompt unique
        prompt = f"Question posée : {last_user}"

        print(f"🔵 Question : {last_user[:80]}...")
        response = openrouter_chat([
            {'role': 'system', 'content': SYSTEM_PROMPT},
            {'role': 'user', 'content': prompt},
        ])
        print("🟢 Réponse obtenue")
        return response.strip(), None

    except Exception as e:
        print("🔴 ERREUR :")
        traceback.print_exc()
        return None, f"Erreur OpenRouter : {str(e)}"