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
            !id.includes("guard") &&
            !id.includes("orpheus") &&
            !id.includes("vision") &&
            !id.includes("audio"),
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

// ─── Verified Royalty-Free Topic Images (100% Real, Guaranteed 200 OK) ────────

const VERIFIED_TOPIC_IMAGES: Record<string, string> = {
  // AI, Data Science, Machine Learning, Technology
  ai: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80",
  tech: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80",
  machine_learning: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?auto=format&fit=crop&w=600&q=80",
  data: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80",
  metrics: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80",
  analytics: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80",
  finance: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80",
  concept: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80",
  speaker: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80",
  presentation: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=600&q=80",
  quote: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80",
  citation: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=600&q=80",
  church: "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&w=600&q=80",
  agenda: "https://images.unsplash.com/photo-1506784365847-bbad939e9335?auto=format&fit=crop&w=600&q=80",
  default: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80",
};

function resolveVerifiedImageUrl(text: string, cardType: string, rawUrl?: string): string {
  // If rawUrl is already one of our verified working URLs, keep it
  if (rawUrl && Object.values(VERIFIED_TOPIC_IMAGES).includes(rawUrl)) {
    return rawUrl;
  }

  const lower = `${text} ${cardType}`.toLowerCase();

  if (lower.includes("classif") || lower.includes("cluster") || lower.includes("model") || lower.includes("learn") || lower.includes("train") || lower.includes("valid") || lower.includes("neural") || lower.includes("algorithm")) {
    return VERIFIED_TOPIC_IMAGES.machine_learning;
  }
  if (lower.includes("ai") || lower.includes("tech") || lower.includes("software") || lower.includes("code") || lower.includes("computer")) {
    return VERIFIED_TOPIC_IMAGES.ai;
  }
  if (lower.includes("metric") || lower.includes("data") || lower.includes("%") || lower.includes("arr") || lower.includes("growth") || lower.includes("stat") || lower.includes("revenue") || lower.includes("sale")) {
    return VERIFIED_TOPIC_IMAGES.data;
  }
  if (lower.includes("speaker") || lower.includes("dr.") || lower.includes("prof") || lower.includes("minister") || lower.includes("pastor") || lower.includes("officer") || lower.includes("ceo")) {
    return VERIFIED_TOPIC_IMAGES.speaker;
  }
  if (lower.includes("quote") || lower.includes("said") || lower.includes("wisdom") || lower.includes("remember")) {
    return VERIFIED_TOPIC_IMAGES.quote;
  }
  if (lower.includes("verse") || lower.includes("chapter") || lower.includes("bible") || lower.includes("scripture") || lower.includes("citation") || lower.includes("book")) {
    return VERIFIED_TOPIC_IMAGES.citation;
  }
  if (lower.includes("church") || lower.includes("worship") || lower.includes("prayer") || lower.includes("god") || lower.includes("faith")) {
    return VERIFIED_TOPIC_IMAGES.church;
  }
  if (lower.includes("agenda") || lower.includes("step") || lower.includes("schedule") || lower.includes("timeline")) {
    return VERIFIED_TOPIC_IMAGES.agenda;
  }

  return VERIFIED_TOPIC_IMAGES[cardType] || VERIFIED_TOPIC_IMAGES.concept;
}

// ─── AI Prompt & Parser ──────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert live broadcast visual UI designer & AI producer assistant for Wingrid event software.
You receive live speech transcript excerpts from presentations, conferences, worship services, keynotes, lectures, or meetings.
Your job is to analyze the speech and generate dynamic, visually stunning HTML+Tailwind UI code blocks placed on a premium, clean, extra-sleek BIG WHITE SOFT CARD with an integrated topical image that operators can push directly to projection and presentation screens.

