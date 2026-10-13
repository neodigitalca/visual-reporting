import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderReportCanvasToPdf } from "@/lib/organic-dashboard/organic-client-report-pdf-canvas";

const addPageMock = vi.fn();
const addImageMock = vi.fn();
const setPageMock = vi.fn();
const textMock = vi.fn();
const getNumberOfPagesMock = vi.fn().mockReturnValue(2);

vi.mock("jspdf", () => ({
  jsPDF: class MockJsPdf {
    internal = {
      pageSize: {
        getWidth: () => 8.5,
        getHeight: () => 11,
      },
    };
    addPage = addPageMock;
    addImage = addImageMock;
    setPage = setPageMock;
    setFontSize = vi.fn();
    setTextColor = vi.fn();
    text = textMock;
    getNumberOfPages = getNumberOfPagesMock;
  },
}));

function mockPageCanvas() {
  return {
    width: 720,
    height: 1000,
    getContext: () => ({
      fillStyle: "",
      fillRect: vi.fn(),
      drawImage: vi.fn(),
    }),
    toDataURL: () => "data:image/jpeg;base64,abc",
  };
}

describe("renderReportCanvasToPdf", () => {
  beforeEach(() => {
    addPageMock.mockClear();
    addImageMock.mockClear();
    textMock.mockClear();
    vi.stubGlobal("document", {
      createElement: (tag: string) => {
        if (tag === "canvas") return mockPageCanvas();
        return {};
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("adds one image per planned slice and draws footers", () => {
    const canvas = {
      width: 720,
      height: 2000,
    } as HTMLCanvasElement;

    renderReportCanvasToPdf(canvas, {
      margin: 0.5,
      imageType: "jpeg",
      imageQuality: 0.98,
      jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
      theme: "print",
      breakpointsCanvasPx: [],
      preparedOn: "Oct 13, 2026",
    });

    expect(addImageMock.mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(addPageMock.mock.calls.length).toBeGreaterThanOrEqual(1);
    expect(textMock).toHaveBeenCalled();
  });
});
