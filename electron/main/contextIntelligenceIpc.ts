import {
  app,
  ipcMain,
  safeStorage,
  type WebContents,
  BrowserWindow,
} from "electron";
import fs from "node:fs/promises";
import path from "node:path";
import https from "node:https";

// ─── Types ──────────────────────────────────────────────────────────────────

export type AiProvider = "openai" | "groq";

export type AiProducerCard =
  | { type: "lower_third"; headline: string; subline: string; confidence: number }
  | { type: "key_metric"; headline: string; subline: string; confidence: number }
  | { type: "quote"; quote: string; attribution?: string; confidence: number }
  | { type: "citation"; reference: string; body?: string; confidence: number }
  | { type: "agenda_item"; item: string; confidence: number };

interface ApiKeySet {
  openai?: string;
  groq?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const KEY_FILE_NAME = "ai_context_keys.enc";
const OPENAI_ENDPOINT = "api.openai.com";
const GROQ_ENDPOINT = "api.groq.com";

// Circuit-breaker: after 3 consecutive failures, pause 60s
const CIRCUIT_BREAKER_THRESHOLD = 3;
const CIRCUIT_BREAKER_COOLDOWN_MS = 60_000;

let consecutiveFailures = 0;
let circuitOpenedAt: number | null = null;

function isCircuitOpen(): boolean {
  if (circuitOpenedAt === null) return false;
  if (Date.now() - circuitOpenedAt > CIRCUIT_BREAKER_COOLDOWN_MS) {
    consecutiveFailures = 0;
    circuitOpenedAt = null;
    return false;
  }
  return true;
}

function recordSuccess() {
  consecutiveFailures = 0;
  circuitOpenedAt = null;
}

function recordFailure() {
  consecutiveFailures++;
  if (consecutiveFailures >= CIRCUIT_BREAKER_THRESHOLD) {
    circuitOpenedAt = Date.now();
  }
}

// ─── Secure Storage ──────────────────────────────────────────────────────────

function getKeyFilePath(): string {
  return path.join(app.getPath("userData"), "secrets", KEY_FILE_NAME);
}

function isSafeStorageAvailable(): boolean {
  return safeStorage.isEncryptionAvailable();
}

async function readKeysFromStorage(): Promise<ApiKeySet> {
  if (!isSafeStorageAvailable()) return {};
  try {
    const encrypted = await fs.readFile(getKeyFilePath());
    if (!encrypted.length) return {};
    const json = safeStorage.decryptString(encrypted).trim();
    return JSON.parse(json) as ApiKeySet;
  } catch {
    return {};
  }
}

async function writeKeysToStorage(keys: ApiKeySet): Promise<void> {
  const filePath = getKeyFilePath();
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const json = JSON.stringify(keys);
  const encrypted = safeStorage.encryptString(json);
  await fs.writeFile(filePath, encrypted);
}

async function setProviderKey(provider: AiProvider, apiKey: string) {
  if (!isSafeStorageAvailable()) {
    return { success: false, error: "Secure storage not available on this system." };
  }
  const trimmed = apiKey.trim();
  if (!trimmed) return { success: false, error: "API key cannot be empty." };

  const keys = await readKeysFromStorage();
  keys[provider] = trimmed;
  await writeKeysToStorage(keys);
  // Clear cached model list on new key
  cachedGroqModels = [];
  return { success: true };
}

async function clearProviderKey(provider: AiProvider) {
  const keys = await readKeysFromStorage();
  delete keys[provider];
  await writeKeysToStorage(keys);
  cachedGroqModels = [];
  return { success: true };
}

async function getProviderKey(provider: AiProvider): Promise<string | null> {
  const keys = await readKeysFromStorage();
  return keys[provider]?.trim() || null;
}

// ─── HTTP Helpers (node:https) ───────────────────────────────────────────────

function httpsGet(
  hostname: string,
  path: string,
  headers: Record<string, string>,
  timeoutMs = 10_000,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const options = {
      hostname,
      path,
      method: "GET",
      headers,
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 200)}`));
        }
      });
    });

    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error("Request timed out"));
    });

    req.on("error", reject);
    req.end();
  });
}

function httpsPost(
  hostname: string,
  path: string,
  headers: Record<string, string>,
  body: string,
  timeoutMs = 12_000,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const options = {
      hostname,
      path,
      method: "POST",
      headers: { ...headers, "Content-Length": Buffer.byteLength(body) },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 200)}`));
        }
      });
    });

    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error("Request timed out"));
    });

    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