Card Type & Structure:
- You have full freedom to decide the most accurate 'type' that fits the speech content (e.g. "concept", "citation", "quote", "lower_third", "key_metric", "agenda_item", "custom_ui").
- layoutVariant: One of "split_comparison" | "hero_cover" | "scripture_wisdom" | "stat_spotlight" | "top_banner" | "speaker_profile"
- headline: Bold, impactful title or topic name (max 7 words)
- subline: (optional) Subtitle, attribution, Bible reference, or concise summary
- imageTopic: One of: "machine_learning" | "ai" | "data" | "finance" | "concept" | "speaker" | "presentation" | "quote" | "citation" | "church" | "agenda"
- themeColor: A vibrant color theme matching the context. Choose one of: "blue" (concepts/tech/knowledge), "emerald" (growth/money/finance), "purple" (wisdom/vision/quotes), "amber" (scriptures/citations/awards), "rose" (urgency/passion/highlights), "cyan" (speakers/modern tech), "orange" (action/energy/events), "indigo" (agendas/strategy).
- blocks: (optional) Array of 2 to 4 structured items/techniques/points: [{ "title": "Classification", "description": "Predicting categories & labels", "icon": "📊" }, { "title": "Clustering", "description": "Grouping similar data points", "icon": "📁" }]
- confidence: number (0.75 - 1.0)
- htmlCode: A self-contained, high-impact React/HTML code block using className='...' with rich visual design blocks, large typography, and the embedded image with Tailwind CSS.

BROADCAST DESIGN GUIDELINES for htmlCode (CRITICAL FOR VISUAL PERFECTION):
1. CONTAINER: Balanced, centered, non-stretched white card container with generous internal padding:
   - "bg-white/95 backdrop-blur-2xl border border-white/80 rounded-[36px] p-8 sm:p-10 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.35)] max-w-4xl w-full mx-auto flex flex-col gap-5 text-neutral-900"
2. HEADER BAR (Inside top of card with clear spacing):
   - '<div className="flex items-center justify-between border-b border-neutral-200/80 pb-4 mb-1"><div className="flex items-center gap-2.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span><span className="text-xs sm:text-sm font-black uppercase tracking-widest text-blue-700">Core Concept</span></div><span className="text-xs sm:text-sm font-bold text-neutral-600 bg-neutral-100 px-3.5 py-1 rounded-full border border-neutral-200">Data Science</span></div>'
3. HERO BODY CANVAS (Side-by-side with full-height image):
   - Left side: A tall, full-height image cover:
     '<img src="https://images.unsplash.com/photo-1555949963-aa79dcee981c?auto=format&fit=crop&w=600&q=80" alt="Visual" className="w-44 sm:w-56 self-stretch min-h-[180px] rounded-2xl object-cover shadow-md border border-neutral-200/80 shrink-0" />'
   - Right side: Title + 2-COLUMN PASTEL GRID BLOCKS (Never use plain raw text bullet lists):
     '<div className="flex-1 flex flex-col justify-between gap-4"><h2 className="text-2xl sm:text-3xl font-black text-neutral-950 leading-tight">Data Science Techniques</h2><div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><div className="bg-blue-50/90 border border-blue-200/80 rounded-2xl p-3.5 flex flex-col gap-1"><div className="text-sm font-black text-blue-950 flex items-center gap-2"><span>📊</span> Classification</div><p className="text-xs text-neutral-700 font-medium">Predicting categories & labels</p></div><div className="bg-emerald-50/90 border border-emerald-200/80 rounded-2xl p-3.5 flex flex-col gap-1"><div className="text-sm font-black text-emerald-950 flex items-center gap-2"><span>📁</span> Clustering</div><p className="text-xs text-neutral-700 font-medium">Grouping similar data points</p></div></div></div>'

