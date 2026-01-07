import type { ImageQuality, ImageSize } from "@/lib/presets";
import { generateOpenAIImages } from "@/lib/openai-images";
import { generateOpenRouterImages } from "@/lib/openrouter-images";

export type ImageGenerationInput = {
  prompt: string;
  n: number;
  size: ImageSize;
  quality: ImageQuality;
};

export type ImageGenerationResult = {
  b64Images: string[];
  mime: string;
  provider: "openrouter" | "openai";
  model: string;
};

export function getImageProvider(): "openrouter" | "openai" {
  const explicit = process.env.AI_IMAGE_PROVIDER;
  if (explicit === "openrouter" || explicit === "openai") return explicit;
  if (process.env.OPENROUTER_API_KEY) return "openrouter";
  return "openai";
}

export function getMissingImageProviderEnv(provider: "openrouter" | "openai") {
  const missing: string[] = [];
  if (provider === "openrouter") {
    if (!process.env.OPENROUTER_API_KEY) missing.push("OPENROUTER_API_KEY");
  } else {
    if (!process.env.OPENAI_API_KEY) missing.push("OPENAI_API_KEY");
  }
  return missing;
}

export async function generateImages(input: ImageGenerationInput): Promise<ImageGenerationResult> {
  const provider = getImageProvider();

  if (provider === "openrouter") {
    // OpenRouter image generation is model-dependent; we keep "quality" in the UI but
    // don't pass it as a standardized parameter here.
    const result = await generateOpenRouterImages({
      prompt: input.prompt,
      n: input.n,
      size: input.size,
    });
    return {
      b64Images: result.b64Images,
      mime: result.mime,
      provider,
      model: result.model,
    };
  }

  const result = await generateOpenAIImages({
    prompt: input.prompt,
    n: input.n,
    size: input.size,
    quality: input.quality,
  });
  return {
    b64Images: result.b64Images,
    mime: "image/png",
    provider,
    model: result.model,
  };
}
