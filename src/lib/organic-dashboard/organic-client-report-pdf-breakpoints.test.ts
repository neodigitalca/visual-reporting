import { describe, expect, it } from "vitest";
import {
  cssBreakpointsToCanvasPx,
  planPdfCanvasSlices,
} from "@/lib/organic-dashboard/organic-client-report-pdf-breakpoints";

describe("cssBreakpointsToCanvasPx", () => {
  it("scales CSS offsets by capture scale", () => {
    expect(cssBreakpointsToCanvasPx([0, 100, 400], 2)).toEqual([0, 200, 800]);
  });
});

describe("planPdfCanvasSlices", () => {
  const pageH = 1000;

  it("returns one slice when content fits one page", () => {
    expect(planPdfCanvasSlices(800, pageH, [])).toEqual([{ startPx: 0, endPx: 800 }]);
  });

  it("splits on fixed height when no breakpoints apply", () => {
    expect(planPdfCanvasSlices(2500, pageH, [])).toEqual([
      { startPx: 0, endPx: 1000 },
      { startPx: 1000, endPx: 2000 },
      { startPx: 2000, endPx: 2500 },
    ]);
  });

  it("snaps to section start in the bottom snap zone", () => {
    const slices = planPdfCanvasSlices(2500, pageH, [950]);
    expect(slices[0]).toEqual({ startPx: 0, endPx: 950 });
    expect(slices[1]?.startPx).toBe(950);
  });

  it("ends the page before a block instead of cutting through it", () => {
    const avoid = [{ topPx: 920, bottomPx: 1100 }];
    const slices = planPdfCanvasSlices(2500, pageH, [], avoid);
    expect(slices[0]?.endPx).toBe(920);
    expect(slices[1]?.startPx).toBe(920);
  });

  it("ends before a major section so the section starts at the top of the next page", () => {
    const slices = planPdfCanvasSlices(2500, pageH, [], [], [980]);
    expect(slices[0]?.endPx).toBe(980);
    expect(slices[1]?.startPx).toBe(980);
  });
});
