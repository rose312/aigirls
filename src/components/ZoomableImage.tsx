"use client";

import { useEffect, useMemo, useState } from "react";

type Props = {
  src: string;
  alt: string;
  className?: string;
  maxHeightClassName?: string;
};

export default function ZoomableImage({
  src,
  alt,
  className,
  maxHeightClassName = "max-h-[80vh]",
}: Props) {
  const [zoom, setZoom] = useState<1 | 2>(1);

  const zoomLabel = useMemo(() => (zoom === 1 ? "点击放大" : "点击缩小"), [zoom]);

  useEffect(() => {
    setZoom(1);
  }, [src]);

  return (
    <div
      className={[
        "group relative w-full overflow-auto rounded-2xl border border-white/10 bg-black/30",
        className ?? "",
      ].join(" ")}
    >
      <img
        src={src}
        alt={alt}
        draggable={false}
        onClick={() => setZoom((z) => (z === 1 ? 2 : 1))}
        className={[
          "block h-auto select-none transition-transform duration-500",
          zoom === 1
            ? `w-full cursor-zoom-in object-contain ${maxHeightClassName} group-hover:scale-[1.01]`
            : "w-[220%] cursor-zoom-out",
        ].join(" ")}
        title={zoomLabel}
      />
      <div className="pointer-events-none absolute bottom-2 left-2 rounded-xl border border-white/10 bg-black/40 px-2 py-1 text-[11px] text-zinc-200 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
        {zoom === 1 ? "点击图片放大" : "已放大（可滚动查看细节）"}
      </div>
    </div>
  );
}
