"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  SIZE_OPTIONS,
  STYLE_PRESETS,
  type ImageQuality,
  type ImageSize,
  type StyleId,
} from "@/lib/presets";
import { useGallery } from "@/app/providers";
import { aspectClassForSize } from "@/lib/aspect";
import {
  TAG_GROUPS,
  labelForTagKey,
  sanitizeTagKey,
  tagKey,
  type TagCategory,
} from "@/lib/tags";
import ZoomableImage from "@/components/ZoomableImage";
import type { SafetyLevel } from "@/lib/prompt-safety";

const QUALITY_OPTIONS: ReadonlyArray<{ id: ImageQuality; label: string; hint: string }> = [
  { id: "auto", label: "自动", hint: "速度/质量平衡" },
  { id: "low", label: "低", hint: "更快" },
  { id: "medium", label: "中", hint: "更细节" },
  { id: "high", label: "高", hint: "最清晰" },
];

function uid() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const MEIZI_TEMPLATES: ReadonlyArray<{
  id: string;
  label: string;
  hint: string;
  styleId: StyleId;
  size: ImageSize;
  quality: ImageQuality;
  tagKeys: string[];
  prompt: string;
}> = [
  {
    id: "campus",
    label: "清纯校花",
    hint: "日系清透、自然光",
    styleId: "meizitu",
    size: "1024x1536",
    quality: "auto",
    tagKeys: [
      tagKey("hairStyle", "long"),
      tagKey("scene", "windowLight"),
      tagKey("mood", "gentleSmile"),
    ],
    prompt:
      "清透妆容、自然微笑、白色衬衫+短裙（不透视）、窗边自然光、浅景深、85mm 人像、干净背景",
  },
  {
    id: "sweet",
    label: "甜美邻家",
    hint: "软糯氛围、细腻肤质",
    styleId: "photo",
    size: "1024x1536",
    quality: "auto",
    tagKeys: [tagKey("hairColor", "brown"), tagKey("outfit", "sweater"), tagKey("mood", "cute")],
    prompt:
      "邻家女孩、温柔眼神、浅色针织衫（完整覆盖、不透视）、柔光、背景虚化、肤质细腻、干净构图",
  },
  {
    id: "office",
    label: "轻熟通勤",
    hint: "高级感、克制性感",
    styleId: "glamour",
    size: "1024x1536",
    quality: "auto",
    tagKeys: [tagKey("outfit", "business"), tagKey("mood", "confident"), tagKey("scene", "studio")],
    prompt:
      "轻熟气质、干净盘发或长发、通勤套装、克制性感、棚拍柔光、电影感质感、杂志大片风、浅景深",
  },
  {
    id: "night",
    label: "夜景氛围",
    hint: "霓虹/雨夜、故事感",
    styleId: "cinema",
    size: "1024x1536",
    quality: "auto",
    tagKeys: [tagKey("scene", "rainyNeon"), tagKey("mood", "mysterious"), tagKey("outfit", "coat")],
    prompt:
      "城市雨夜霓虹、反射光、神秘眼神、风衣（完整覆盖）、湿润空气感、电影感调色、浅景深、胶片颗粒",
  },
  {
    id: "swim",
    label: "泳装写真",
    hint: "不露点、大片质感",
    styleId: "glamour",
    size: "1024x1536",
    quality: "auto",
    tagKeys: [tagKey("outfit", "swimwear"), tagKey("scene", "sunset"), tagKey("mood", "elegant")],
    prompt:
      "泳装写真、比基尼（完整覆盖、不露点、不透视）、海边日落、金色逆光、皮肤高光、优雅姿态、杂志大片",
  },
];