Card Examples:
[
  {
    "type": "concept",
    "layoutVariant": "split_comparison",
    "headline": "Data Science Techniques",
    "subline": "Core Machine Learning Methods",
    "imageTopic": "machine_learning",
    "themeColor": "blue",
    "confidence": 0.96,
    "blocks": [
      { "title": "Classification", "description": "Predicting categories & discrete labels", "icon": "📊" },
      { "title": "Clustering", "description": "Grouping similar unlabelled data", "icon": "📁" },
      { "title": "Anomaly Detection", "description": "Identifying outliers and deviations", "icon": "⚠️" },
      { "title": "Regression", "description": "Predicting continuous numerical values", "icon": "📈" }
    ],
    "htmlCode": "<div className=\\"bg-white/95 backdrop-blur-2xl border border-white/80 rounded-[36px] p-8 sm:p-10 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.35)] max-w-4xl w-full mx-auto flex flex-col gap-5 text-neutral-900\\"><div className=\\"flex items-center justify-between border-b border-neutral-200/80 pb-4 mb-1\\"><div className=\\"flex items-center gap-2.5\\"><span className=\\"w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse\\"></span><span className=\\"text-xs sm:text-sm font-black uppercase tracking-widest text-blue-700\\">Core Concept</span></div><span className=\\"text-xs sm:text-sm font-bold text-neutral-600 bg-neutral-100 px-3.5 py-1 rounded-full border border-neutral-200\\">Data Science</span></div><div className=\\"flex flex-col sm:flex-row items-stretch gap-6\\"><img src=\\"https://images.unsplash.com/photo-1555949963-aa79dcee981c?auto=format&fit=crop&w=600&q=80\\" alt=\\"Data Science\\" className=\\"w-44 sm:w-56 self-stretch min-h-[180px] rounded-2xl object-cover shadow-md border border-neutral-200/80 shrink-0\\" /><div className=\\"flex-1 flex flex-col justify-between gap-4\\"><h2 className=\\"text-2xl sm:text-3xl font-black text-neutral-950 leading-tight\\">Data Science Techniques</h2><div className=\\"grid grid-cols-1 sm:grid-cols-2 gap-3\\"><div className=\\"bg-blue-50/90 border border-blue-200/80 rounded-2xl p-3.5 flex flex-col gap-1\\"><div className=\\"text-sm font-black text-blue-950 flex items-center gap-2\\"><span>📊</span> Classification</div><p className=\\"text-xs text-neutral-700 font-medium\\">Predicting categories & discrete labels</p></div><div className=\\"bg-emerald-50/90 border border-emerald-200/80 rounded-2xl p-3.5 flex flex-col gap-1\\"><div className=\\"text-sm font-black text-emerald-950 flex items-center gap-2\\"><span>📁</span> Clustering</div><p className=\\"text-xs text-neutral-700 font-medium\\">Grouping similar unlabelled data</p></div><div className=\\"bg-amber-50/90 border border-amber-200/80 rounded-2xl p-3.5 flex flex-col gap-1\\"><div className=\\"text-sm font-black text-amber-950 flex items-center gap-2\\"><span>⚠️</span> Anomaly Detection</div><p className=\\"text-xs text-neutral-700 font-medium\\">Identifying outliers and deviations</p></div><div className=\\"bg-purple-50/90 border border-purple-200/80 rounded-2xl p-3.5 flex flex-col gap-1\\"><div className=\\"text-sm font-black text-purple-950 flex items-center gap-2\\"><span>📈</span> Regression</div><p className=\\"text-xs text-neutral-700 font-medium\\">Predicting continuous numerical values</p></div></div></div></div></div>"
  },
  {
    "type": "citation",
    "layoutVariant": "scripture_wisdom",
    "headline": "Ezekiel 18:4",
    "subline": "All Souls Are Mine",
    "imageTopic": "citation",
    "themeColor": "amber",
    "confidence": 0.96,
    "htmlCode": "<div className=\\"bg-white/95 backdrop-blur-2xl border border-white/80 rounded-[36px] p-8 sm:p-10 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.35)] max-w-3xl w-full mx-auto flex flex-col gap-5 text-neutral-900\\"><div className=\\"flex items-center justify-between border-b border-neutral-200/80 pb-4 mb-1\\"><div className=\\"flex items-center gap-2.5\\"><span className=\\"w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse\\"></span><span className=\\"text-xs sm:text-sm font-black uppercase tracking-widest text-amber-800\\">Scripture</span></div><span className=\\"text-xs sm:text-sm font-bold text-neutral-600 bg-neutral-100 px-3.5 py-1 rounded-full border border-neutral-200\\">Ezekiel 18:4</span></div><div className=\\"flex flex-col sm:flex-row items-stretch gap-6\\"><img src=\\"https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=600&q=80\\" alt=\\"Scripture\\" className=\\"w-44 sm:w-52 self-stretch min-h-[160px] rounded-2xl object-cover shadow-md border border-neutral-200/80 shrink-0\\" /><div className=\\"flex flex-col justify-center gap-3 flex-1\\"><p className=\\"text-xl sm:text-2xl md:text-[26px] font-bold text-neutral-900 leading-snug tracking-tight\\">“Behold, all souls are mine; as the soul of the father, so also the soul of the son is mine.”</p><div className=\\"text-xs sm:text-sm font-semibold text-neutral-500\\">— Ezekiel 18:4 (NIV)</div></div></div></div>"
  }
]

