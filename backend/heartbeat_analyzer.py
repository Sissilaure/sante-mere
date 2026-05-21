import librosa
import numpy as np
from transformers import pipeline

# Charger le modèle de classification audio pour les battements cardiaques
# Utilisation d'un modèle gratuit de Hugging Face
classifier = pipeline("audio-classification", model="Hemg/heartbeat-detection")

def analyze_heartbeat_audio(audio_path):
    """
    Analyse un fichier audio de battements cardiaques
    Retourne une classification et une estimation du rythme cardiaque
    """
    try:
        # Charger l'audio
        y, sr = librosa.load(audio_path, sr=22050)

        # Calculer le rythme cardiaque approximatif
        # Les battements cardiaques sont généralement entre 60-180 BPM
        # Utiliser l'onset strength pour détecter les pics
        onset_env = librosa.onset.onset_strength(y=y, sr=sr)
        tempo, _ = librosa.beat.tempo(onset_envelope=onset_env, sr=sr)

        # Classification avec le modèle IA
        result = classifier(audio_path)

        # Interpréter le résultat
        top_prediction = result[0]
        label = top_prediction['label']
        confidence = top_prediction['score']

        # Estimation du rythme
        heart_rate = round(float(tempo))

        # Analyse basée sur le rythme
        if heart_rate < 60:
            status = "Bradycardie (rythme trop lent)"
            risk = "Élevé"
        elif 60 <= heart_rate <= 100:
            status = "Rythme normal"
            risk = "Faible"
        elif 100 < heart_rate <= 160:
            status = "Tachycardie légère"
            risk = "Modéré"
        else:
            status = "Tachycardie (rythme trop rapide)"
            risk = "Élevé"

        return {
            'heart_rate': heart_rate,
            'status': status,
            'risk': risk,
            'confidence': round(confidence * 100, 2),
            'model_prediction': label,
            'recommendation': "Consultez un professionnel de santé pour une évaluation complète."
        }

    except Exception as e:
        return {'error': f'Erreur lors de l\'analyse: {str(e)}'}