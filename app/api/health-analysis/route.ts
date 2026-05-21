import { NextRequest, NextResponse } from 'next/server';
import { openRouterChat } from '../../lib/openrouter';

interface HealthAnalysisInput {
  history?: Array<{ role: 'user' | 'assistant'; text?: string }>;
  journal?: Array<{ date?: string; symptom?: string; note?: string }>;
  carnetData?: Record<string, any>;
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

function countInfantWarnings(history: HealthAnalysisInput['history'], journal: HealthAnalysisInput['journal'], carnetData: HealthAnalysisInput['carnetData']) {
  const warnings: string[] = [];

  const textSources = [
    ...(history ?? []).map((item) => item.text?.toLowerCase() ?? ''),
    ...(journal ?? []).map((entry) => `${entry.symptom ?? ''} ${entry.note ?? ''}`.toLowerCase()),
    JSON.stringify(carnetData ?? {}).toLowerCase(),
  ];

  const keywords = [
    { term: 'diarrhée', desc: 'Diarrhée infantile' },
    { term: 'vomissement', desc: 'Vomissements' },
    { term: 'convulsion', desc: 'Convulsions (Urgence)' },
    { term: 'toux', desc: 'Toux persistante' },
    { term: 'respiration rapide', desc: 'Difficulté respiratoire (Urgence)' },
    { term: 'refus de téter', desc: 'Refus de s\'alimenter (Urgence)' },
    { term: 'somnolence', desc: 'Léthargie ou somnolence extrême' },
  ];

  for (const text of textSources) {
    for (const kw of keywords) {
      if (text.includes(kw.term) && !warnings.includes(kw.desc)) {
        warnings.push(kw.desc);
      }
    }
  }

  const temp = Number(carnetData?.temperature ?? 36.5);
  if (temp >= 38.0) {
    warnings.push('Fièvre détectée');
  } else if (temp < 35.5) {
    warnings.push('Hypothermie détectée');
  }

  const ageMonths = Number(carnetData?.ageMonths ?? 0);
  if (ageMonths <= 3 && temp >= 38.0) {
    warnings.push('Fièvre chez nourrisson de moins de 3 mois (Urgence)');
  }

  const hydration = String(carnetData?.hydration ?? '').toLowerCase();
  if (hydration.includes('faible') || hydration.includes('moins de 3')) {
    warnings.push('Déshydratation suspectée');
  }

  return warnings;
}

function getInfantRiskLevel(warnings: string[], ageMonths: number, temp: number) {
  const isUrgent = warnings.some(w => w.includes('(Urgence)')) || temp >= 39.0 || (ageMonths <= 3 && temp >= 38.0);
  if (isUrgent || warnings.length >= 3) return 'Rouge';
  if (warnings.length >= 1 || temp >= 38.0 || temp < 35.5) return 'Orange';
  return 'Vert';
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

function buildFallbackReport(input: HealthAnalysisInput): HealthAnalysisResponse {
  const carnet = input.carnetData ?? {};
  const temp = Number(carnet.temperature ?? 36.8);
  const ageMonths = Number(carnet.ageMonths ?? 3);
  
  const symptomsJoined = [
    ...(input.history ?? []).map((item) => item.text ?? ''),
    ...(input.journal ?? []).map((entry) => `${entry.symptom ?? ''} ${entry.note ?? ''}`),
  ].join(' ');

  const warnings = countInfantWarnings(input.history, input.journal, carnet);
  const riskLevel = getInfantRiskLevel(warnings, ageMonths, temp);

  const indicators = {
    tension: (temp >= 38.0 ? 'élevée' : 'normal') as 'normal' | 'élevée',
    stress: getInfantIndicator(symptomsJoined + ' ' + riskLevel, 'stress') as 'Faible' | 'Modéré' | 'Élevé',
    nutrition: getInfantIndicator(carnet.alimentation ?? '', 'nutrition') as 'Excellent' | 'Bon' | 'À améliorer',
    hydration: getInfantIndicator(carnet.hydration ?? '', 'hydration') as 'Bonne' | 'Moyenne' | 'Faible',
  };
  
  const heartRate = computeInfantHeartRate(temp, symptomsJoined);

  const recommendations: string[] = [];
  const nextQuestions: string[] = [];

  // Custom pediatric rules
  if (temp >= 38.0) {
    if (ageMonths <= 3) {
      recommendations.push('URGENCE : Fièvre chez un nourrisson de moins de 3 mois. Rendez-vous immédiatement dans un centre de santé.');
    } else {
      recommendations.push('Donner du paracétamol pédiatrique selon le poids, déshabiller le bébé (laisser en body) et bien l\'hydrater.');
    }
    nextQuestions.push('La fièvre est-elle accompagnée de vomissements ou d\'une somnolence inhabituelle ?');
  }

  if (indicators.hydration === 'Faible') {
    recommendations.push('URGENCE DÉSHYDRATATION : Proposer des SRO (Sels de Réhydratation Orale) par petites gorgées et consulter d\'urgence.');
    nextQuestions.push('Combien de fois le bébé a-t-il uriné ces dernières 24 heures ? Ses yeux semblent-ils creusés ?');
  }

  if (indicators.nutrition === 'À améliorer') {
    if (ageMonths < 6) {
      recommendations.push('Encourager l\'allaitement maternel exclusif à la demande. Éviter toute eau ou tisane.');
    } else {
      recommendations.push('Assurer une diversification alimentaire riche en nutriments locaux (bouillie enrichie).');
    }
  }

  // Burkina Faso vaccination advisor
  if (ageMonths === 0) {
    recommendations.push('Rappel Vaccins BF : S\'assurer que les vaccins de naissance (BCG, VPO 0, HépB) ont été administrés.');
  } else if (ageMonths >= 2 && ageMonths < 3) {
    recommendations.push('Rappel Vaccins BF : Prochain rendez-vous à 6 semaines pour DTC-HepB-Hib 1, VPO 1, Rota 1, Pneumo 1.');
  } else if (ageMonths >= 5 && ageMonths < 8) {
    recommendations.push('Rappel Vaccins BF : Planifier les doses du vaccin contre le paludisme R21/Matrix-M (introduit à 5, 6 et 7 mois).');
  } else if (ageMonths >= 9 && ageMonths < 10) {
    recommendations.push('Rappel Vaccins BF : Planifier le vaccin Rougeole-Rubéole (RR 1) et Fièvre Jaune (VAA) à 9 mois.');
  } else if (ageMonths >= 15) {
    recommendations.push('Rappel Vaccins BF : Pensez au rappel de 15 mois (RR 2, Méningite A, Paludisme 4).');
  }

  if (riskLevel === 'Vert') {
    recommendations.push('Continuer le suivi de croissance mensuel et l\'allaitement. Garder le calendrier vaccinal à jour.');
  }

  const summary = `Bilan pédiatrique de bébé (${ageMonths} mois). Risque global : ${riskLevel}. ${warnings.length > 0 ? `Points observés : ${warnings.join(', ')}.` : 'Aucun signal critique détecté pour le moment.'}`;

  const reportLines = [
    `### Bilan Pédiatrique (Fallback Clinique)`,
    `- Âge de l'enfant : **${ageMonths} mois**`,
    `- Température corporelle : **${temp} °C** (${temp >= 38.0 ? 'Fièvre' : temp < 35.5 ? 'Hypothermie' : 'Normale'})`,
    `- Niveau de Risque : **${riskLevel}**`,
    `- Alimentation : ${carnet.alimentation ?? 'Non spécifiée'}`,
    `- Hydratation : ${indicators.hydration}`,
    ``,
    `### Recommandations Immédiates`,
    ...recommendations.map((item) => `- ${item}`),
    ``,
    `### Signaux de Vigilance`,
    ...warnings.length > 0 ? warnings.map((item) => `- ${item}`) : ['- Aucun signal critique immédiat.'],
    ``,
    `### Questions à préparer pour le pédiatre`,
    ...nextQuestions.length > 0 ? nextQuestions.map((item) => `- ${item}`) : ['- Comment se passe le sommeil et le comportement global ?'],
  ];

  return {
    report: reportLines.join('\n'),
    summary,
    riskLevel,
    indicators,
    recommendations,
    nextQuestions,
    modelUsed: 'fallback-heuristic-infant',
    heartRate,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as HealthAnalysisInput;
    const model = process.env.OPENROUTER_MODEL || 'openai/gpt-3.5-mini';
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return NextResponse.json(buildFallbackReport(body));
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
          nutrition: getInfantIndicator(carnet.alimentation, 'nutrition') as 'Excellent' | 'Bon' | 'À améliorer',
          hydration: getInfantIndicator(carnet.hydration, 'hydration') as 'Bonne' | 'Moyenne' | 'Faible',
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
      console.error('OpenRouter infant analysis failed, applying heuristic fallback:', error);
      return NextResponse.json(buildFallbackReport(body));
    }
  } catch (error: unknown) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : 'Infant analysis failed';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