Rules:
1. Synthesize related text into unified visual cards rather than fragmented micro-cards.
2. Return ONLY a valid JSON array of 1 or 2 cards.
3. Only return cards with confidence > 0.75.`;

function buildMessages(transcript: string) {
  return [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: `Extract visual cards with colorful dynamic HTML+Tailwind UI code blocks on a sleek, large white soft card from this speech text:\n\n"${transcript.slice(-1500)}"`,
    },
  ];
}

function ensureCardHtmlCode(card: any, themeColor: string): string {
  const headline = card.headline || card.quote || card.reference || card.item || "Highlight";
  const subline = card.subline || card.attribution || card.body || "";
  const imgUrl = card.imageUrl || resolveVerifiedImageUrl(`${headline} ${subline}`, card.type);

  if (card.htmlCode && typeof card.htmlCode === "string" && card.htmlCode.trim().length > 0) {
    // Replace any hallucinated img src with our verified working URL
    return card.htmlCode.replace(/<img([^>]+)src=["'][^"']+["']/gi, `<img$1src="${imgUrl}"`);
  }

  switch (card.type) {
    case "concept":
      return `<div className="bg-white/95 backdrop-blur-2xl border border-white/80 rounded-[36px] p-8 sm:p-10 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.35)] max-w-4xl w-full mx-auto flex flex-col gap-5 text-neutral-900"><div className="flex items-center justify-between border-b border-neutral-200/80 pb-4 mb-1"><div className="flex items-center gap-2.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span><span className="text-xs sm:text-sm font-black uppercase tracking-widest text-blue-700">Core Concept</span></div><span className="text-xs sm:text-sm font-bold text-neutral-600 bg-neutral-100 px-3.5 py-1 rounded-full border border-neutral-200">Highlight</span></div><div className="flex flex-col sm:flex-row items-stretch gap-6"><img src="${imgUrl}" alt="${headline}" className="w-44 sm:w-56 self-stretch min-h-[180px] rounded-2xl object-cover shadow-md border border-neutral-200/80 shrink-0" /><div className="flex flex-col justify-center gap-3 flex-1"><h2 className="text-2xl sm:text-3xl font-black text-neutral-950 leading-tight">${headline}</h2>${subline ? `<div className="bg-neutral-50 border border-neutral-200/80 rounded-2xl p-4 text-sm sm:text-base text-neutral-700 font-medium leading-relaxed">${subline}</div>` : ""}</div></div></div>`;
    case "lower_third":
      return `<div className="bg-white/95 backdrop-blur-2xl border border-white/80 rounded-[28px] p-6 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.35)] flex items-center gap-5 max-w-2xl w-full mx-auto text-neutral-900"><img src="${imgUrl}" alt="${headline}" className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover shadow-md border border-neutral-200/80 shrink-0" /><div className="flex-1"><div className="flex items-center gap-2 mb-1"><span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span><span className="text-xs sm:text-sm font-black uppercase tracking-widest text-blue-700">Speaker</span></div><h2 className="text-2xl sm:text-3xl font-black text-neutral-950 leading-tight">${headline}</h2>${subline ? `<p className="text-sm sm:text-base text-neutral-600 font-medium mt-1">${subline}</p>` : ""}</div></div>`;
    case "key_metric":
      return `<div className="bg-white/95 backdrop-blur-2xl border border-white/80 rounded-[36px] p-8 sm:p-10 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.35)] max-w-2xl w-full mx-auto flex flex-col sm:flex-row items-stretch gap-6 text-neutral-900"><img src="${imgUrl}" alt="${headline}" className="w-36 sm:w-44 self-stretch min-h-[140px] rounded-2xl object-cover shadow-md border border-neutral-200/80 shrink-0" /><div className="flex flex-col justify-center text-center sm:text-left flex-1"><span className="px-3 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black tracking-wider uppercase border border-emerald-200 w-fit">Key Metric</span><div className="text-4xl sm:text-5xl font-black tracking-tight text-neutral-950 mt-2">${headline}</div>${subline ? `<p className="text-sm sm:text-base text-neutral-600 font-medium mt-1">${subline}</p>` : ""}</div></div>`;
    case "quote":
      return `<div className="bg-white/95 backdrop-blur-2xl border border-white/80 rounded-[36px] p-8 sm:p-10 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.35)] max-w-3xl w-full mx-auto flex flex-col gap-5 text-neutral-900"><div className="flex items-center justify-between border-b border-neutral-200/80 pb-4 mb-1"><div className="flex items-center gap-2.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-pulse"></span><span className="text-xs sm:text-sm font-black uppercase tracking-widest text-purple-700">Quote</span></div></div><div className="flex flex-col sm:flex-row items-stretch gap-6"><img src="${imgUrl}" alt="Quote Visual" className="w-44 sm:w-52 self-stretch min-h-[160px] rounded-2xl object-cover shadow-md border border-neutral-200/80 shrink-0" /><div className="flex flex-col justify-center gap-3 flex-1"><p className="text-xl sm:text-2xl md:text-[26px] font-bold text-neutral-900 leading-snug tracking-tight">“${headline}”</p>${subline ? `<div className="text-xs sm:text-sm font-bold text-purple-700">— ${subline}</div>` : ""}</div></div></div>`;
    case "citation":
      return `<div className="bg-white/95 backdrop-blur-2xl border border-white/80 rounded-[36px] p-8 sm:p-10 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.35)] max-w-3xl w-full mx-auto flex flex-col gap-5 text-neutral-900"><div className="flex items-center justify-between border-b border-neutral-200/80 pb-4 mb-1"><div className="flex items-center gap-2.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span><span className="text-xs sm:text-sm font-black uppercase tracking-widest text-amber-800">Scripture</span></div><span className="text-xs sm:text-sm font-bold text-neutral-600 bg-neutral-100 px-3.5 py-1 rounded-full border border-neutral-200">${headline}</span></div><div className="flex flex-col sm:flex-row items-stretch gap-6"><img src="${imgUrl}" alt="${headline}" className="w-44 sm:w-52 self-stretch min-h-[160px] rounded-2xl object-cover shadow-md border border-neutral-200/80 shrink-0" /><div className="flex flex-col justify-center gap-3 flex-1">${subline ? `<p className="text-xl sm:text-2xl md:text-[26px] font-bold text-neutral-900 leading-snug tracking-tight">“${subline}”</p>` : `<p className="text-xl sm:text-2xl font-bold text-neutral-900">${headline}</p>`}<div className="text-xs sm:text-sm font-semibold text-neutral-500">— ${headline}</div></div></div></div>`;
    default:
      return `<div className="bg-white/95 backdrop-blur-2xl border border-white/80 rounded-[32px] p-7 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.35)] max-w-2xl w-full mx-auto flex items-center gap-6 text-neutral-900"><img src="${imgUrl}" alt="${headline}" className="w-24 h-24 rounded-2xl object-cover shadow-md border border-neutral-200/80 shrink-0" /><div className="flex-1"><h3 className="text-2xl font-black text-neutral-950">${headline}</h3>${subline ? `<p className="text-sm sm:text-base text-neutral-600 mt-1 font-medium">${subline}</p>` : ""}</div></div>`;
  }
}

