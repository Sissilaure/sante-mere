import { NextRequest, NextResponse } from 'next/server';
import { openRouterChat } from '../../lib/openrouter';

// Types pour la réponse de l'IA
interface ExtractedVaccine {
  nom: string;
  date: string | null;
  statut: 'Fait' | 'Planifié' | 'Inconnu';
}

interface AIExtractionResult {
  date_de_naissance: string | null;
  vaccins: ExtractedVaccine[];
  summary?: string;
  advice?: string;
}

// Calendrier OMS de référence (0-24 mois)
const OMS_SCHEDULE: { ageMonth: number; vaccine: string }[] = [
  { ageMonth: 0, vaccine: 'BCG' },
  { ageMonth: 0, vaccine: 'Hépatite B (naissance)' },
  { ageMonth: 0, vaccine: 'Polio 0' },
  { ageMonth: 1.5, vaccine: 'DTC-HepB-Hib 1' },
  { ageMonth: 1.5, vaccine: 'Polio 1' },
  { ageMonth: 1.5, vaccine: 'Pneumocoque 1' },
  { ageMonth: 1.5, vaccine: 'Rotavirus 1' },
  { ageMonth: 2.5, vaccine: 'DTC-HepB-Hib 2' },
  { ageMonth: 2.5, vaccine: 'Polio 2' },
  { ageMonth: 2.5, vaccine: 'Rotavirus 2' },
  { ageMonth: 3.5, vaccine: 'DTC-HepB-Hib 3' },
  { ageMonth: 3.5, vaccine: 'Polio 3' },
  { ageMonth: 3.5, vaccine: 'Pneumocoque 2' },
  { ageMonth: 3.5, vaccine: 'Rotavirus 3' },
  { ageMonth: 9, vaccine: 'Rougeole-Rubéole' },
  { ageMonth: 9, vaccine: 'Fièvre jaune' },
  { ageMonth: 9, vaccine: 'Vitamine A' },
  { ageMonth: 15, vaccine: 'Rappel DTC-HepB-Hib' },
  { ageMonth: 15, vaccine: 'Rappel Polio' },
  { ageMonth: 15, vaccine: 'Rappel Pneumocoque' },
];

// Normalisation du nom du vaccin
function normalizeVaccineName(name: string): string {
  const n = name.toLowerCase().trim();
  if (n.includes('bcg')) return 'BCG';
  if (n.includes('hépatite') && n.includes('naissance')) return 'Hépatite B (naissance)';
  if (n.includes('dtc') || n.includes('diphterie')) {
    if (n.includes('1')) return 'DTC-HepB-Hib 1';
    if (n.includes('2')) return 'DTC-HepB-Hib 2';
    if (n.includes('3')) return 'DTC-HepB-Hib 3';
    if (n.includes('rappel')) return 'Rappel DTC-HepB-Hib';
  }
  return name;
}

// Comparaison avec le calendrier OMS
function evaluateVaccinationStatus(extractedVaccines: ExtractedVaccine[], childAgeMonth: number) {
  const doneOrPlanned = new Set<string>();
  const doneVaccines: { vaccine: string; date: string }[] = [];
  const plannedVaccines: { vaccine: string; date?: string }[] = [];

  for (const v of extractedVaccines) {
    const nom = normalizeVaccineName(v.nom);
    if (v.statut === 'Fait' && v.date) {
      doneVaccines.push({ vaccine: nom, date: v.date });
      doneOrPlanned.add(nom);
    } else if (v.statut === 'Planifié') {
      plannedVaccines.push({ vaccine: nom, date: v.date ?? undefined });
      doneOrPlanned.add(nom);
    }
  }

  const expectedBeforeNow = OMS_SCHEDULE.filter(v => v.ageMonth <= childAgeMonth);
  const upcoming = OMS_SCHEDULE.filter(
    v => v.ageMonth > childAgeMonth && v.ageMonth <= childAgeMonth + 1
  );

  const upToDate = doneVaccines.filter(v => 
    expectedBeforeNow.some(e => normalizeVaccineName(e.vaccine) === normalizeVaccineName(v.vaccine))
  );

  const upcomingVaccines = upcoming.map(u => ({
    vaccine: u.vaccine,
    date: `À ${u.ageMonth} mois`
  }));

  const missingUrgent = expectedBeforeNow
    .filter(e => !doneOrPlanned.has(normalizeVaccineName(e.vaccine)))
    .map(e => ({ vaccine: e.vaccine }));

  return { upToDate, upcomingVaccines, missingUrgent };
}

