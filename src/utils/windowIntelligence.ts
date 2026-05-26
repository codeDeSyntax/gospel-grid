import type { WindowInfo } from "@/components/dashboard/picker/WindowPicker";

export type WindowIntelligenceCategory =
  | "presentation"
  | "media"
  | "browser"
  | "communication"
  | "file"
  | "system"
  | "private"
  | "utility"
  | "feature"
  | "unknown";

export type WindowIntelligenceRiskLevel = "none" | "low" | "medium" | "high";

export type WindowIntelligenceResult = {
  score: number;
  category: WindowIntelligenceCategory;
  recommendation: "recommended" | "neutral" | "avoid";
  riskLevel: WindowIntelligenceRiskLevel;
  tags: string[];
  warnings: string[];
  reasons: string[];
};

type KeywordRule = {
  keywords: string[];
  score: number;
  category?: WindowIntelligenceCategory;
  tag?: string;
  warning?: string;
  reason?: string;
  riskLevel?: WindowIntelligenceRiskLevel;
};

const presentationRules: KeywordRule[] = [
  {
    keywords: ["powerpoint", ".ppt", "slides", "keynote", "presentation"],
    score: 48,
    category: "presentation",
    tag: "Presentation",
    reason: "Looks like a slide or presentation source.",
  },
  {
    keywords: ["easyworship", "propresenter", "openlp", "songbeamer", "lyrics"],
    score: 46,
    category: "presentation",
    tag: "Worship",
    reason: "Looks like worship or lyrics presentation software.",
  },
  {
    keywords: ["bible", "logos", "accordance", "scripture", "verse"],
    score: 42,
    category: "presentation",
    tag: "Teaching",
    reason: "Looks relevant for teaching or scripture presentation.",
  },
  {
    keywords: ["pdf", "adobe acrobat", "reader", "document"],
    score: 24,
    category: "presentation",
    tag: "Document",
    reason: "Document windows are often useful presentation sources.",
  },
  {
    keywords: ["youtube", "vlc", "media player", "spotify", "video", "music"],
    score: 30,
    category: "media",
    tag: "Media",
    reason: "Looks like an audio/video source.",
  },
  {
    keywords: ["chrome", "edge", "firefox", "browser"],
    score: 12,
    category: "browser",
    tag: "Browser",
    reason: "Browser windows can be useful, but may need privacy review.",
  },
];

const privacyRules: KeywordRule[] = [
  {
    keywords: ["gmail", "inbox", "mail", "outlook", "email"],
    score: -44,
    category: "private",
    tag: "Private?",
    warning: "Email or inbox content may expose private information.",
    riskLevel: "high",
  },
  {
    keywords: ["whatsapp", "telegram", "messenger", "discord", "slack", "teams chat"],
    score: -42,
    category: "communication",
    tag: "Private?",
    warning: "Chat windows may expose private conversations.",
    riskLevel: "high",
  },
  {
    keywords: ["bank", "payment", "paypal", "wallet", "invoice", "statement"],
    score: -48,
    category: "private",
    tag: "Private?",
    warning: "Financial content should be reviewed before projection.",
    riskLevel: "high",
  },
  {
    keywords: ["password", "login", "sign in", "credentials", "account"],
    score: -46,
    category: "private",
    tag: "Private?",
    warning: "Login or credential-related content may be sensitive.",
    riskLevel: "high",
  },
  {
    keywords: ["file explorer", "explorer", "downloads", "documents", "desktop"],
    score: -24,
    category: "file",
    tag: "Review",
    warning: "File browser windows may expose private files or folders.",
    riskLevel: "medium",
  },
  {
    keywords: ["settings", "control panel", "task manager", "registry", "terminal", "powershell", "cmd"],
    score: -28,
    category: "system",
    tag: "System",
    warning: "System or developer windows are rarely safe for audience projection.",
    riskLevel: "medium",
  },
];

