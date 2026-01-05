// GeneratedImages.jsx
import { useEffect, useMemo, useState } from "react";

function baseName(name) {
  return name.replace(/\.[^.]+$/, "");
}
function prettifyFileName(name) {
  return baseName(name)
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
function hashHue(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h % 360;
}
function gradientFor(key) {
  const a = hashHue(key);
  const b = (a + 34) % 360;
  return `linear-gradient(135deg, hsla(${a},92%,62%,0.22), hsla(${b},92%,62%,0.10))`;
}

// ✅ Auto-load ALL images in src/assets/images (CRA/Webpack)
// If this file is in src/components, change "./assets/images" -> "../assets/images"
function loadAssetImages() {
  try {
    // eslint-disable-next-line global-require
    const ctx = require.context("./assets/images", false, /\.(png|jpe?g|webp|gif)$/i);
    const keys = ctx.keys();

    return keys
      .map((k) => {
        const file = k.replace("./", "");
        return {
          id: `img-${file}`,
          file,
          url: ctx(k),
          title: prettifyFileName(file),
        };
      })
      .sort((a, b) => a.title.localeCompare(b.title));
  } catch {
    return [];
  }
}

export default function GeneratedImages() {
  const images = useMemo(() => loadAssetImages(), []);
  const [activeId, setActiveId] = useState(images[0]?.id || null);

  const active = useMemo(
    () => images.find((x) => x.id === activeId) || null,
    [images, activeId]
  );

  const [open, setOpen] = useState(false);

  // Keyboard support for lightbox
  useEffect(() => {
    const onKey = (e) => {
      if (!open) return;
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowRight") {
        const idx = images.findIndex((x) => x.id === activeId);
        const next = images[(idx + 1) % images.length];
        if (next) setActiveId(next.id);
      }
      if (e.key === "ArrowLeft") {
        const idx = images.findIndex((x) => x.id === activeId);
        const prev = images[(idx - 1 + images.length) % images.length];
        if (prev) setActiveId(prev.id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, images, activeId]);

  const goPrev = () => {
    if (!images.length) return;
    const idx = images.findIndex((x) => x.id === activeId);
    const prev = images[(idx - 1 + images.length) % images.length];
    if (prev) setActiveId(prev.id);
  };

  const goNext = () => {
    if (!images.length) return;
    const idx = images.findIndex((x) => x.id === activeId);
    const next = images[(idx + 1) % images.length];
    if (next) setActiveId(next.id);
  };

  return (
    <section className="w-full max-w-6xl mx-auto px-6 pb-14">
      {/* Header */}
      <div className="flex items-end justify-between gap-6 mb-6">
        <div>
          <h3 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Your Generated Gallery
          </h3>
          <p className="text-white/60 mt-1">
            Auto-loaded from <span className="text-white/80">src/assets/images</span> — click to view full size.
          </p>
        </div>

        <div className="hidden md:flex items-center gap-2 text-xs text-white/50">
          <span className="px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-md">
            Local images
          </span>
          <span className="px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-md">
            Lightbox
          </span>
        </div>
      </div>

      {/* Empty state */}
      {!images.length && (
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-8 text-white/70">
          <div className="text-xl font-bold text-white">No images found.</div>
          <div className="mt-2 text-sm text-white/60">
            Put <span className="text-white/85">.png / .jpg / .jpeg / .webp / .gif</span> inside{" "}
            <span className="text-white/85">client/src/assets/images</span>.
          </div>
          <div className="mt-4 text-xs text-white/50">
            If this component is in <span className="text-white/75">src/components</span>, update the path to:
            <span className="text-white/75"> require.context("../assets/images", ...)</span>
          </div>
        </div>
      )}

      {!!images.length && (
        <>
          {/* Gallery grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {images.map((img) => (
              <button
                key={img.id}
                onClick={() => {
                  setActiveId(img.id);
                  setOpen(true);
                }}
                className="group rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.35)] hover:bg-white/[0.06] transition-all"
                title={img.title}
              >
                <div className="relative">
                  <div
                    className="absolute inset-0 opacity-60"
                    style={{ background: gradientFor(img.file) }}
                  />
                  <img
                    src={img.url}
                    alt={img.title}
                    className="relative w-full h-64 object-cover transform transition-all duration-500 group-hover:scale-[1.03]"
                    loading="lazy"
                  />

                  <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/60 via-black/20 to-transparent">
                    <div className="text-white font-extrabold truncate">{img.title}</div>
                    <div className="text-white/60 text-xs truncate">{img.file}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Lightbox */}
          {open && active && (
            <div
              className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-xl flex items-center justify-center px-4"
              onMouseDown={(e) => {
                if (e.target === e.currentTarget) setOpen(false);
              }}
              role="dialog"
              aria-modal="true"
              aria-label="Image preview"
            >
              <div className="relative w-[1050px] max-w-[96vw] rounded-3xl border border-white/10 bg-white/[0.05] backdrop-blur-2xl shadow-[0_35px_120px_rgba(0,0,0,0.65)] overflow-hidden">
                {/* Top bar */}
                <div className="flex items-center justify-between gap-4 p-4 border-b border-white/10">
                  <div className="min-w-0">
                    <div className="text-white font-extrabold truncate">{active.title}</div>
                    <div className="text-white/60 text-xs truncate">{active.file}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={goPrev}
                      className="w-10 h-10 rounded-full bg-black/25 hover:bg-black/40 border border-white/10 flex items-center justify-center transition"
                      title="Previous (←)"
                    >
                      <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                        <path d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
                      </svg>
                    </button>

                    <button
                      onClick={goNext}
                      className="w-10 h-10 rounded-full bg-black/25 hover:bg-black/40 border border-white/10 flex items-center justify-center transition"
                      title="Next (→)"
                    >
                      <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                        <path d="M8.59 16.59 10 18l6-6-6-6-1.41 1.41L13.17 12z" />
                      </svg>
                    </button>

                    <button
                      onClick={() => setOpen(false)}
                      className="w-10 h-10 rounded-full bg-black/25 hover:bg-black/40 border border-white/10 flex items-center justify-center transition"
                      title="Close (Esc)"
                    >
                      <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                        <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Image */}
                <div className="p-4">
                  <div className="rounded-2xl overflow-hidden border border-white/10 bg-black/30">
                    <img
                      src={active.url}
                      alt={active.title}
                      className="w-full max-h-[72vh] object-contain bg-black/40"
                    />
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs text-white/55">
                    <div>
                      Tip: <span className="text-white/80">← →</span> to navigate • <span className="text-white/80">Esc</span> to close
                    </div>
                    <a
                      href={active.url}
                      download={active.file}
                      className="px-3 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 transition"
                    >
                      Download
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
