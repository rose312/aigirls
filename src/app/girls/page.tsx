"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SIZE_OPTIONS, STYLE_PRESETS, type StyleId } from "@/lib/presets";
import { useGallery, type GalleryItem } from "@/app/providers";
import { useAuth } from "@/app/providers";
import { useToast } from "@/app/providers";
import { aspectClassForSize } from "@/lib/aspect";
import { TAG_GROUPS, labelForTagKey, parseTagKey, tagKey, type TagCategory } from "@/lib/tags";
import { copyTextToClipboard } from "@/lib/clipboard";
import ZoomableImage from "@/components/ZoomableImage";
import GalleryCard from "@/components/GalleryCard";

type SortMode = "newest" | "oldest" | "favorites";

function formatTime(ts: number) {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return "";
  }
}

export default function GirlsPage() {
  const router = useRouter();
  const { items, clear, remove, toggleFavorite } = useGallery();
  const { user, syncMyImages } = useAuth();
  const toast = useToast();

  const [q, setQ] = useState("");
  const [styleFilter, setStyleFilter] = useState<StyleId | "all">("all");
  const [sizeFilter, setSizeFilter] = useState<"all" | (typeof SIZE_OPTIONS)[number]["id"]>(
    "all",
  );
  const [sort, setSort] = useState<SortMode>("newest");
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [tagFilter, setTagFilter] = useState<Record<TagCategory, string[]>>({
    hairColor: [],
    hairStyle: [],
    outfit: [],
    scene: [],
    mood: [],
    extra: [],
  });
  const [active, setActive] = useState<GalleryItem | null>(null);

  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const it of items) {
      for (const k of it.tagKeys ?? []) {
        counts[k] = (counts[k] ?? 0) + 1;
      }
    }
    return counts;
  }, [items]);

  function toggleFilterTag(key: string) {
    const parsed = parseTagKey(key);
    if (!parsed) return;
    setTagFilter((prev) => {
      const current = prev[parsed.category] ?? [];
      const next = current.includes(key) ? current.filter((x) => x !== key) : [...current, key];
      return { ...prev, [parsed.category]: next };
    });
  }

  function resetAllFilters() {
    setQ("");
    setStyleFilter("all");
    setSizeFilter("all");
    setSort("newest");
    setOnlyFavorites(false);
    setTagFilter({
      hairColor: [],
      hairStyle: [],
      outfit: [],
      scene: [],
      mood: [],
      extra: [],
    });
  }

  const filtered = useMemo(() => {
    const keyword = q.trim().toLowerCase();

    const base = items.filter((it) => {
      if (onlyFavorites && !it.favorite) return false;
      if (styleFilter !== "all" && it.styleId !== styleFilter) return false;
      if (sizeFilter !== "all" && it.size !== sizeFilter) return false;

      for (const category of Object.keys(tagFilter) as TagCategory[]) {
        const selected = tagFilter[category];
        if (!selected || selected.length === 0) continue;
        const itemTags = it.tagKeys ?? [];
        const hit = selected.some((k) => itemTags.includes(k));
        if (!hit) return false;
      }

      if (!keyword) return true;
      const tagsText = (it.tagKeys ?? []).map((k) => labelForTagKey(k)).join(" ");
      return (
        it.prompt.toLowerCase().includes(keyword) ||
        it.styleLabel.toLowerCase().includes(keyword) ||
        it.size.toLowerCase().includes(keyword) ||
        tagsText.toLowerCase().includes(keyword)
      );
    });

    const sorted = [...base].sort((a, b) => {
      if (sort === "oldest") return a.createdAt - b.createdAt;
      if (sort === "favorites") return Number(b.favorite) - Number(a.favorite) || b.createdAt - a.createdAt;
      return b.createdAt - a.createdAt;
    });

    return sorted;
  }, [items, onlyFavorites, q, sizeFilter, sort, styleFilter, tagFilter]);

  async function copyWithToast(text: string, okMessage: string) {
    const ok = await copyTextToClipboard(text);
    if (ok) toast.success(okMessage);
    else toast.error("复制失败，请检查浏览器权限。");
  }

  return (
    <div className="relative min-h-screen bg-[#05060a] text-zinc-50">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(800px_520px_at_15%_12%,rgba(236,72,153,0.14),transparent_60%),radial-gradient(800px_520px_at_85%_18%,rgba(59,130,246,0.14),transparent_60%),radial-gradient(900px_650px_at_50%_110%,rgba(168,85,247,0.12),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.08] mix-blend-overlay [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.35)_1px,transparent_0)] [background-size:18px_18px]" />

      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-pink-500 via-violet-500 to-sky-500 shadow-[0_0_0_1px_rgba(255,255,255,0.12)]" />
              <div>
                <h1 className="text-xl font-semibold tracking-tight">女孩库</h1>
                <p className="text-sm text-zinc-300">按风格/尺寸筛选，点开可查看详情。</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200 hover:bg-white/10"
                href="/"
              >
                去生成
              </Link>
              <button
                type="button"
                onClick={() => syncMyImages()}
                disabled={!user}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200 hover:bg-white/10 disabled:opacity-50"
                title={user ? "从 Supabase 同步我的图片" : "请先登录（首页右上角）"}
              >
                云端同步
              </button>
              <button
                type="button"
                onClick={clear}
                disabled={items.length === 0}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200 hover:bg-white/10 disabled:opacity-50"
              >
                清空
              </button>
            </div>
          </div>
        </header>

        <main className="grid gap-6 lg:grid-cols-5">
          <aside className="lg:col-span-2">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_22px_60px_rgba(0,0,0,0.55)] backdrop-blur">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-zinc-200">筛选</h2>
                <span className="text-xs text-zinc-400">{filtered.length} / {items.length}</span>
              </div>

              <div className="mt-3 grid gap-4">
                <div>
                  <label className="text-xs text-zinc-400" htmlFor="search">
                    搜索（提示词/风格/尺寸）
                  </label>
                  <input
                    id="search"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="例如：自然光、汉服、85mm..."
                    className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                  />
                </div>

                <div>
                  <p className="text-xs text-zinc-400">风格</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setStyleFilter("all")}
                      className={[
                        "rounded-xl border px-3 py-2 text-sm transition",
                        styleFilter === "all"
                          ? "border-pink-500/40 bg-pink-500/10 text-zinc-50"
                          : "border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10",
                      ].join(" ")}
                    >
                      全部
                    </button>
                    {STYLE_PRESETS.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setStyleFilter(s.id)}
                        className={[
                          "rounded-xl border px-3 py-2 text-sm transition",
                          styleFilter === s.id
                            ? "border-pink-500/40 bg-pink-500/10 text-zinc-50"
                            : "border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10",
                        ].join(" ")}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-zinc-400">尺寸</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setSizeFilter("all")}
                      className={[
                        "rounded-xl border px-3 py-2 text-sm transition",
                        sizeFilter === "all"
                          ? "border-sky-500/40 bg-sky-500/10 text-zinc-50"
                          : "border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10",
                      ].join(" ")}
                    >
                      全部
                    </button>
                    {SIZE_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSizeFilter(opt.id)}
                        className={[
                          "rounded-xl border px-3 py-2 text-sm transition",
                          sizeFilter === opt.id
                            ? "border-sky-500/40 bg-sky-500/10 text-zinc-50"
                            : "border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10",
                        ].join(" ")}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-zinc-400" htmlFor="sort">
                    排序
                  </label>
                  <select
                    id="sort"
                    value={sort}
                    onChange={(e) => setSort(e.target.value as SortMode)}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                  >
                    <option value="newest">最新</option>
                    <option value="oldest">最早</option>
                    <option value="favorites">收藏优先</option>
                  </select>
                </div>

                <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-200 hover:bg-black/25">
                  <span>只看收藏</span>
                  <input
                    type="checkbox"
                    checked={onlyFavorites}
                    onChange={(e) => setOnlyFavorites(e.target.checked)}
                    className="h-4 w-4 accent-pink-500"
                  />
                </label>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-zinc-200">细分标签</p>
                      <p className="mt-0.5 text-xs text-zinc-400">每一类可多选（类内“或”，类间“且”）</p>
                    </div>
                    <button
                      type="button"
                      onClick={resetAllFilters}
                      className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-200 hover:bg-white/10"
                    >
                      全部重置
                    </button>
                  </div>

                  <div className="mt-4 grid gap-4">
                    {TAG_GROUPS.map((group) => (
                      <div key={group.category}>
                        <p className="text-xs font-medium text-zinc-300">{group.label}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {group.options.map((opt) => {
                            const k = tagKey(group.category as TagCategory, opt.id);
                            const active = tagFilter[group.category as TagCategory]?.includes(k);
                            const count = tagCounts[k] ?? 0;
                            return (
                              <button
                                key={k}
                                type="button"
                                onClick={() => toggleFilterTag(k)}
                                className={[
                                  "rounded-xl border px-3 py-1.5 text-sm transition",
                                  active
                                    ? "border-pink-500/40 bg-pink-500/10 text-zinc-50"
                                    : "border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10",
                                ].join(" ")}
                                title={`${count} 张`}
                              >
                                {opt.label}
                                <span className="ml-2 text-xs text-zinc-400">{count}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}

                    {items.some((it) => (it.tagKeys ?? []).some((k) => parseTagKey(k)?.category === "extra")) ? (
                      <div>
                        <p className="text-xs font-medium text-zinc-300">自定义</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {Object.keys(tagCounts)
                            .filter((k) => parseTagKey(k)?.category === "extra")
                            .sort((a, b) => (tagCounts[b] ?? 0) - (tagCounts[a] ?? 0))
                            .slice(0, 18)
                            .map((k) => {
                              const active = tagFilter.extra.includes(k);
                              return (
                                <button
                                  key={k}
                                  type="button"
                                  onClick={() => toggleFilterTag(k)}
                                  className={[
                                    "rounded-xl border px-3 py-1.5 text-sm transition",
                                    active
                                      ? "border-pink-500/40 bg-pink-500/10 text-zinc-50"
                                      : "border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10",
                                  ].join(" ")}
                                  title={`${tagCounts[k] ?? 0} 张`}
                                >
                                  {labelForTagKey(k)}
                                  <span className="ml-2 text-xs text-zinc-400">{tagCounts[k] ?? 0}</span>
                                </button>
                              );
                            })}
                        </div>
                      </div>
                    ) : null}

                    {Object.values(tagFilter).some((arr) => arr.length > 0) ? (
                      <div className="flex flex-wrap gap-2">
                        {(Object.keys(tagFilter) as TagCategory[])
                          .flatMap((cat) => tagFilter[cat])
                          .map((k) => (
                            <button
                              key={k}
                              type="button"
                              onClick={() => toggleFilterTag(k)}
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

                <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-zinc-300">
                  说明：图片会保存在浏览器本地（localStorage），容量有限；如需跨设备/长期保存，可接入数据库或对象存储。
                </div>
              </div>
            </div>
          </aside>

          <section className="lg:col-span-3">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_22px_60px_rgba(0,0,0,0.55)] backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-medium text-zinc-200">画廊</h2>
                <span className="text-xs text-zinc-400">{filtered.length} 张</span>
              </div>

              {items.length === 0 ? (
                <div className="mt-4 grid place-items-center rounded-2xl border border-dashed border-white/15 bg-black/20 p-10 text-center">
                  <div className="max-w-md">
                    <p className="text-base font-semibold">还没有图片</p>
                    <p className="mt-1 text-sm text-zinc-300">先去生成几张再回来逛逛。</p>
                    <div className="mt-5">
                      <Link
                        href="/"
                        className="inline-flex rounded-2xl bg-gradient-to-r from-pink-500 via-violet-500 to-sky-500 px-4 py-2 text-sm font-semibold text-white hover:brightness-110"
                      >
                        去生成
                      </Link>
                    </div>
                  </div>
                </div>
              ) : filtered.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-6 text-sm text-zinc-300">
                  没有匹配结果，换个关键词或重置筛选试试。
                </div>
              ) : (
                <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                  {filtered.map((it) => (
                    <GalleryCard
                      key={it.id}
                      imageUrl={it.imageUrl}
                      aspectClassName={aspectClassForSize(it.size)}
                      title={it.styleLabel}
                      subtitle={it.size}
                      prompt={it.prompt}
                      favorite={it.favorite}
                      onOpen={() => setActive(it)}
                      onToggleFavorite={() => {
                        toggleFavorite(it.id);
                        toast.info(it.favorite ? "已取消收藏" : "已收藏");
                      }}
                      onCopyPrompt={() => void copyWithToast(it.prompt, "已复制提示词")}
                      onCopyLink={() => void copyWithToast(it.imageUrl, "已复制图片链接")}
                      downloadUrl={it.imageUrl || undefined}
                    />
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
            onClick={() => setActive(null)}
          >
            <div
              className="w-full max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-zinc-950"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="grid gap-0 md:grid-cols-5">
                <div className="md:col-span-3">
                  <div className="p-3">
                    <ZoomableImage src={active.imageUrl} alt="generated" />
                  </div>
                </div>
                <div className="flex flex-col gap-4 p-4 md:col-span-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{active.styleLabel}</p>
                      <p className="mt-1 text-xs text-zinc-400">
                        {active.size} · 质量 {active.quality} · {formatTime(active.createdAt)}
                      </p>
                      {active.model ? (
                        <p className="mt-1 text-xs text-zinc-500">模型：{active.model}</p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => setActive(null)}
                      className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-200 hover:bg-white/10"
                    >
                      关闭
                    </button>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                    <p className="text-xs font-medium text-zinc-200">提示词</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-100">{active.prompt}</p>
                  </div>

                  {(active.tagKeys ?? []).length > 0 ? (
                    <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                      <p className="text-xs font-medium text-zinc-200">标签</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(active.tagKeys ?? []).map((k) => (
                          <button
                            key={k}
                            type="button"
                            onClick={() => toggleFilterTag(k)}
                            className={[
                              "rounded-xl border px-3 py-1.5 text-sm transition",
                              (tagFilter[parseTagKey(k)?.category ?? "extra"] ?? []).includes(k)
                                ? "border-pink-500/40 bg-pink-500/10 text-zinc-50"
                                : "border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10",
                            ].join(" ")}
                            title="点击用于筛选"
                          >
                            {labelForTagKey(k)}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="grid gap-2">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          toggleFavorite(active.id);
                          setActive((prev) => (prev ? { ...prev, favorite: !prev.favorite } : prev));
                          toast.info(active.favorite ? "已取消收藏" : "已收藏");
                        }}
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200 hover:bg-white/10 active:scale-[0.98]"
                      >
                        {active.favorite ? "取消收藏" : "收藏"}
                      </button>
                      <a
                        href={active.imageUrl}
                        download={`ai-girl-${active.id}.png`}
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200 hover:bg-white/10"
                      >
                        下载
                      </a>
                      <button
                        type="button"
                        onClick={() => void copyWithToast(active.prompt, "已复制提示词")}
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200 hover:bg-white/10 active:scale-[0.98]"
                      >
                        复制提示词
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const url = `/?prompt=${encodeURIComponent(active.prompt)}&style=${encodeURIComponent(
                            active.styleId,
                          )}&size=${encodeURIComponent(active.size)}&quality=${encodeURIComponent(
                            active.quality,
                          )}&tags=${encodeURIComponent((active.tagKeys ?? []).join(","))}`;
                          router.push(url);
                        }}
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200 hover:bg-white/10"
                      >
                        用此提示词再生成
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          remove(active.id);
                          setActive(null);
                        }}
                        className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-100 hover:bg-rose-500/15"
                      >
                        删除
                      </button>
                      <button
                        type="button"
                        onClick={() => void copyWithToast(active.imageUrl, "已复制图片链接")}
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200 hover:bg-white/10 active:scale-[0.98]"
                      >
                        复制图片链接
                      </button>
                    </div>
                  </div>

                  <div className="text-xs text-zinc-500">
                    提醒：生成内容请遵守法律与平台政策（仅限成年、非露骨）。
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
