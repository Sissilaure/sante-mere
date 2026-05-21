# import json
# import os
# import urllib.request
# import urllib.error

# OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY')
# DEFAULT_OPENROUTER_MODEL = 'gpt-4o-mini'


# def openrouter_chat(messages, model=DEFAULT_OPENROUTER_MODEL):
#     if not OPENROUTER_API_KEY:
#         raise ValueError('OPENROUTER_API_KEY manquante dans le backend')

#     payload = json.dumps({
#         'model': model,
#         'messages': messages,
#         'temperature': 0.2,
#         'max_tokens': 1200,
#     }).encode('utf-8')

#     request = urllib.request.Request(
#         'https://api.openrouter.ai/v1/chat/completions',
#         data=payload,
#         headers={
#             'Content-Type': 'application/json',
#             'Authorization': f'Bearer {OPENROUTER_API_KEY}',
#         },
#     )

#     try:
#         with urllib.request.urlopen(request, timeout=60) as response:
#             body = response.read().decode('utf-8')
#     except urllib.error.HTTPError as e:
#         error_body = e.read().decode('utf-8')
#         raise RuntimeError(f'OpenRouter HTTP {e.code}: {error_body}')
#     except urllib.error.URLError as e:
#         raise RuntimeError(f'OpenRouter connection error: {e.reason}')

#     data = json.loads(body)
#     if not data.get('choices'):
#         raise RuntimeError('OpenRouter : aucune réponse disponible')

#     choice = data['choices'][0]
#     message = choice.get('message', {})
#     content = message.get('content')

#     if isinstance(content, str):
#         return content

#     if isinstance(content, dict):
#         if 'text' in content and isinstance(content['text'], str):
#             return content['text']
#         return json.dumps(content, ensure_ascii=False)

#     raise RuntimeError('OpenRouter : format de réponse inattendu')


import json
import os
import urllib.request
import urllib.error

# NE PAS lire la clé ici au niveau module — elle serait lue avant load_dotenv()
# On la lit dans la fonction, à chaque appel.
DEFAULT_OPENROUTER_MODEL = 'meta-llama/llama-3.3-70b-instruct:free'


def openrouter_chat(messages, model=DEFAULT_OPENROUTER_MODEL):
    # Lecture de la clé au moment de l'appel (après load_dotenv)
    api_key = os.getenv('OPENROUTER_API_KEY')
    if not api_key:
        raise ValueError(
            'OPENROUTER_API_KEY manquante. '
            'Vérifiez votre fichier backend/.env ou les variables d\'environnement Render.'
        )

    payload = json.dumps({
        'model': model,
        'messages': messages,
        'temperature': 0.2,
        'max_tokens': 1200,
    }).encode('utf-8')

    req = urllib.request.Request(
        'https://openrouter.ai/api/v1/chat/completions',
        data=payload,
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {api_key}',
            'HTTP-Referer': os.getenv('SITE_URL', 'http://localhost:5000'),
            'X-Title': 'Kénéya - Santé Maternelle',
        },
    )

    try:
        with urllib.request.urlopen(req, timeout=60) as response:
            body = response.read().decode('utf-8')
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        raise RuntimeError(f'OpenRouter HTTP {e.code}: {error_body}')
    except urllib.error.URLError as e:
        raise RuntimeError(f'OpenRouter connexion impossible: {e.reason}')

    data = json.loads(body)
    if not data.get('choices'):
        raise RuntimeError('OpenRouter : aucune réponse dans choices')

    content = data['choices'][0].get('message', {}).get('content')

    if isinstance(content, str):
        return content
    if isinstance(content, dict) and 'text' in content:
        return content['text']

    raise RuntimeError(f'OpenRouter : format de réponse inattendu : {content}')