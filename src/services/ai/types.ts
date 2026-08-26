/**
 * Shared AI type definitions used across the renderer and main process.
 */

export type AiProvider = "openai" | "groq";

export type AiProducerCardTheme =
  | "emerald"
  | "blue"
  | "purple"
  | "amber"
  | "rose"
  | "cyan"
  | "orange"
  | "indigo";

export type AiProducerCard = {
  type: "lower_third" | "key_metric" | "quote" | "citation" | "agenda_item" | "custom_ui";
  headline: string;
  subline?: string;
  quote?: string;
  attribution?: string;
  reference?: string;
  body?: string;
  item?: string;
  htmlCode?: string;
  themeColor?: AiProducerCardTheme | string;
  confidence: number;
};