// ─── Dynamic Groq Model Discovery ───────────────────────────────────────────

let cachedGroqModels: string[] = [];
let lastGroqModelFetch = 0;

async function getAvailableGroqModels(apiKey: string): Promise<string[]> {
  const now = Date.now();
  if (cachedGroqModels.length > 0 && now - lastGroqModelFetch < 300_000) {
    return cachedGroqModels;
  }

  try {
    console.log("🧠 [AI Context Intelligence] Querying live available models directly from https://api.groq.com/openai/v1/models...");
    const raw = await httpsGet(
      GROQ_ENDPOINT,
      "/openai/v1/models",
      { Authorization: `Bearer ${apiKey}` },
    );
    const data = JSON.parse(raw);
    if (Array.isArray(data?.data)) {
      const chatModels = data.data
        .map((m: any) => m.id as string)
        .filter(
          (id: string) =>
            !id.includes("whisper") &&
            !id.includes("embed") &&
            !id.includes("tts") &&
            !id.includes("guard"),
        );

      if (chatModels.length > 0) {
        console.log("🧠 [AI Context Intelligence] Discovered live Groq models from API:", chatModels);
        cachedGroqModels = chatModels;
        lastGroqModelFetch = now;
        return chatModels;
      }
    }
  } catch (err) {
    console.warn("🧠 [AI Context Intelligence] Could not fetch live models list from Groq:", err);
  }

  // Common active fallback candidates
  return [
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "gemma2-9b-it",
    "deepseek-r1-distill-llama-70b",
    "qwen-2.5-32b",
  ];
}

// ─── AI Prompt & Parser ──────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert live broadcast UI designer & AI producer assistant for Wingrid event software.
You receive live speech transcript chunks from presentations, conferences, worship services, keynotes, lectures, or meetings.
Your job is to extract cohesive visual cards AND generate dynamic, colorful HTML+Tailwind UI code blocks that operators can push directly to presentation screens.

Synthesis & Grouping Rules (CRITICAL):
1. GROUP & SYNTHESIZE RELATED TEXT: Do NOT split sentences or related ideas into multiple fragmented cards. Work on collective context. If the speaker mentions multiple stats, points, or steps on a topic, synthesize them together into a SINGLE unified, rich card (e.g. multi-stat grid, structured list, or takeaway card).
2. Quality over Quantity: Output at most 1 or 2 comprehensive, meaningful cards per transcript chunk rather than a flood of micro-cards.
3. Extract ONLY what is clearly mentioned in the speech. Never fabricate facts. Return a JSON array of cards.

Each card in the JSON array must have:
- type: "lower_third" | "key_metric" | "quote" | "citation" | "agenda_item" | "custom_ui"
- headline: Brief title or main text (max 7 words)
- subline: (optional) Subtitle, attribution, context, or detail
- themeColor: A vibrant color theme matching the context. Choose one of: "emerald" (growth/money/finance), "blue" (tech/corporate/trust), "purple" (wisdom/vision/quotes), "amber" (scriptures/citations/awards), "rose" (urgency/passion/highlights), "cyan" (speakers/modern tech), "orange" (action/energy/events), "indigo" (agendas/strategy).
- confidence: number (0.75 - 1.0)
- htmlCode: A self-contained, sleek, high-impact React/HTML code block using className='...' with standard Tailwind CSS classes matching the themeColor.

