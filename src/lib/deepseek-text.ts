import OpenAI from "openai";
import { presetHintForOptimizer, type PromptPresetId } from "@/lib/prompt-presets";

function requireAnyEnv(names: string[]) {
  for (const name of names) {
    const value = process.env[name];
    if (value) return value;
  }
  throw new Error(`Missing environment variable: ${names.join(" | ")}`);
}

function normalizeBaseUrl(raw: string) {
  return raw.trim().replace(/\/+$/, "");
}

function getClient() {
  // Prefer explicit DeepSeek envs, but support the user's existing "deepseek via anthropic env" config.
  const apiKey = requireAnyEnv(["DEEPSEEK_API_KEY", "ANTHROPIC_AUTH_TOKEN"]);
  const baseURL = normalizeBaseUrl(
    process.env.DEEPSEEK_BASE_URL ?? process.env.ANTHROPIC_BASE_URL ?? "https://api.deepseek.com",
  );

  return {
    model: process.env.DEEPSEEK_TEXT_MODEL ?? process.env.ANTHROPIC_MODEL ?? "deepseek-chat",
    client: new OpenAI({ baseURL, apiKey }),
  };
}

export async function optimizeImagePromptDeepSeek(input: {
  keywords: string;
  presetId: PromptPresetId | null;
}) {
  const { client, model } = getClient();

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
  return prompt.length > 900 ? prompt.slice(0, 900).trim() : prompt;
}

