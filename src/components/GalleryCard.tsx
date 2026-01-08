"use client";

import { useMemo, useState } from "react";

type Props = {
  imageUrl: string;
  aspectClassName: string;
  title: string;
  subtitle?: string;
  prompt: string;
  favorite?: boolean;
  onOpen: () => void;
  onToggleFavorite?: () => void;
  onCopyPrompt?: () => void;
  onCopyLink?: () => void;
  downloadUrl?: string;
};

function Icon({
  name,
  className,
}: {
  name: "heart" | "download" | "copy" | "link" | "expand";
  className?: string;
}) {
  const common = "h-4 w-4";
  const cls = [common, className ?? ""].join(" ");
  if (name === "heart") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={cls} aria-hidden="true">
        <path
          d="M12 21s-7-4.35-9.5-8.1C.7 9.95 2.1 6.8 5.2 6.05c1.6-.4 3.25.15 4.25 1.25 1-1.1 2.65-1.65 4.25-1.25 3.1.75 4.5 3.9 2.7 6.85C19 16.65 12 21 12 21Z"
          className="stroke-current"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (name === "download") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={cls} aria-hidden="true">
        <path
          d="M12 3v10m0 0 4-4m-4 4-4-4M5 17v3h14v-3"
          className="stroke-current"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (name === "copy") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={cls} aria-hidden="true">
        <path
          d="M9 9h10v12H9V9Z"
          className="stroke-current"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"
          className="stroke-current"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (name === "link") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={cls} aria-hidden="true">
        <path
          d="M10 13a5 5 0 0 1 0-7l1-1a5 5 0 0 1 7 7l-1 1"
          className="stroke-current"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path
          d="M14 11a5 5 0 0 1 0 7l-1 1a5 5 0 0 1-7-7l1-1"
          className="stroke-current"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cls} aria-hidden="true">
      <path
        d="M9 3H3v6m12-6h6v6M9 21H3v-6m12 6h6v-6"
        className="stroke-current"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function GalleryCard({
  imageUrl,
  aspectClassName,
  title,
  subtitle,
  prompt,
  favorite,
  onOpen,
  onToggleFavorite,
  onCopyPrompt,
  onCopyLink,
  downloadUrl,
}: Props) {
  const [origin, setOrigin] = useState({ x: 50, y: 50 });

  const promptPreview = useMemo(() => {
    const t = prompt.trim().replace(/\s+/g, " ");
    if (t.length <= 72) return t;
    return `${t.slice(0, 72)}…`;
  }, [prompt]);

  return (
    <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-b from-white/14 to-white/0 p-[1px]">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-[0_22px_60px_rgba(0,0,0,0.55)] backdrop-blur">
        <button
          type="button"
          onClick={onOpen}
          onMouseMove={(e) => {
            const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            setOrigin({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
          }}
          className="block w-full text-left focus:outline-none focus:ring-2 focus:ring-pink-500/40"
          title="点击查看"
        >
          <div className={["relative", aspectClassName].join(" ")}>
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={title}
                loading="lazy"
                style={{ transformOrigin: `${origin.x}% ${origin.y}%` }}
                className="h-full w-full select-none object-cover transition-transform duration-500 will-change-transform group-hover:scale-[1.18] group-hover:saturate-110"
                draggable={false}
              />
            ) : (
              <div className="h-full w-full animate-pulse bg-white/5" />
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/0 opacity-90" />
          </div>

          <div className="absolute left-3 top-3 flex items-center gap-2">
            <span className="rounded-full border border-white/15 bg-black/30 px-2.5 py-1 text-[11px] text-zinc-100 backdrop-blur">
              {title}
            </span>
            {subtitle ? (
              <span className="hidden rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[11px] text-zinc-100 backdrop-blur sm:inline">
                {subtitle}
              </span>
            ) : null}
          </div>

          <div className="pointer-events-none absolute bottom-0 left-0 right-0 p-3">
            <div className="rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-zinc-100 backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <span className="truncate font-medium">{promptPreview || "（无提示词）"}</span>
                <span className="flex items-center gap-1 text-[11px] text-zinc-300">
                  <Icon name="expand" className="h-3.5 w-3.5" /> 查看
                </span>
              </div>
            </div>
          </div>
        </button>

        <div className="absolute right-3 top-3 flex items-center gap-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          {onToggleFavorite ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite();
              }}
              className={[
                "rounded-2xl border px-2.5 py-2 text-xs text-zinc-100 backdrop-blur transition hover:bg-white/10 active:scale-[0.98]",
                favorite
                  ? "border-pink-500/40 bg-pink-500/20"
                  : "border-white/12 bg-black/35",
              ].join(" ")}
              title={favorite ? "取消收藏" : "收藏"}
              aria-label={favorite ? "取消收藏" : "收藏"}
            >
              <Icon name="heart" className={favorite ? "text-pink-200" : "text-zinc-100"} />
            </button>
          ) : null}

          {downloadUrl ? (
            <a
              href={downloadUrl}
              download
              onClick={(e) => e.stopPropagation()}
              className="rounded-2xl border border-white/12 bg-black/35 px-2.5 py-2 text-xs text-zinc-100 backdrop-blur transition hover:bg-white/10 active:scale-[0.98]"
              title="下载"
              aria-label="下载"
            >
              <Icon name="download" />
            </a>
          ) : null}

          {onCopyPrompt ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCopyPrompt();
              }}
              className="rounded-2xl border border-white/12 bg-black/35 px-2.5 py-2 text-xs text-zinc-100 backdrop-blur transition hover:bg-white/10 active:scale-[0.98]"
              title="复制提示词"
              aria-label="复制提示词"
            >
              <Icon name="copy" />
            </button>
          ) : null}

          {onCopyLink ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCopyLink();
              }}
              className="rounded-2xl border border-white/12 bg-black/35 px-2.5 py-2 text-xs text-zinc-100 backdrop-blur transition hover:bg-white/10 active:scale-[0.98]"
              title="复制图片链接"
              aria-label="复制图片链接"
            >
              <Icon name="link" />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
