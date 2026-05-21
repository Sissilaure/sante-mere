export type OpenRouterChatContent =
  | string
  | Array<
      | { type: 'input_text'; text: string }
      | { type: 'image_url'; image_url: { url: string } }
    >;

export interface OpenRouterChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: OpenRouterChatContent;
}

export async function openRouterChat(
  messages: OpenRouterChatMessage[],
  model ='openai/gpt-3.5-mini'
) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY manquante');
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.2,
      max_tokens: 1200,
    }),
  });

  const text = await response.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = null;
  }

  if (!response.ok) {
    const errorMessage = body?.error?.message || text || 'Erreur OpenRouter inconnue';
    throw new Error(errorMessage);
  }

  const choice = body.choices?.[0];
  if (!choice || !choice.message) {
    throw new Error('OpenRouter : aucune réponse disponible');
  }

  const content = choice.message.content;
  if (typeof content === 'string') {
    return content;
  }

  if (content?.text) {
    return content.text;
  }

  return JSON.stringify(content);
}
