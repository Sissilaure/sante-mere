import { NextRequest, NextResponse } from 'next/server';
import { openRouterChat } from '../../lib/openrouter';

interface HealthAnalysisInput {
  history?: Array<{ role: 'user' | 'assistant'; text?: string }>;
  journal?: Array<{ date?: string; symptom?: string; note?: string }>;
  carnetData?: Record<string, unknown>;
}

export interface HealthAnalysisResponse {
  report: string;
  summary: string;
  riskLevel: 'Vert' | 'Orange' | 'Rouge';
  indicators: {
    tension: 'normal' | 'élevée'; // Mapped to temperature elevated in UI
    stress: 'Faible' | 'Modéré' | 'Élevé'; // Mapped to growth severity
    nutrition: 'Excellent' | 'Bon' | 'À améliorer';
    hydration: 'Bonne' | 'Moyenne' | 'Faible';
  };
  recommendations: string[];
  nextQuestions: string[];
  modelUsed: string;
  heartRate?: number;
}

function getInfantIndicator(value: string | number | undefined, kind: 'stress' | 'nutrition' | 'hydration') {
  if (kind === 'stress') {
    // Stress mapped to infant growth/risk severity
    const text = String(value ?? '').toLowerCase();
    if (text.includes('urgence') || text.includes('rouge') || text.includes('convulsion') || text.includes('respiration')) return 'Élevé';
    if (text.includes('fièvre') || text.includes('toux') || text.includes('orange')) return 'Modéré';
    return 'Faible';
  }
  if (kind === 'nutrition') {
    const text = String(value ?? '').toLowerCase();
    if (text.includes('exclusif') || text.includes('sein') || text.includes('excellent')) return 'Excellent';
    if (text.includes('mixte') || text.includes('diversifié') || text.includes('bon')) return 'Bon';
    return 'À améliorer';
  }
  if (kind === 'hydration') {
    const text = String(value ?? '').toLowerCase();
    if (text.includes('bonne') || text.includes('bien') || text.includes('6+')) return 'Bonne';
    if (text.includes('moyenne') || text.includes('4-5')) return 'Moyenne';
    return 'Faible';
  }
  return 'Faible';
}

function computeInfantHeartRate(temp: number, symptoms: string) {
  let rate = 120; // Normal baby heart rate is 100-140
  if (temp >= 38) rate += 15;
  if (temp < 35.5) rate -= 15;
  if (/respiration rapide|pleurs/i.test(symptoms)) rate += 10;
  return rate;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as HealthAnalysisInput;
    const model = process.env.OPENROUTER_MODEL || 'openai/gpt-3.5-mini';
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "Configuration manquante: OPENROUTER_API_KEY n'est pas chargée côté Next.js (utiliser .env.local à la racine du projet).",
        },
        { status: 500 }
      );
    }

    const systemPrompt = `Tu es un pédiatre expert de renom spécialisé dans le suivi des nourrissons de 0 à 24 mois en Afrique subsaharienne. Ton rôle est d'analyser les constantes physiologiques d'un bébé (âge en mois, poids, taille, température, alimentation, hydratation) et ses symptômes. Rédige un bilan structuré, clair et professionnel. Incorpore des alertes claires basées sur le calendrier vaccinal officiel du Burkina Faso et des rappels de prévention clinique.`;
    const userContent = `Analyse les données du nourrisson suivantes et génère un bilan structuré en Markdown :\n- Historique : ${JSON.stringify(body.history)}\n- Journal : ${JSON.stringify(body.journal)}\n- Données cliniques : ${JSON.stringify(body.carnetData)}\n\nLe bilan doit contenir :\n1. Synthèse globale de la santé de l'enfant.\n2. Indicateurs de risque (Vert/Orange/Rouge) avec explications claires.\n3. Recommandations ciblées (Alimentation/Allaitement, hydratation, contrôle de la fièvre, vaccins du Burkina Faso selon son âge).\n4. Liste de questions cruciales à poser au médecin/pédiatre.`;

    try {
      const report = await openRouterChat(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        model,
      );

      const carnet = body.carnetData ?? {};
      const temp = Number(carnet.temperature ?? 36.8);
      const ageMonths = Number(carnet.ageMonths ?? 3);
      const hasFever = temp >= 38.0;

      const symptomsJoined = [
        ...(body.history ?? []).map((item) => item.text ?? ''),
        ...(body.journal ?? []).map((entry) => `${entry.symptom ?? ''} ${entry.note ?? ''}`),
      ].join(' ');

      const heartRate = computeInfantHeartRate(temp, symptomsJoined);

      const isUrgent = hasFever && ageMonths <= 3 || temp >= 39.0 || /respiration rapide|convulsion/i.test(symptomsJoined);
      const riskLevel = isUrgent ? 'Rouge' : hasFever ? 'Orange' : 'Vert';

      return NextResponse.json({
        report,
        summary: `Bilan pédiatrique IA généré par ${model}`,
        riskLevel,
        indicators: {
          tension: hasFever ? 'élevée' : 'normal',
          stress: isUrgent ? 'Élevé' : hasFever ? 'Modéré' : 'Faible',
          nutrition: getInfantIndicator(String(carnet.alimentation ?? ''), 'nutrition') as 'Excellent' | 'Bon' | 'À améliorer',
          hydration: getInfantIndicator(String(carnet.hydration ?? ''), 'hydration') as 'Bonne' | 'Moyenne' | 'Faible',
        },
        recommendations: [
          `Surveiller la température corporelle toutes les 6 heures en cas d'inconfort.`,
          ageMonths < 6 ? `Allaitement exclusif à la demande.` : `Continuer l'allaitement et enrichir la bouillie avec des farines locales.`
        ],
        nextQuestions: [
          `Bébé a-t-il bien pris ses vaccins du Programme Élargi de Vaccination (PEV) du Burkina Faso ?`
        ],
        modelUsed: model,
        heartRate,
      });
    } catch (error: unknown) {
      console.error('OpenRouter infant analysis failed:', error);
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      return NextResponse.json({ error: `Erreur service IA: ${message}` }, { status: 502 });
    }
  } catch (error: unknown) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : 'Infant analysis failed';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}