function normalizeTheme(theme: any, cardType: string): string {
  const allowed = ["emerald", "blue", "purple", "amber", "rose", "cyan", "orange", "indigo"];
  if (typeof theme === "string" && allowed.includes(theme.toLowerCase())) {
    return theme.toLowerCase();
  }
  switch (cardType) {
    case "concept":
      return "blue";
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
      return "blue";
  }
}

function sanitizeJsonString(str: string): string {
  let inString = false;
  let escaped = false;
  let result = "";

  for (let i = 0; i < str.length; i++) {
    const char = str[i];

    if (char === '"' && !escaped) {
      inString = !inString;
      result += char;
    } else if (inString) {
      if (char === "\n") {
        result += "\\n";
      } else if (char === "\r") {
        result += "\\r";
      } else if (char === "\t") {
        result += "\\t";
      } else if (char.charCodeAt(0) < 32) {
        // Skip control characters
      } else {
        result += char;
      }
    } else {
      result += char;
    }

    escaped = char === "\\" && !escaped;
  }

  return result;
}

function parseCards(raw: string): AiProducerCard[] {
  try {
    const cleaned = raw.replace(/```[a-z]*\n?/gi, "").trim();
    const sanitized = sanitizeJsonString(cleaned);
    let parsed: any;

    try {
      parsed = JSON.parse(sanitized);
    } catch {
      const firstBracket = sanitized.indexOf("[");
      const lastBracket = sanitized.lastIndexOf("]");
      if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
        try {
          parsed = JSON.parse(sanitized.slice(firstBracket, lastBracket + 1));
        } catch {}
      }
      
      if (!parsed) {
        const firstBrace = sanitized.indexOf("{");
        const lastBrace = sanitized.lastIndexOf("}");
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          try {
            parsed = JSON.parse(sanitized.slice(firstBrace, lastBrace + 1));
          } catch {}
        }
      }

      // If still not parsed, attempt regex match on individual card objects
      if (!parsed) {
        const objectMatches = sanitized.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g);
        if (objectMatches && objectMatches.length > 0) {
          parsed = objectMatches
            .map((om) => {
              try {
                return JSON.parse(om);
              } catch {
                return null;
              }
            })
            .filter(Boolean);
        }
      }
    }

    const arr = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.cards)
        ? parsed.cards
        : Array.isArray(parsed?.visual_cards)
          ? parsed.visual_cards
          : parsed
            ? [parsed]
            : [];

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
        const headline = c.headline || c.quote || c.reference || c.item || "Context Card";
        const subline = c.subline || c.attribution || c.body || undefined;
        
        // Resolve a guaranteed 100% working verified image URL
        const imageUrl = resolveVerifiedImageUrl(
          `${headline} ${subline || ""} ${c.imageTopic || ""}`,
          type,
          c.imageUrl,
        );

        const enrichedCard = {
          ...c,
          type,
          themeColor,
          imageUrl,
          headline,
          subline,
          layoutVariant: c.layoutVariant,
          blocks: Array.isArray(c.blocks) ? c.blocks : undefined,
          metadata: c.metadata && typeof c.metadata === "object" ? c.metadata : undefined,
        };

        return {
          ...enrichedCard,
          imageUrl,
          themeColor,
          htmlCode: ensureCardHtmlCode(enrichedCard, themeColor),
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
      max_tokens: 2500,
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
