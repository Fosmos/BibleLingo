"use client";

import { useLayoutEffect, useState, type RefObject } from "react";
import { FIXED_PARCHMENT_FONT_PX } from "@/lib/parchmentFontRange";

interface FitTextOptions {
  minPx?: number;
  maxPx?: number;
}

// Every real caller now pins both ends to FIXED_PARCHMENT_FONT_PX (see
// lib/parchmentFontRange.ts) — these only matter if some future caller omits `options` entirely.
const DEFAULT_MIN_PX = FIXED_PARCHMENT_FONT_PX;
const DEFAULT_MAX_PX = FIXED_PARCHMENT_FONT_PX;
const SEARCH_STEPS = 8;
// A hidden probe and the real visible page are two different elements, so they can come out a
// couple of px apart even with byte-identical markup (subpixel rounding differs by element,
// and the real page's own interactive verse runs pick up slightly different metrics than an
// off-screen, never-interacted-with copy) — this margin absorbs that gap so the real page
// never overflows by the few px a probe alone wouldn't have caught.
const SAFETY_MARGIN_PX = 6;

// Binary-searches ONE font size that fits EVERY page of the chapter, not just whichever page
// currently happens to be showing — the reader asked for this explicitly: a size that changes
// page to page reads as inconsistent when flipping through, even though each individual page
// fills fine on its own. `probeContainerRef` must hold one child per `[data-fit-page]` (see
// ChapterReadingView.tsx) — each already given its own explicit height matching the real
// card's available content height, and each wrapping the SAME ChapterPageContent.tsx markup
// the real visible page uses — rendered hidden (off-screen, but still laid out for real, so
// their own line-wrapping is real too) purely for this measurement pass.
//
// A page that STILL overflows even at `maxPx` is excluded from the search entirely rather than
// dragging the whole chapter's own text down to compensate: a single verse too long to fit any
// page at all (see paginateSegments's own "never split mid-verse" note) is going to clip via
// ParchmentCard's own overflow-hidden no matter what size the rest of the chapter uses — the
// FIRST version of this search didn't draw that distinction, so one such page anywhere in a
// whole book/chapter forced literally every OTHER, perfectly reasonable page down to the
// smallest allowed size too, leaving them all looking half-empty for a problem only that one
// page actually had.
export function useUniformFitText(probeContainerRef: RefObject<HTMLElement | null>, deps: unknown[], options?: FitTextOptions): number {
  const minPx = options?.minPx ?? DEFAULT_MIN_PX;
  const maxPx = options?.maxPx ?? DEFAULT_MAX_PX;
  const [fontSizePx, setFontSizePx] = useState(minPx);

  useLayoutEffect(() => {
    const container = probeContainerRef.current;
    if (!container) return;
    let cancelled = false;

    function search() {
      if (cancelled) return;
      const pageProbes = Array.from(container!.querySelectorAll<HTMLElement>("[data-fit-page]"));
      if (pageProbes.length === 0) return;

      function setProbeSize(probe: HTMLElement, candidatePx: number) {
        probe.querySelectorAll<HTMLElement>("[data-fit-text]").forEach((target) => {
          target.style.fontSize = `${candidatePx}px`;
        });
      }

      // The real safety-margined check the binary search itself uses below.
      function fits(probe: HTMLElement, candidatePx: number): boolean {
        setProbeSize(probe, candidatePx);
        return probe.scrollHeight <= probe.clientHeight - SAFETY_MARGIN_PX;
      }

      // A DELIBERATELY margin-free check, used only to decide whether a page is fundamentally
      // excludable — a page that fits at minPx with, say, 2px of raw slack (less than
      // SAFETY_MARGIN_PX) genuinely DOES fit there; it just doesn't clear the margin the real
      // search wants for comfort. Excluding it here (an earlier version of this reused `fits`
      // — the margined check — for this decision too) would wrongly treat a perfectly normal
      // page as "unfittable," and once EVERY page in a chapter happened to be that close to the
      // line, `fittablePages` ended up empty and the whole search silently gave up and used
      // `maxPx` for everyone — the exact overflow this hook exists to prevent.
      function fitsRaw(probe: HTMLElement, candidatePx: number): boolean {
        setProbeSize(probe, candidatePx);
        return probe.scrollHeight <= probe.clientHeight;
      }

      // Pages that don't fit even at the SMALLEST allowed size are going to clip regardless of
      // what the rest of the chapter settles on (a single verse too long for any reasonable
      // size — see paginateSegments's own "never split mid-verse" note) — exclude them up
      // front so they never constrain the search below; everything else genuinely does fit
      // somewhere in [minPx, maxPx], which is what the search below is actually for.
      const fittablePages = pageProbes.filter((probe) => fitsRaw(probe, minPx));

      let best: number;
      if (fittablePages.length === 0) {
        // Every single page in the chapter is individually too dense even for the floor size —
        // a degenerate case in practice. minPx, not maxPx, is the safe thing to default to
        // here — maxPx is exactly the "silently overflow everywhere" failure mode this whole
        // exclude-and-search design exists to avoid.
        best = minPx;
      } else if (fittablePages.every((probe) => fits(probe, maxPx))) {
        // Every fittable page already fits comfortably at the largest allowed size — no need
        // to search for anything smaller.
        best = maxPx;
      } else {
        let lo = minPx;
        let hi = maxPx;
        best = minPx;
        for (let i = 0; i < SEARCH_STEPS; i++) {
          const mid = (lo + hi) / 2;
          if (fittablePages.every((probe) => fits(probe, mid))) {
            best = mid;
            lo = mid;
          } else {
            hi = mid;
          }
        }
      }

      setFontSizePx(best);
    }

    search();
    // The verse text renders in this app's own custom serif webfont (next/font/google), which
    // can still be loading — using a fallback font — at the exact moment this layout effect
    // first fires on a fresh page load. A search run against fallback-font metrics can pick a
    // size that genuinely doesn't fit once the real, usually-wider serif face swaps in, and
    // nothing else here would ever re-run to correct it. document.fonts.ready resolves once
    // the real font is actually available, so re-searching then (a no-op if it was already
    // loaded, since the two results agree) is what actually guarantees the final size matches
    // reality rather than whichever font happened to be active during the first measurement.
    if (typeof document !== "undefined" && "fonts" in document) {
      document.fonts.ready.then(search);
    }
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-run on caller-supplied deps, not on every render
  }, deps);

  return fontSizePx;
}
