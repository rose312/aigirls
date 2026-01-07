import { NextResponse } from "next/server";
import { buildFinalPromptWithTags } from "@/lib/build-image-prompt";
import {
  isImageQuality,
  isImageSize,
  isStyleId,
  type ImageQuality,
  type ImageSize,
  type StyleId,
} from "@/lib/presets";
import {
  checkPromptSafety,
  isSafetyLevel,
  type SafetyLevel,
} from "@/lib/prompt-safety";
import {
  generateImages,
  getImageProvider,
  getMissingImageProviderEnv,
} from "@/lib/image-generation";
import { sanitizeTagKey } from "@/lib/tags";
import {
  isQiniuConfigured,
  isQiniuPrivateBucket,
  presignQiniuGetUrl,
  uploadToQiniuS3,
} from "@/lib/qiniu-s3";

export const runtime = "nodejs";

type GenerateRequest = {
  prompt: string;
  styleId: StyleId;
  size: ImageSize;
  quality: ImageQuality;
  n: number;
  tagKeys: string[];
  safetyLevel: SafetyLevel;
};

class BadRequestError extends Error {
  override name = "BadRequestError";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseGenerateRequest(body: unknown): GenerateRequest {
  if (!isRecord(body)) throw new BadRequestError("Invalid request body.");

  const prompt = typeof body.prompt === "string" ? body.prompt : "";
  const styleId = body.styleId;
  const size = body.size;
  const quality = body.quality;
  const n = body.n;
  const tagKeysRaw = body.tagKeys;
  const safetyLevelRaw = body.safetyLevel;

  if (!isStyleId(styleId)) throw new BadRequestError("Invalid styleId.");
  if (!isImageSize(size)) throw new BadRequestError("Invalid size.");
  if (!isImageQuality(quality)) throw new BadRequestError("Invalid quality.");
  if (typeof n !== "number" || !Number.isFinite(n) || n < 1 || n > 4) {
    throw new BadRequestError("Invalid n (1-4).");
  }

  const tagKeys =
    Array.isArray(tagKeysRaw) && tagKeysRaw.length > 0
      ? tagKeysRaw
          .map(sanitizeTagKey)
          .filter((x): x is string => typeof x === "string")
          .slice(0, 24)
      : [];

  const safetyLevel: SafetyLevel = isSafetyLevel(safetyLevelRaw)
    ? safetyLevelRaw
    : "standard";

  return { prompt, styleId, size, quality, n, tagKeys, safetyLevel };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as unknown;
    const input = parseGenerateRequest(body);

    const safety = checkPromptSafety(input.prompt, input.safetyLevel);
    if (!safety.ok) {
      return NextResponse.json({ error: safety.message }, { status: 400 });
    }

    const provider = getImageProvider();
    const missing = getMissingImageProviderEnv(provider);
    if (missing.length > 0) {
      return NextResponse.json(
        {
          error: `服务器未配置：${missing.join(", ")}。请在 .env.local 里设置后重试。`,
        },
        { status: 501 },
      );
    }

    const finalPrompt = buildFinalPromptWithTags(
      input.prompt,
      input.styleId,
      input.tagKeys,
    );

    const result = await generateImages({
      prompt: finalPrompt,
      n: input.n,
      size: input.size,
      quality: input.quality,
    });

    let storage: "qiniu" | "inline" = "inline";
    let warning: string | undefined;
    let images: Array<{ url: string; key?: string; expiresAt?: number }> = [];

    const shouldUpload = isQiniuConfigured();
    if (shouldUpload) {
      try {
        const ext =
          result.mime === "image/jpeg" || result.mime === "image/jpg"
            ? "jpg"
            : result.mime === "image/webp"
              ? "webp"
              : "png";

        const uploaded: Array<{ key: string; url: string }> = [];
        for (const b64 of result.b64Images) {
          const buf = Buffer.from(b64, "base64");
          const up = await uploadToQiniuS3({
            body: buf,
            contentType: result.mime,
            extension: ext,
            keyPrefix: "girls",
          });
          uploaded.push({ key: up.key, url: up.url });
        }
        storage = "qiniu";

        if (isQiniuPrivateBucket()) {
          const signed = await Promise.all(
            uploaded.map(async (u) => {
              const s = await presignQiniuGetUrl(u.key);
              return { key: u.key, url: s.url, expiresAt: s.expiresAt };
            }),
          );
          images = signed;
        } else {
          images = uploaded.map((u) => ({ key: u.key, url: u.url }));
        }
      } catch (e) {
        warning = e instanceof Error ? e.message : "Qiniu upload failed";
        storage = "inline";
      }
    }

    if (images.length === 0) {
      images = result.b64Images.map((b64) => ({
        url: `data:${result.mime};base64,${b64}`,
      }));
    }

    return NextResponse.json({
      provider: result.provider,
      model: result.model,
      storage,
      warning,
      images: images.map((img) => ({ mime: result.mime, ...img })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = err instanceof BadRequestError ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
