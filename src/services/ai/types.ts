/**
 * Shared AI type definitions used across the renderer and main process.
 */

export type AiProvider = "groq" | "gemini" | "openai";

export type AiProducerCardTheme =
  | "emerald"
  | "blue"
  | "purple"
  | "amber"
  | "rose"
  | "cyan"
  | "orange"
  | "indigo";

export type AiProducerCardType =
  | "concept"
  | "lower_third"
  | "key_metric"
  | "quote"
  | "citation"
  | "agenda_item"
  | "custom_ui"
  | (string & {});

export type AiLayoutVariant =
  | "split_comparison"
  | "hero_cover"
  | "scripture_wisdom"
  | "stat_spotlight"
  | "top_banner"
  | "speaker_profile"
  | "agenda_flow"
  | (string & {});

export interface AiCardBlock {
  title?: string;
  description?: string;
  icon?: string;
  value?: string;
  label?: string;
  tag?: string;
  color?: string;
}

export interface AiCardMetadata {
  reference?: string;
  speaker?: string;
  timestamp?: string;
  category?: string;
  version?: string;
}

export type AiProducerCard = {
  type: AiProducerCardType;
  layoutVariant?: AiLayoutVariant;
  headline?: string;
  subline?: string;
  quote?: string;
  attribution?: string;
  reference?: string;
  body?: string;
  item?: string;
  htmlCode?: string;
  imageUrl?: string;
  themeColor?: AiProducerCardTheme | string;
  confidence: number;
  blocks?: AiCardBlock[];
  metadata?: AiCardMetadata;
};
