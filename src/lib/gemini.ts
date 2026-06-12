// Cliente Gemini (Google AI) direto do navegador — sem backend.
// A chave vem de VITE_GEMINI_API_KEY (.env.local) ou do localStorage
// (colada pelo usuário na própria tela do chat).

const BASE = 'https://generativelanguage.googleapis.com/v1beta';
const KEY_STORAGE = 'gemini_api_key';

export function getApiKey(): string | null {
  return (
    (import.meta.env.VITE_GEMINI_API_KEY as string | undefined) ||
    localStorage.getItem(KEY_STORAGE) ||
    null
  );
}

export function setApiKey(key: string) {
  localStorage.setItem(KEY_STORAGE, key.trim());
}

export interface ChatTurn {
  role: 'user' | 'model';
  text: string;
}

let modelPromise: Promise<string> | null = null;

/** Escolhe dinamicamente um modelo Gemini disponível para a chave (prefere flash). */
async function pickModel(apiKey: string): Promise<string> {
  modelPromise ??= (async () => {
    try {
      const res = await fetch(`${BASE}/models?pageSize=200&key=${apiKey}`);
      if (!res.ok) throw new Error(`ListModels ${res.status}`);
      const data = await res.json();
      const usable: string[] = (data.models ?? [])
        .filter((m: { supportedGenerationMethods?: string[] }) =>
          m.supportedGenerationMethods?.includes('generateContent')
        )
        .map((m: { name: string }) => m.name.replace(/^models\//, ''));
      const prefer = [
        /^gemini-\d+(\.\d+)?-flash$/, // estável, ex.: gemini-2.5-flash
        /^gemini-flash-latest$/,
        /flash/,
        /^gemini-\d+(\.\d+)?-pro$/,
      ];
      for (const re of prefer) {
        const hit = usable
          .filter((n) => re.test(n) && !/preview|exp|image|tts|embed|live|audio/.test(n))
          .sort()
          .reverse()[0];
        if (hit) return hit;
      }
      return usable[0] ?? 'gemini-2.5-flash';
    } catch {
      return 'gemini-2.5-flash'; // fallback razoável se ListModels falhar
    }
  })();
  return modelPromise;
}

export async function chatWithGemini(
  systemPrompt: string,
  history: ChatTurn[]
): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('missing-api-key');

  const model = await pickModel(apiKey);
  const generationConfig: Record<string, unknown> = {
    temperature: 0.7,
    maxOutputTokens: 2048,
  };
  // Nos modelos 2.5 o "thinking" consome maxOutputTokens e trunca a resposta
  // no meio da frase; para um chat de loja ele não agrega — desligamos.
  if (/-2\.5-/.test(`-${model}-`) || model.includes('2.5')) {
    generationConfig.thinkingConfig = { thinkingBudget: 0 };
  }
  const res = await fetch(`${BASE}/models/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: history.map((t) => ({ role: t.role, parts: [{ text: t.text }] })),
      generationConfig,
    }),
  });

  if (res.status === 400 || res.status === 403) throw new Error('invalid-api-key');
  if (!res.ok) throw new Error(`gemini-error-${res.status}`);

  const data = await res.json();
  const text: string | undefined = data.candidates?.[0]?.content?.parts
    ?.map((p: { text?: string }) => p.text ?? '')
    .join('');
  if (!text) throw new Error('empty-response');
  return text.trim();
}
