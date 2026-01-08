import OpenAI from "openai";
import { presetHintForOptimizer, type PromptPresetId } from "@/lib/prompt-presets";

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

function getClient() {
  const apiKey = requireEnv("OPENROUTER_API_KEY");

  const defaultHeaders: Record<string, string> = {};
  const siteUrl = process.env.OPENROUTER_SITE_URL;
  const siteTitle = process.env.OPENROUTER_SITE_TITLE;
  if (siteUrl) defaultHeaders["HTTP-Referer"] = siteUrl;
  if (siteTitle) defaultHeaders["X-Title"] = siteTitle;

  return new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey,
    defaultHeaders,
  });
}

export async function optimizeImagePrompt(input: {
  keywords: string;
  presetId: PromptPresetId | null;
}) {
  const model = process.env.OPENROUTER_TEXT_MODEL ?? "openai/gpt-4o-mini";
  const client = getClient();

  const system = [
    "You are an expert prompt engineer for AI image generation.",
    "Turn the user's keywords into a single, highly effective prompt for generating a BEAUTIFUL ADULT WOMAN (age 21+) portrait.",
    "Style: Miss Universe / international beauty pageant winner vibe; premium, elegant, confident, magazine-grade.",
    "Safety: non-explicit, no nudity, no explicit sexual content; outfits must be fully covering; avoid see-through; no minors.",
    "Output rules: Return ONLY the final prompt text (no markdown, no quotes, no labels).",
    "Prompt rules: Use concise, descriptive English with photography terms (lighting, lens, composition), include wardrobe, pose, background, and mood.",
    "Do NOT include instructions like 'no nudity' or 'no sex' unless the user asked for it; keep it naturally descriptive.",
  ].join("\n");

  const user = [
    `Preset: ${presetHintForOptimizer(input.presetId)}`,
    `Keywords: ${input.keywords}`,
    "Goal: one clean prompt that produces a stunning, classy, non-explicit beauty portrait.",
  ].join("\n");

  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0.7,
  });

  const text = completion.choices?.[0]?.message?.content;
  const prompt = typeof text === "string" ? text.trim() : "";
  if (!prompt) throw new Error("Optimizer returned empty prompt.");
  // Keep it short-ish so users can edit comfortably.
  return prompt.length > 900 ? prompt.slice(0, 900).trim() : prompt;
}
