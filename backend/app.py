# import os
# from flask import Flask, request, jsonify
# from flask_cors import CORS
# from dotenv import load_dotenv
# from vaccine_analyzer import analyze_vaccine_image
# from chat_bot import chat_with_openrouter
# from heartbeat_analyzer import analyze_heartbeat_audio
# import tempfile

# load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))
# print("OPENROUTER =", os.getenv("OPENROUTER_API_KEY"))

# app = Flask(__name__)
# @app.route('/')
# def home():
#     return {"message": "Backend running successfully"}
# CORS(app)  # autorise les requêtes cross-origin depuis Next.js

# # ---------- Endpoint analyse carnet vaccination ----------
# @app.route('/api/analyze', methods=['POST'])
# def analyze():
#     if 'image' not in request.files:
#         return jsonify({'error': 'Aucune image fournie.'}), 400

#     file = request.files['image']
#     age_month = request.form.get('ageMonth', None)

#     # Appel à la logique métier
#     result, error = analyze_vaccine_image(file, age_month)
#     if error:
#         return jsonify({'error': error}), 422 if 'Impossible de lire' in error else 500
#     return jsonify(result)

# # ---------- Endpoint chatbot grossesse ----------
# @app.route('/api/chat-grossesse', methods=['POST'])
# def chat():
#     data = request.get_json()
#     if not data or 'messages' not in data:
#         return jsonify({'error': 'Historique de messages invalide.'}), 400

#     messages = data['messages']
#     reply, error = chat_with_openrouter(messages)
#     if error:
#         return jsonify({'error': error}), 500
#     return jsonify({'reply': reply})

# # ---------- Endpoint analyse battements cardiaques ----------
# @app.route('/api/heartbeat-analysis', methods=['POST'])
# def heartbeat_analysis():
#     if 'audio' not in request.files:
#         return jsonify({'error': 'Aucun fichier audio fourni.'}), 400

#     file = request.files['audio']

#     # Sauvegarder temporairement le fichier
#     with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_file:
#         file.save(temp_file.name)
#         temp_path = temp_file.name

#     try:
#         # Analyser l'audio
#         result = analyze_heartbeat_audio(temp_path)
#         if 'error' in result:
#             return jsonify({'error': result['error']}), 500
#         return jsonify(result)
#     finally:
#         # Nettoyer le fichier temporaire
#         os.unlink(temp_path)

# if __name__ == '__main__':
#     app.run(host='0.0.0.0', port=int(os.getenv('FLASK_RUN_PORT', '5000')), debug=True)



import os
import tempfile
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Charger .env AVANT tout import local (vaccine_analyzer, chat_bot, openrouter)
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'))

# Vérification au démarrage
api_key = os.getenv('OPENROUTER_API_KEY')
if api_key:
    print(f"✅ OPENROUTER_API_KEY chargée : {api_key[:12]}...")
else:
    print("⚠️  OPENROUTER_API_KEY manquante — vérifiez backend/.env")

# Imports locaux APRÈS load_dotenv
from vaccine_analyzer import analyze_vaccine_image
from chat_bot import chat_with_openrouter
from heartbeat_analyzer import analyze_heartbeat_audio

app = Flask(__name__)
CORS(app)  # autorise les requêtes cross-origin depuis Next.js / Postman

# ---------- Health check ----------
@app.route('/', methods=['GET'])
def home():
    return jsonify({
        'status': 'ok',
        'message': 'Kénéya Backend running',
        'endpoints': [
            'POST /api/analyze',
            'POST /api/chat-grossesse',
            'POST /api/heartbeat-analysis',
        ]
    })

# ---------- Endpoint analyse carnet vaccination ----------
@app.route('/api/analyze', methods=['POST'])
def analyze():
    if 'image' not in request.files:
        return jsonify({'error': 'Aucune image fournie. Envoyez un champ "image" en form-data.'}), 400

    file = request.files['image']
    age_month = request.form.get('ageMonth', None)

    result, error = analyze_vaccine_image(file, age_month)
    if error:
        status_code = 422 if 'Impossible de lire' in error else 500
        return jsonify({'error': error}), status_code

    return jsonify(result)

# ---------- Endpoint chatbot grossesse ----------
@app.route('/api/chat-grossesse', methods=['POST'])
def chat():
    data = request.get_json(silent=True)
    if not data or 'messages' not in data:
        return jsonify({'error': 'Corps JSON invalide. Attendu : {"messages": [...]}'}), 400

    messages = data['messages']
    if not isinstance(messages, list) or len(messages) == 0:
        return jsonify({'error': 'messages doit être une liste non vide.'}), 400

    reply, error = chat_with_openrouter(messages)
    if error:
        return jsonify({'error': error}), 500

    return jsonify({'reply': reply})

# ---------- Endpoint analyse battements cardiaques ----------
@app.route('/api/heartbeat-analysis', methods=['POST'])
def heartbeat_analysis():
    if 'audio' not in request.files:
        return jsonify({'error': 'Aucun fichier audio fourni. Envoyez un champ "audio" en form-data.'}), 400

    file = request.files['audio']

    with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as tmp:
        file.save(tmp.name)
        tmp_path = tmp.name

    try:
        result = analyze_heartbeat_audio(tmp_path)
        if 'error' in result:
            return jsonify({'error': result['error']}), 500
        return jsonify(result)
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)

if __name__ == '__main__':
    port = int(os.getenv('FLASK_RUN_PORT', '5000'))
    debug = os.getenv('FLASK_DEBUG', 'true').lower() == 'true'
    app.run(host='0.0.0.0', port=port, debug=debug)