const utilityRules: KeywordRule[] = [
  {
    keywords: ["notepad", "word", "excel", "obs", "photoshop", "figma"],
    score: 8,
    category: "utility",
    tag: "Utility",
  },
];

const riskRank: Record<WindowIntelligenceRiskLevel, number> = {
  none: 0,
  low: 1,
  medium: 2,
  high: 3,
};

function normalize(value: string | undefined): string {
  return (value ?? "").toLowerCase();
}

function hasKeyword(haystack: string, keywords: string[]) {
  return keywords.some((keyword) => haystack.includes(keyword));
}

function upgradeRisk(
  current: WindowIntelligenceRiskLevel,
  next: WindowIntelligenceRiskLevel | undefined,
) {
  if (!next) return current;
  return riskRank[next] > riskRank[current] ? next : current;
}

function unique(values: string[]) {
  return Array.from(new Set(values));
}

export function classifyWindow(window: WindowInfo): WindowIntelligenceResult {
  const haystack = [
    window.name,
    window.app,
    window.executablePath,
    window.className,
  ]
    .map(normalize)
    .join(" ");

  const tags: string[] = [];
  const warnings: string[] = [];
  const reasons: string[] = [];
  let score = 0;
  let category: WindowIntelligenceCategory = "unknown";
  let riskLevel: WindowIntelligenceRiskLevel = "none";

  if (window.id.startsWith("feature:")) {
    return {
      score: 65,
      category: "feature",
      recommendation: "recommended",
      riskLevel: "none",
      tags: ["Wingrid"],
      warnings: [],
      reasons: ["Wingrid feature windows are controlled presentation sources."],
    };
  }

  for (const rule of [...presentationRules, ...utilityRules, ...privacyRules]) {
    if (!hasKeyword(haystack, rule.keywords)) continue;

    score += rule.score;
    if (rule.category) category = rule.category;
    if (rule.tag) tags.push(rule.tag);
    if (rule.warning) warnings.push(rule.warning);
    if (rule.reason) reasons.push(rule.reason);
    riskLevel = upgradeRisk(riskLevel, rule.riskLevel);
  }

  if (window.isMinimized) {
    score -= 10;
    tags.push("Minimized");
    reasons.push("Minimized windows may not be ready for immediate projection.");
  }

  if (window.isVisible === false) {
    score -= 18;
    tags.push("Hidden");
    riskLevel = upgradeRisk(riskLevel, "low");
    warnings.push("This window may not be visible or ready to capture.");
  }

  if (window.isSelected) {
    score += 8;
  }

  const recommendation =
    riskLevel === "high" || score <= -20
      ? "avoid"
      : score >= 25
        ? "recommended"
        : "neutral";

  if (recommendation === "recommended") {
    tags.unshift("Recommended");
  }

  return {
    score,
    category,
    recommendation,
    riskLevel,
    tags: unique(tags).slice(0, 3),
    warnings: unique(warnings).slice(0, 2),
    reasons: unique(reasons).slice(0, 2),
  };
}

export function sortWindowsByIntelligence(
  windows: WindowInfo[],
  getIntel: (window: WindowInfo) => WindowIntelligenceResult,
) {
  return [...windows].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    if (a.isSelected && !b.isSelected) return -1;
    if (!a.isSelected && b.isSelected) return 1;

    const aIntel = getIntel(a);
    const bIntel = getIntel(b);
    if (aIntel.recommendation === "recommended" && bIntel.recommendation !== "recommended") {
      return -1;
    }
    if (aIntel.recommendation !== "recommended" && bIntel.recommendation === "recommended") {
      return 1;
    }
    if (aIntel.recommendation === "avoid" && bIntel.recommendation !== "avoid") {
      return 1;
    }
    if (aIntel.recommendation !== "avoid" && bIntel.recommendation === "avoid") {
      return -1;
    }

    return bIntel.score - aIntel.score;
  });
}
