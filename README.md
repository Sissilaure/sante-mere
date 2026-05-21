## Kénéya — Santé maternelle & infantile (SMI)

Kénéya est un prototype d’agent IA pour **numériser les carnets de santé** (photo → extraction) et proposer un **suivi proactif** (vaccins, conseils, suivi grossesse).

### Fonctionnalités (démo)

- **Analyse carnet** : import d’une photo + extraction IA + statut “à jour / à prévoir / urgent”.
- **Suivi grossesse** : chat “SageFemmeIA” + journal des symptômes + calcul DPA + calendrier des consultations.
- **Dictée vocale** (si support navigateur) : bouton micro dans le chat grossesse pour dicter une question.

### Prérequis

- Node.js (recommandé : version récente)
- Une clé API Gemini (Google)

### Configuration

1) Copier `.env.example` en `.env.local`

2) Remplacer `OPENROUTER_API_KEY` par votre clé

⚠️ Ne commitez jamais `.env.local` (secrets).

### Lancer en local

```bash
npm install
npm run dev
```

Ouvrir `http://localhost:3000`.

### Notes sécurité / responsabilité

Kénéya fournit des informations générales et **ne remplace pas** un professionnel de santé.
En cas d’urgence, consultez immédiatement un centre de santé.