function resolveAgeMonth(ageInput: FormDataEntryValue | null): number | null {
  if (ageInput && !isNaN(Number(ageInput))) {
    const parsed = Number(ageInput);
    return parsed >= 0 ? parsed : 0;
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('image') as File | null;
    const ageInput = formData.get('ageMonth');

    if (!file) {
      return NextResponse.json({ error: 'Aucune image fournie.' }, { status: 400 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    const inputAgeMonth = resolveAgeMonth(ageInput);

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "Configuration manquante: OPENROUTER_API_KEY n'est pas chargée côté Next.js (utiliser .env.local à la racine du projet).",
        },
        { status: 500 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString('base64');
    const mimeType = file.type || 'image/jpeg';
    const imageDataUrl = `data:${mimeType};base64,${base64Image}`;

    const systemPrompt = `Tu es un expert en santé numérique africain spécialisé dans la pédiatrie. Analyse la photo de carnet de santé fournie. Extrais les informations de vaccination en JSON strict. Sois précis sur les dates et le statut (Fait, Planifié, Inconnu). Si tu vois des mentions de "BCG", "VPO", "Penta", "ROTA", "VPI", "VAR", "YF", traduis-les selon les standards OMS. Format de réponse attendu : { "date_de_naissance": "YYYY-MM-DD" ou null, "vaccins": [ { "nom": "nom du vaccin", "date": "YYYY-MM-DD" ou null, "statut": "Fait"|"Planifié"|"Inconnu" } ], "summary": "Bref résumé de l'état vaccinal", "advice": "Conseil pratique pour la maman" } Renvoie uniquement le JSON.`;

    const text = await openRouterChat([
  { role: 'system', content: systemPrompt },
  {
    role: 'user',
    content: [
      { type: 'text', text: 'Analyse ce carnet de santé et extrais les vaccins en JSON strict.' },
      { type: 'image_url', image_url: { url: imageDataUrl } },
    ],
  },
], 'openai/gpt-4o-mini');

    let extraction: AIExtractionResult;
    try {
      const cleanText = text.replace(/```json|```/g, '').trim();
      extraction = JSON.parse(cleanText);
    } catch {
      console.error("JSON Parsing Error:", text);
      return NextResponse.json(
        { error: "Erreur d'analyse des données de l'image. Assurez-vous que la photo est nette." },
        { status: 422 }
      );
    }

    let ageMonth: number | null = inputAgeMonth;
    if (ageMonth === null && extraction.date_de_naissance) {
      const birthDate = new Date(extraction.date_de_naissance);
      const now = new Date();
      const diffMonth = (now.getFullYear() - birthDate.getFullYear()) * 12 +
        (now.getMonth() - birthDate.getMonth());
      ageMonth = diffMonth >= 0 ? diffMonth : 0;
    }

    if (ageMonth === null) {
      return NextResponse.json(
        { error: "Impossible de déterminer l'âge. Veuillez l'entrer manuellement." },
        { status: 400 }
      );
    }

    const { upToDate, upcomingVaccines, missingUrgent } = evaluateVaccinationStatus(
      extraction.vaccins || [],
      ageMonth
    );

    return NextResponse.json({
      upToDate,
      upcomingVaccines,
      missingUrgent,
      conseil: extraction.advice || 'Suivi normal.',
      summary: extraction.summary || '',
      ageMonth,
    });
  } catch (error: unknown) {
    console.error('OpenRouter Analyze Error:', error);
    const msg = error instanceof Error ? error.message : 'Erreur inconnue';
    if (msg.includes('API key')) return NextResponse.json({ error: 'Clé API invalide ou expirée.' }, { status: 401 });
    if (msg.includes('quota')) return NextResponse.json({ error: 'Quota API dépassé.' }, { status: 429 });

    return NextResponse.json(
      { error: `Erreur service AI : ${msg}` },
      { status: 500 }
    );
  }
}