export default function Home() {
  const { items: images, addItems, clear } = useGallery();

  const [prompt, setPrompt] = useState("");
  const [styleId, setStyleId] = useState<StyleId>("photo");
  const [size, setSize] = useState<ImageSize>("1024x1536");
  const [quality, setQuality] = useState<ImageQuality>("auto");
  const [n, setN] = useState(1);
  const [selectedTagKeys, setSelectedTagKeys] = useState<string[]>([]);
  const [extraTag, setExtraTag] = useState("");
  const [safetyLevel, setSafetyLevel] = useState<SafetyLevel>("standard");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastModel, setLastModel] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const selectedStyle = useMemo(
    () => STYLE_PRESETS.find((s) => s.id === styleId) ?? STYLE_PRESETS[0]!,
    [styleId],
  );

  const active = useMemo(
    () => (activeId ? images.find((it) => it.id === activeId) ?? null : null),
    [activeId, images],
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const p = params.get("prompt");
    const s = params.get("style");
    const z = params.get("size");
    const q = params.get("quality");
    const t = params.get("tags");

    if (p) setPrompt(p);
    if (
      s === "photo" ||
      s === "cinema" ||
      s === "anime" ||
      s === "glamour" ||
      s === "meizitu" ||
      s === "cyberpunk" ||
      s === "guofeng" ||
      s === "illustration"
    ) {
      setStyleId(s);
    }
    if (z === "1024x1024" || z === "1024x1536" || z === "1536x1024") setSize(z);
    if (q === "auto" || q === "low" || q === "medium" || q === "high") setQuality(q);
    if (t) {
      const keys = t
        .split(",")
        .map((x) => x.trim())
        .map(sanitizeTagKey)
        .filter((x): x is string => typeof x === "string");
      const unique = Array.from(new Set(keys)).slice(0, 24);
      if (unique.length > 0) setSelectedTagKeys(unique);
    }
  }, []);

  function toggleTag(key: string) {
    setSelectedTagKeys((prev) => (prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]));
  }

  function addExtraTag() {
    const t = extraTag.trim().replace(/\s+/g, " ");
    if (!t) return;
    const key = tagKey("extra", t);
    setSelectedTagKeys((prev) => (prev.includes(key) ? prev : [key, ...prev]).slice(0, 24));
    setExtraTag("");
  }

  async function onGenerate() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          styleId,
          size,
          quality,
          n,
          tagKeys: selectedTagKeys,
          safetyLevel,
        }),
      });

      const payload = (await res.json()) as
        | {
            images: Array<{ url: string; mime: string; key?: string; expiresAt?: number }>;
            model?: string;
            provider?: string;
            storage?: string;
            warning?: string;
          }
        | { error: string };

      if (!res.ok) {
        const message = "error" in payload ? payload.error : `生成失败（HTTP ${res.status}）`;
        throw new Error(message);
      }

      if (!("images" in payload) || !payload.images?.length) {
        throw new Error("没有拿到图片数据。");
      }

      const model = payload.model ?? null;
      setLastModel(model);
      const now = Date.now();
      const next = payload.images.map((img) => ({
        id: uid(),
        createdAt: now,
        prompt: prompt.trim(),
        styleId,
        styleLabel: selectedStyle.label,
        size,
        quality,
        model,
        tagKeys: selectedTagKeys,
        imageUrl: img.url,
        imageKey: payload.storage === "qiniu" ? img.key : undefined,
        urlExpiresAt: typeof img.expiresAt === "number" ? img.expiresAt : null,
        favorite: false,
      }));
      addItems(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "未知错误");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-zinc-950 text-zinc-50">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_20%_10%,rgba(236,72,153,0.18),transparent_60%),radial-gradient(55%_45%_at_80%_20%,rgba(59,130,246,0.18),transparent_55%),radial-gradient(60%_50%_at_50%_100%,rgba(168,85,247,0.14),transparent_60%)]" />
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-pink-500 via-violet-500 to-sky-500 shadow-[0_0_0_1px_rgba(255,255,255,0.12)]" />
              <div>
                <h1 className="text-xl font-semibold tracking-tight">AI 女孩工坊</h1>
                <p className="text-sm text-zinc-300">
                  生成高质量人像（仅限成年、非露骨）。
                  {lastModel ? ` 模型：${lastModel}` : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200 hover:bg-white/10"
                href="/girls"
                title="查看生成的图片画廊"
              >
                女孩库
              </Link>
              <a
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200 hover:bg-white/10"
                href="https://openrouter.ai/docs/guides/image-generation"
                target="_blank"
                rel="noreferrer"
                title="OpenRouter 图片生成文档"
              >
                API 文档
              </a>
            </div>
          </div>
        </header>

        <main className="grid gap-6 lg:grid-cols-5">
          <section className="lg:col-span-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_0_0_1px_rgba(0,0,0,0.2)]">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-medium text-zinc-200">提示词</h2>
                <button
                  type="button"
                  onClick={() =>
                    setPrompt(
                      "长发、温柔微笑、清透妆容、自然光、浅景深、背景虚化、时尚连衣裙",
                    )
                  }
                  className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-zinc-200 hover:bg-white/10"
                >
                  填个示例
                </button>
              </div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={5}
                placeholder="例如：长发、微笑、白色衬衫与牛仔裤、咖啡馆自然光、浅景深..."
                className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50"
              />

              <div className="mt-4 grid gap-4">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-zinc-200">细分标签</p>
                      <p className="mt-0.5 text-xs text-zinc-400">
                        可选：发色/发型/穿搭/场景/气质（会同时用于提示词与筛选）
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedTagKeys([])}
                      disabled={selectedTagKeys.length === 0}
                      className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-200 hover:bg-white/10 disabled:opacity-50"
                    >
                      重置
                    </button>
                  </div>

                  <div className="mt-3 grid gap-4">
                    {TAG_GROUPS.map((group) => (
                      <div key={group.category}>
                        <p className="text-xs font-medium text-zinc-300">{group.label}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {group.options.map((opt) => {
                            const key = tagKey(group.category as TagCategory, opt.id);
                            const active = selectedTagKeys.includes(key);
                            return (
                              <button
                                key={key}
                                type="button"
                                onClick={() => toggleTag(key)}
                                className={[
                                  "rounded-xl border px-3 py-1.5 text-sm transition",
                                  active
                                    ? "border-pink-500/40 bg-pink-500/10 text-zinc-50"
                                    : "border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10",
                                ].join(" ")}
                              >
                                {opt.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}

                    <div>
                      <p className="text-xs font-medium text-zinc-300">自定义标签</p>
                      <div className="mt-2 flex gap-2">
                        <input
                          value={extraTag}
                          onChange={(e) => setExtraTag(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addExtraTag();
                            }
                          }}
                          placeholder="例如：眼镜、珍珠耳环、单肩包..."
                          className="flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                        />
                        <button
                          type="button"
                          onClick={addExtraTag}
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200 hover:bg-white/10"
                        >
                          添加
                        </button>
                      </div>
                    </div>

                    {selectedTagKeys.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedTagKeys.map((k) => (
                          <button
                            key={k}
                            type="button"
                            onClick={() => toggleTag(k)}
                            className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-zinc-200 hover:bg-white/10"
                            title="点击移除"
                          >
                            {labelForTagKey(k)}
                            <span className="ml-2 text-zinc-500">×</span>
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-zinc-200">妹子图模板</p>
                      <p className="mt-0.5 text-xs text-zinc-400">
                        一键填充提示词 + 风格 + 标签（非露骨、衣着完整）
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {MEIZI_TEMPLATES.map((tpl) => (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => {
                          setPrompt(tpl.prompt);
                          setStyleId(tpl.styleId);
                          setSize(tpl.size);
                          setQuality(tpl.quality);
                          setSelectedTagKeys(tpl.tagKeys);
                          setSafetyLevel("standard");
                        }}
                        className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-left text-sm text-zinc-200 hover:bg-white/10"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="font-semibold">{tpl.label}</div>
                          <div className="text-xs text-zinc-400">{tpl.hint}</div>
                        </div>
                        <div className="mt-1 line-clamp-2 text-xs text-zinc-400">{tpl.prompt}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-end justify-between">
                    <p className="text-sm font-medium text-zinc-200">风格</p>
                    <p className="text-xs text-zinc-400">{selectedStyle.hint}</p>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {STYLE_PRESETS.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setStyleId(s.id)}
                        className={[
                          "rounded-xl border px-3 py-2 text-left text-sm transition",
                          s.id === styleId
                            ? "border-pink-500/40 bg-pink-500/10 text-zinc-50 shadow-[0_0_0_1px_rgba(236,72,153,0.15)]"
                            : "border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10",
                        ].join(" ")}
                      >
                        <div className="font-medium">{s.label}</div>
                        <div className="mt-0.5 text-xs text-zinc-400">{s.hint}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-zinc-200">尺寸</p>
                    <div className="mt-2 grid gap-2">
                      {SIZE_OPTIONS.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setSize(opt.id)}
                          className={[
                            "flex items-center justify-between rounded-xl border px-3 py-2 text-sm transition",
                            opt.id === size
                              ? "border-sky-500/40 bg-sky-500/10 text-zinc-50"
                              : "border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10",
                          ].join(" ")}
                        >
                          <span className="font-medium">{opt.label}</span>
                          <span className="text-xs text-zinc-400">{opt.hint}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-zinc-200">质量</p>
                    <div className="mt-2 grid gap-2">
                      {QUALITY_OPTIONS.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setQuality(opt.id)}
                          className={[
                            "flex items-center justify-between rounded-xl border px-3 py-2 text-sm transition",
                            opt.id === quality
                              ? "border-violet-500/40 bg-violet-500/10 text-zinc-50"
                              : "border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10",
                          ].join(" ")}
                        >
                          <span className="font-medium">{opt.label}</span>
                          <span className="text-xs text-zinc-400">{opt.hint}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <label className="text-sm font-medium text-zinc-200" htmlFor="count">
                    张数（1-4）
                  </label>
                  <input
                    id="count"
                    type="number"
                    min={1}
                    max={4}
                    value={n}
                    onChange={(e) => setN(Math.max(1, Math.min(4, Number(e.target.value) || 1)))}
                    className="w-20 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                  />
                </div>

                {error ? (
                  <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
                    {error}
                  </div>
                ) : (
                  <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-zinc-300">
                    提示：安全过滤是强制的，不能关闭（会拦截未成年人、裸体、露骨色情等）。标准模式允许“性感但衣着完整”的写真风格；严格模式更保守。
                  </div>
                )}

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-zinc-200">安全强度</p>
                      <p className="mt-0.5 text-xs text-zinc-400">
                        标准：拦截露骨/裸体；严格：额外拦截明显性暗示描述
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSafetyLevel("standard")}
                      className={[
                        "rounded-xl border px-3 py-2 text-left text-sm transition",
                        safetyLevel === "standard"
                          ? "border-emerald-500/40 bg-emerald-500/10 text-zinc-50"
                          : "border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10",
                      ].join(" ")}
                    >
                      <div className="font-medium">标准</div>
                      <div className="mt-0.5 text-xs text-zinc-400">推荐（默认）</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSafetyLevel("strict")}
                      className={[
                        "rounded-xl border px-3 py-2 text-left text-sm transition",
                        safetyLevel === "strict"
                          ? "border-amber-500/40 bg-amber-500/10 text-zinc-50"
                          : "border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10",
                      ].join(" ")}
                    >
                      <div className="font-medium">严格</div>
                      <div className="mt-0.5 text-xs text-zinc-400">更保守</div>
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onGenerate}
                  disabled={busy}
                  className={[
                    "mt-1 inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition",
                    busy
                      ? "cursor-not-allowed bg-white/10 text-zinc-300"
                      : "bg-gradient-to-r from-pink-500 via-violet-500 to-sky-500 text-white shadow-[0_10px_40px_-10px_rgba(236,72,153,0.5)] hover:brightness-110",
                  ].join(" ")}
                >
                  {busy ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      生成中...
                    </span>
                  ) : (
                    "生成 AI 女孩"
                  )}
                </button>
              </div>
            </div>
          </section>

          <section className="lg:col-span-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-medium text-zinc-200">预览 / 画廊</h2>
                <button
                  type="button"
                  onClick={clear}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-200 hover:bg-white/10"
                  disabled={images.length === 0}
                >
                  清空
                </button>
              </div>

              {images.length === 0 ? (
                <div className="mt-4 grid place-items-center rounded-2xl border border-dashed border-white/15 bg-black/20 p-10 text-center">
                  <div className="max-w-md">
                    <p className="text-base font-semibold">还没有作品</p>
                    <p className="mt-1 text-sm text-zinc-300">
                      左侧写提示词 → 选择风格 → 点击“生成 AI 女孩”。
                    </p>
                    <div className="mt-6 flex justify-center">
                      <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-pink-500/60 via-violet-500/60 to-sky-500/60 blur-[0.2px]" />
                    </div>
                    <div className="mt-5">
                      <Link
                        href="/girls"
                        className="inline-flex rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-zinc-100 hover:bg-white/10"
                      >
                        去女孩库
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {images.map((img) => (
                    <div
                      key={img.id}
                      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-black/30"
                    >
                      <div className={aspectClassForSize(img.size)}>
                        <button
                          type="button"
                          onClick={() => setActiveId(img.id)}
                          className="block h-full w-full"
                          title="点击放大"
                        >
                          <img
                            src={img.imageUrl}
                            alt="generated"
                            loading="lazy"
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                          />
                        </button>
                      </div>
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0 opacity-0 transition group-hover:opacity-100" />
                      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-2 opacity-0 transition group-hover:opacity-100">
                        <a
                          className="rounded-lg bg-white/10 px-2 py-1 text-xs text-white backdrop-blur hover:bg-white/15"
                          href={img.imageUrl}
                          download={`ai-girl-${img.id}.png`}
                        >
                          下载
                        </a>
                        <button
                          type="button"
                          className="rounded-lg bg-white/10 px-2 py-1 text-xs text-white backdrop-blur hover:bg-white/15"
                          onClick={() => navigator.clipboard.writeText(img.imageUrl)}
                        >
                          复制链接
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </main>

        {active ? (
          <div
            className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"
            role="dialog"
            aria-modal="true"
            onClick={() => setActiveId(null)}
          >
            <div
              className="w-full max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-zinc-950"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">
                    {active.styleLabel} · {active.size} · 质量 {active.quality}
                  </div>
                  <div className="truncate text-xs text-zinc-400">
                    {active.model ? `模型：${active.model}` : ""}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={active.imageUrl}
                    download={`ai-girl-${active.id}.png`}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-200 hover:bg-white/10"
                  >
                    下载
                  </a>
                  <button
                    type="button"
                    onClick={() => setActiveId(null)}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-200 hover:bg-white/10"
                  >
                    关闭
                  </button>
                </div>
              </div>

                <div className="grid gap-4 p-4 lg:grid-cols-5">
                  <div className="lg:col-span-3">
                    <ZoomableImage src={active.imageUrl} alt="generated" />
                  </div>
                  <div className="lg:col-span-2">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs font-medium text-zinc-200">提示词</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-100">{active.prompt}</p>
                    {(active.tagKeys ?? []).length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {(active.tagKeys ?? []).map((k) => (
                          <span
                            key={k}
                            className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-zinc-200"
                          >
                            {labelForTagKey(k)}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText(active.prompt)}
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200 hover:bg-white/10"
                      >
                        复制提示词
                      </button>
                      <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText(active.imageUrl)}
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200 hover:bg-white/10"
                      >
                        复制图片链接
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <footer className="text-xs text-zinc-400">
          提醒：这只是一个生成器前端示例。请确保你拥有提示词与输出的合法使用权，并遵守相关法律与平台政策。
        </footer>
      </div>
    </div>
  );
}
