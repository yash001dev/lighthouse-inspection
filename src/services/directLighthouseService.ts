export interface LighthouseReport {
  lhr: Record<string, unknown>; // Full Lighthouse result object
  report: string; // HTML report
}

export interface CoreWebVitalsMetrics {
  fcp: { value: number; score: number; displayValue: string; title: string };
  lcp: { value: number; score: number; displayValue: string; title: string };
  cls: { value: number; score: number; displayValue: string; title: string };
  tbt: { value: number; score: number; displayValue: string; title: string };
  si: { value: number; score: number; displayValue: string; title: string };
  fid: { value: number; score: number; displayValue: string; title: string };
  [key: string]: {
    value: number;
    score: number;
    displayValue: string;
    title: string;
  };
}

export interface LighthouseMetrics {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
  fcp: number;
  lcp: number;
  cls: number;
  fid: number;
  tbt: number;
  si: number;
}

export interface DetailedLighthouseResult {
  metrics: LighthouseMetrics;
  coreWebVitals: CoreWebVitalsMetrics;
  fullReport: LighthouseReport;
  downloadableJson: string; // Stringified JSON for download
  storageInfo?: {
    saved: boolean;
    id?: string;
    filename?: string;
    downloadUrl?: string;
    viewUrl?: string;
    error?: string;
  };
}

export class DirectLighthouseService {
  private static readonly API_BASE_URL = "http://localhost:3001";

  static async checkServerHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/health`);
      return response.ok;
    } catch (error) {
      console.error("Server health check failed:", error);
      return false;
    }
  }

  static async runLighthouseAnalysis(
    url: string,
    strategy: "mobile" | "desktop" = "mobile"
  ): Promise<DetailedLighthouseResult> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({ url, strategy }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Lighthouse analysis failed: ${response.status} ${errorText}`
        );
      }

      const rawResult = await response.json();
      console.log("Raw Result:", rawResult);

      // Log the raw result for debugging
      console.log("Raw Lighthouse response:", rawResult);
      console.log("Extracted metrics:", rawResult.extractedMetrics);

      // Transform the server response to match our expected format
      const result: DetailedLighthouseResult = {
        metrics: rawResult.extractedMetrics?.metrics || {
          performance: 0,
          accessibility: 0,
          bestPractices: 0,
          seo: 0,
          fcp: 0,
          lcp: 0,
          cls: 0,
          fid: 0,
          tbt: 0,
          si: 0,
        },
        coreWebVitals: rawResult.extractedMetrics?.coreWebVitals || {
          fcp: {
            value: 0,
            score: 0,
            displayValue: "N/A",
            title: "First Contentful Paint",
          },
          lcp: {
            value: 0,
            score: 0,
            displayValue: "N/A",
            title: "Largest Contentful Paint",
          },
          cls: {
            value: 0,
            score: 0,
            displayValue: "N/A",
            title: "Cumulative Layout Shift",
          },
          tbt: {
            value: 0,
            score: 0,
            displayValue: "N/A",
            title: "Total Blocking Time",
          },
          si: { value: 0, score: 0, displayValue: "N/A", title: "Speed Index" },
          fid: {
            value: 0,
            score: 0,
            displayValue: "N/A",
            title: "Max Potential First Input Delay",
          },
        },
        fullReport: {
          lhr: rawResult,
          report: rawResult.report || "",
        },
        downloadableJson: JSON.stringify(rawResult, null, 2),
        // Include storage info if available
        storageInfo: rawResult.storageInfo,
      };

      // Log the transformed result for debugging
      console.log("Transformed result:", result);
      console.log("Metrics:", result.metrics);
      console.log("Core Web Vitals:", result.coreWebVitals);

      return result;
    } catch (error) {
      console.error("Error running Lighthouse analysis:", error);
      throw new Error(
        error instanceof Error
          ? `Failed to analyze ${url}: ${error.message}`
          : `Failed to analyze ${url}: Unknown error`
      );
    }
  }
}