UI Code Block Design Guidelines for htmlCode:
1. Always use className='...' for all Tailwind utility classes.
2. Design for live audience projection screens with dark glassmorphism, glowing borders, modern typography, and vibrant accents corresponding to the card's themeColor.
3. For unified multi-stat or multi-point topics, use a clean grid/flex layout (e.g. 2-column or 3-item row) inside the single card htmlCode.
4. For lower_third: Broadcast speaker banner with glowing live indicator dot and title in themeColor.
5. For key_metric: Huge prominent metric figure (or multi-metric pill grid) + stat badge and description matching the themeColor.
6. For quote: Quotation marks + bold quote statement + attribution.
7. For citation/scripture: Scripture/book badge in amber/gold + highlighted verse/excerpt body.
8. For visual concepts: You can creatively include high-quality royalty-free image URLs (e.g. from Unsplash https://images.unsplash.com/...) or decorative SVG elements when fitting the topic.

Card Examples:
[
  {
    "type": "lower_third",
    "headline": "Dr. Sarah Jenkins",
    "subline": "Chief Medical Officer • AI Health",
    "themeColor": "cyan",
    "confidence": 0.95,
    "htmlCode": "<div className=\\"bg-neutral-950/90 backdrop-blur-2xl border border-cyan-500/30 rounded-2xl p-5 shadow-2xl flex items-center gap-4 max-w-xl mx-auto\\"><div className=\\"w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-white font-bold text-lg shadow-lg\\">SJ</div><div><div className=\\"flex items-center gap-2\\"><span className=\\"text-xs font-bold uppercase tracking-widest text-cyan-400\\">Speaker</span><span className=\\"w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse\\"></span></div><h2 className=\\"text-2xl font-black text-white leading-tight\\">Dr. Sarah Jenkins</h2><p className=\\"text-sm text-neutral-300 font-medium\\">Chief Medical Officer • AI Health</p></div></div>"
  },
  {
    "type": "key_metric",
    "headline": "Q3 Growth Metrics",
    "subline": "$4.2M ARR (+35% YoY) • 98% Retention",
    "themeColor": "emerald",
    "confidence": 0.92,
    "htmlCode": "<div className=\\"bg-neutral-950/90 backdrop-blur-2xl border border-emerald-500/30 rounded-3xl p-6 shadow-2xl max-w-lg mx-auto text-center flex flex-col items-center gap-3\\"><span className=\\"px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold tracking-wider uppercase border border-emerald-500/30\\">Q3 Growth Summary</span><div className=\\"grid grid-cols-2 gap-4 w-full pt-1\\"><div className=\\"bg-white/[0.04] p-3 rounded-2xl border border-white/10\\"><div className=\\"text-3xl font-black text-white\\">$4.2M</div><div className=\\"text-xs text-emerald-400 font-semibold mt-0.5\\">+35% YoY ARR</div></div><div className=\\"bg-white/[0.04] p-3 rounded-2xl border border-white/10\\"><div className=\\"text-3xl font-black text-white\\">98%</div><div className=\\"text-xs text-emerald-400 font-semibold mt-0.5\\">Customer Retention</div></div></div></div>"
  },
  {
    "type": "quote",
    "headline": "Consistency beats intensity every single time.",
    "subline": "Keynote Speaker",
    "themeColor": "purple",
    "confidence": 0.90,
    "htmlCode": "<div className=\\"bg-neutral-950/90 backdrop-blur-2xl border border-purple-500/30 rounded-3xl p-6 shadow-2xl max-w-2xl mx-auto flex flex-col gap-2\\"><div className=\\"text-purple-400 text-3xl font-serif leading-none\\">“</div><p className=\\"text-2xl font-extrabold text-white leading-snug\\">Consistency beats intensity every single time.</p><div className=\\"text-xs text-purple-300 font-bold mt-1\\">— Keynote Speaker</div></div>"
  }
]

Rules:
1. Prioritize grouped, cohesive context cards over fragmented micro-outputs.
2. Only return cards with confidence > 0.75.
3. Return [] if nothing meaningful is found.
4. Return ONLY valid raw JSON array — no markdown fences.
5. Limit to 1 or 2 comprehensive cards per call.`;

function buildMessages(transcript: string) {
  return [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: `Extract visual cards with colorful dynamic HTML+Tailwind UI code blocks from this live speech excerpt:\n\n"${transcript.slice(-1200)}"`,
    },
  ];
}

function ensureCardHtmlCode(card: any, themeColor: string): string {
  if (card.htmlCode && typeof card.htmlCode === "string" && card.htmlCode.trim().length > 0) {
    return card.htmlCode.trim();
  }

  const headline = card.headline || card.quote || card.reference || card.item || "Highlight";
  const subline = card.subline || card.attribution || card.body || "";

  switch (card.type) {
    case "lower_third":
      return `<div className="bg-neutral-950/90 backdrop-blur-2xl border border-cyan-500/30 rounded-2xl p-5 shadow-2xl flex items-center gap-4 max-w-xl mx-auto"><div className="w-12 h-12 rounded-full bg-cyan-600/30 border border-cyan-400/40 flex items-center justify-center text-cyan-300 font-bold text-lg">★</div><div><div className="flex items-center gap-2"><span className="text-xs font-bold uppercase tracking-widest text-cyan-400">Speaker</span><span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span></div><h2 className="text-2xl font-black text-white leading-tight">${headline}</h2>${subline ? `<p className="text-sm text-neutral-300 font-medium">${subline}</p>` : ""}</div></div>`;
    case "key_metric":
      return `<div className="bg-neutral-950/90 backdrop-blur-2xl border border-emerald-500/30 rounded-3xl p-6 shadow-2xl max-w-md mx-auto text-center flex flex-col items-center gap-2"><span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold tracking-wider uppercase border border-emerald-500/30">Key Metric</span><div className="text-5xl font-black tracking-tight text-white">${headline}</div>${subline ? `<p className="text-sm text-neutral-300 font-medium">${subline}</p>` : ""}</div>`;
    case "quote":
      return `<div className="bg-neutral-950/90 backdrop-blur-2xl border border-purple-500/30 rounded-3xl p-6 shadow-2xl max-w-2xl mx-auto flex flex-col gap-2"><div className="text-purple-400 text-3xl font-serif leading-none">“</div><p className="text-2xl font-extrabold text-white leading-snug">${headline}</p>${subline ? `<div className="text-xs text-purple-300 font-bold mt-1">— ${subline}</div>` : ""}</div>`;
    case "citation":
      return `<div className="bg-neutral-950/90 backdrop-blur-2xl border border-amber-500/30 rounded-2xl p-6 shadow-2xl max-w-xl mx-auto flex flex-col gap-2"><span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold w-fit border border-amber-500/30">${headline}</span>${subline ? `<p className="text-base text-neutral-200 font-medium">${subline}</p>` : ""}</div>`;
    default:
      return `<div className="bg-neutral-950/90 backdrop-blur-2xl border border-white/20 rounded-2xl p-6 shadow-2xl max-w-xl mx-auto"><h3 className="text-xl font-bold text-white">${headline}</h3>${subline ? `<p className="text-sm text-neutral-300 mt-1">${subline}</p>` : ""}</div>`;
  }
}

