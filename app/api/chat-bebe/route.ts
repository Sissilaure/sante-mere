import { NextRequest, NextResponse } from 'next/server';
import { openRouterChat, type OpenRouterChatMessage } from '../../lib/openrouter';

type MessageRequest = { 
  role: 'user' | 'model'; 
  text?: string;
  image?: string;
};

function isValidMessages(messages: unknown): messages is MessageRequest[] {
  if (!Array.isArray(messages)) return false;
  return messages.every((m) => {
    if (typeof m !== 'object' || m === null) return false;
    const candidate = m as { role?: unknown; text?: unknown; image?: unknown };
    return (
      (candidate.role === 'user' || candidate.role === 'model') &&
      (typeof candidate.text === 'string' || typeof candidate.image === 'string')
    );
  });
}

function buildMessageContent(message: MessageRequest) {
  const parts: string[] = [];
  if (message.text) parts.push(message.text);
  if (message.image) parts.push('Le message contient une image du carnet de santé. Analyse le contexte santé en conséquence.');
  return parts.join('\n\n') || 'Message vide.';
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { messages?: unknown };
    if (!isValidMessages(body.messages)) {
      return NextResponse.json({ error: 'Historique de messages invalide.' }, { status: 400 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Configuration manquante : définissez OPENROUTER_API_KEY.' },
        { status: 500 }
      );
    }

    const messages = body.messages as MessageRequest[];
    if (!messages || messages.length === 0) {
      return NextResponse.json({ reply: "Bonjour ! Je suis PediIA. Comment se porte votre bébé ?" });
    }

    const systemPrompt = `Tu es PediIA, une assistante virtuelle spécialisée dans la santé du nourrisson et du jeune enfant en Afrique. Tu donnes des informations générales : alimentation/allaitement, fièvre, diarrhée, sommeil, prévention, vaccination, hygiène. ⚠️ Tu n'es pas médecin. Si symptômes graves : difficulté à respirer, convulsions, somnolence inhabituelle, refus de boire, déshydratation, sang dans les selles, fièvre élevée persistante, jaunisse importante, ou bébé < 3 mois avec fièvre → urgence/centre de santé. Réponds en français simple, structuré (titres + puces), avec 1) évaluation rapide, 2) gestes à faire, 3) quand consulter. Si âge/poids/température/manifestations manquants, pose 1 à 3 questions ciblées.`;

    const openRouterMessages: OpenRouterChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m) => {
        const role: 'user' | 'assistant' = m.role === 'user' ? 'user' : 'assistant';
        return {
          role,
          content: buildMessageContent(m),
        };
      }),
    ];

    const reply = await openRouterChat(openRouterMessages, 'gpt-4o-mini');

    return NextResponse.json({ reply });
  } catch (error: unknown) {
    console.error('OpenRouter API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    return NextResponse.json(
      { error: `Désolée, une erreur est survenue dans le moteur AI : ${errorMessage}` },
      { status: 500 }
    );
  }
}
