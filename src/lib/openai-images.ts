import type { ImageQuality, ImageSize } from "@/lib/presets";

export type OpenAIImageGenerationInput = {
  prompt: string;
  n: number;
  size: ImageSize;
  quality: ImageQuality;
};

export type OpenAIImageGenerationResult = {
  b64Images: string[];
  model: string;
};

const OPENAI_IMAGES_URL = "https://api.openai.com/v1/images/generations";

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

export async function generateOpenAIImages(
  input: OpenAIImageGenerationInput,
): Promise<OpenAIImageGenerationResult> {
  const apiKey = requireEnv("OPENAI_API_KEY");
  const model = process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120_000);

  try {
    const payloadBase = {
      model,
      prompt: input.prompt,
      n: input.n,
      size: input.size,
      quality: input.quality,
    };

    const attempts: Array<Record<string, unknown>> = [
      { ...payloadBase, response_format: "b64_json" },
      payloadBase,
    ];

    let lastError: unknown = null;

    for (const bodyObj of attempts) {
      const res = await fetch(OPENAI_IMAGES_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bodyObj),
        signal: controller.signal,
      });

      const payloadText = await res.text();
      if (!payloadText) {
        lastError = new Error(
          `OpenAI Images API error: empty response (HTTP ${res.status})`,
        );
        continue;
      }

      const payload = JSON.parse(payloadText) as {
        data?: Array<{ b64_json?: string; url?: string }>;
        error?: { message?: string; type?: string; code?: string };
      };

      if (!res.ok) {
        lastError = new Error(
          payload.error?.message ??
            `OpenAI Images API error (HTTP ${res.status}): ${payloadText.slice(0, 500)}`,
        );
        continue;
      }

      const b64Images = (payload.data ?? [])
        .map((item) => item.b64_json)
        .filter((x): x is string => typeof x === "string" && x.length > 0);

      if (b64Images.length > 0) {
        return { b64Images, model };
      }

      const urls = (payload.data ?? [])
        .map((item) => item.url)
        .filter((x): x is string => typeof x === "string" && x.length > 0);

      if (urls.length > 0) {
        const downloaded = await Promise.all(
          urls.map(async (url) => {
            const r = await fetch(url, { signal: controller.signal });
            if (!r.ok) throw new Error(`Failed to fetch generated image URL (HTTP ${r.status})`);
            const arrayBuffer = await r.arrayBuffer();
            return Buffer.from(arrayBuffer).toString("base64");
          }),
        );
        return { b64Images: downloaded, model };
      }

      lastError = new Error("OpenAI Images API returned no image data.");
    }

    throw lastError instanceof Error ? lastError : new Error("OpenAI Images API failed.");
  } finally {
    clearTimeout(timeout);
  }
}