function normalizeTheme(theme: any, cardType: string): string {
  const allowed = ["emerald", "blue", "purple", "amber", "rose", "cyan", "orange", "indigo"];
  if (typeof theme === "string" && allowed.includes(theme.toLowerCase())) {
    return theme.toLowerCase();
  }
  switch (cardType) {
    case "lower_third":
      return "cyan";
    case "key_metric":
      return "emerald";
    case "quote":
      return "purple";
    case "citation":
      return "amber";
    case "agenda_item":
      return "indigo";
    default:
      return "rose";
  }
}

function parseCards(raw: string): AiProducerCard[] {
  try {
    const cleaned = raw.replace(/```[a-z]*\n?/gi, "").trim();
    let parsed: any;

    try {
      parsed = JSON.parse(cleaned);
    } catch {
      const firstBracket = cleaned.indexOf("[");
      const lastBracket = cleaned.lastIndexOf("]");
      if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
        parsed = JSON.parse(cleaned.slice(firstBracket, lastBracket + 1));
      } else {
        const firstBrace = cleaned.indexOf("{");
        const lastBrace = cleaned.lastIndexOf("}");
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          parsed = JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
        }
      }
    }

    const arr = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.cards)
        ? parsed.cards
        : Array.isArray(parsed?.visual_cards)
          ? parsed.visual_cards
          : [parsed];

    return arr
      .filter(
        (c: any) =>
          c &&
          typeof c === "object" &&
          (c.type || c.htmlCode) &&
          (c.headline || c.quote || c.reference || c.item || c.htmlCode),
      )
      .map((c: any) => {
        const type = c.type || "custom_ui";
        const themeColor = normalizeTheme(c.themeColor, type);
        return {
          ...c,
          type,
          headline: c.headline || c.quote || c.reference || c.item || "Context Card",
          subline: c.subline || c.attribution || c.body || undefined,
          themeColor,
          htmlCode: ensureCardHtmlCode(c, themeColor),
          confidence: typeof c.confidence === "number" ? c.confidence : 0.88,
        };
      }) as AiProducerCard[];
  } catch (err) {
    console.error("🧠 [AI Context Intelligence] Failed to parse cards:", err, "Raw response:", raw);
    return [];
  }
}

// ─── Core Analyze Function ───────────────────────────────────────────────────

async function analyzeTranscript(
  provider: AiProvider,
  apiKey: string,
  transcript: string,
): Promise<{ cards: AiProducerCard[]; error?: string }> {
  if (isCircuitOpen()) {
    const remaining = Math.ceil(
      (CIRCUIT_BREAKER_COOLDOWN_MS - (Date.now() - circuitOpenedAt!)) / 1000,
    );
    return { cards: [], error: `Circuit open — paused for ${remaining}s after repeated failures.` };
  }

  const messages = buildMessages(transcript);
  const isGroq = provider === "groq";
  const hostname = isGroq ? GROQ_ENDPOINT : OPENAI_ENDPOINT;
  const apiPath = isGroq ? "/openai/v1/chat/completions" : "/v1/chat/completions";

  // Dynamically query live models from Groq API endpoint
  const modelsToTry = isGroq
    ? await getAvailableGroqModels(apiKey)
    : ["gpt-4o-mini", "gpt-3.5-turbo"];

  let lastError = "";

  for (const model of modelsToTry) {
    const bodyFinal = JSON.stringify({
      model,
      messages,
      max_tokens: 512,
      temperature: 0.2,
      ...(isGroq ? {} : { response_format: { type: "json_object" } }),
    });

    try {
      console.log(`🧠 [AI Context Intelligence] Requesting ${provider} with model: ${model}...`);
      const raw = await httpsPost(
        hostname,
        apiPath,
        {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        bodyFinal,
      );

      const json = JSON.parse(raw);
      const content: string = json?.choices?.[0]?.message?.content ?? "[]";
      console.log(`🧠 [AI Context Intelligence] Response from ${model}:`, content);

      const cards = parseCards(content);
      recordSuccess();
      return { cards };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      lastError = message;
      console.warn(`🧠 [AI Context Intelligence] Model ${model} returned error (${message}), trying next live model...`);

      // If invalid API key (401), stop immediately
      if (
        message.includes("401") ||
        message.includes("invalid_api_key") ||
        message.includes("Unauthorized")
      ) {
        recordFailure();
        return { cards: [], error: message };
      }
    }
  }

  recordFailure();
  return { cards: [], error: lastError || "All available models failed." };
}

// ─── IPC Registration ────────────────────────────────────────────────────────

let registered = false;

export function registerContextIntelligenceIpc() {
  if (registered) return;
  registered = true;

  // Set API key for a provider
  ipcMain.handle(
    "ai-context-set-key",
    async (_event, provider: AiProvider, apiKey: string) => {
      try {
        return await setProviderKey(provider, apiKey);
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : String(err) };
      }
    },
  );

  // Clear API key for a provider
  ipcMain.handle("ai-context-clear-key", async (_event, provider: AiProvider) => {
    try {
      return await clearProviderKey(provider);
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  });

  // Get key status
  ipcMain.handle("ai-context-get-key-status", async () => {
    const keys = await readKeysFromStorage();
    return {
      success: true,
      openai: Boolean(keys.openai),
      groq: Boolean(keys.groq),
      safeStorageAvailable: isSafeStorageAvailable(),
    };
  });

  // Core analyze call — renderer sends rolling transcript text
  ipcMain.handle(
    "ai-context-analyze",
    async (
      event,
      payload: { provider: AiProvider; transcript: string },
    ) => {
      const { provider, transcript } = payload;

      console.log(
        `🧠 [IPC ai-context-analyze] Provider: ${provider}, Transcript (${transcript?.length || 0} chars): "${(transcript || "").slice(-80)}"`,
      );

      if (!transcript || transcript.trim().length < 10) {
        return { success: true, cards: [] };
      }

      const apiKey = await getProviderKey(provider);
      if (!apiKey) {
        console.warn(`🧠 [IPC ai-context-analyze] No API key configured for ${provider}`);
        return {
          success: false,
          error: `No API key configured for ${provider}. Set one in Settings → Context Intelligence.`,
          cards: [],
        };
      }

      const result = await analyzeTranscript(provider, apiKey, transcript);
      console.log(
        `🧠 [IPC ai-context-analyze] Success: ${!result.error}, Extracted ${result.cards?.length || 0} cards`,
        result.error ? `Error: ${result.error}` : "",
      );
      return { success: !result.error, cards: result.cards, error: result.error };
    },
  );

  // Test connection with a canned phrase
  ipcMain.handle("ai-context-test", async (_event, provider: AiProvider) => {
    const apiKey = await getProviderKey(provider);
    if (!apiKey) {
      return { success: false, error: "No API key set for this provider." };
    }
    const result = await analyzeTranscript(
      provider,
      apiKey,
      "Welcome everyone, I'm Dr. Sarah Jenkins, Chief Medical Officer. Today we'll cover Item 1: Q3 results. Revenue reached $4.2M this quarter. As I always say, consistency beats intensity every single time.",
    );
    return { success: true, cards: result.cards, error: result.error };
  });
}

export function shutdownContextIntelligenceIpc() {
  cachedGroqModels = [];
}
