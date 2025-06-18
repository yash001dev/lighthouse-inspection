interface LighthouseMetrics {
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

interface DetailedAnalysisResult {
  metrics: LighthouseMetrics;
  coreWebVitals: {
    fcp: { value: number; score: number; displayValue: string };
    lcp: { value: number; score: number; displayValue: string };
    cls: { value: number; score: number; displayValue: string };
    tbt: { value: number; score: number; displayValue: string };
    si: { value: number; score: number; displayValue: string };
  };
  pageSpeedInsightsUrl: string;
  fullData: PageSpeedResponse;
}

interface PageSpeedResponse {
  lighthouseResult: {
    categories: {
      performance: { score: number };
      accessibility: { score: number };
      "best-practices": { score: number };
      seo: { score: number };
    };
    audits: {
      "first-contentful-paint": {
        displayValue: string;
        numericValue: number;
        score: number;
      };
      "largest-contentful-paint": {
        displayValue: string;
        numericValue: number;
        score: number;
      };
      "cumulative-layout-shift": {
        displayValue: string;
        numericValue: number;
        score: number;
      };
      "first-input-delay"?: {
        displayValue: string;
        numericValue: number;
        score: number;
      };
      "max-potential-fid"?: {
        displayValue: string;
        numericValue: number;
        score: number;
      };
      "total-blocking-time": {
        displayValue: string;
        numericValue: number;
        score: number;
      };
      "speed-index": {
        displayValue: string;
        numericValue: number;
        score: number;
      };
      [key: string]:
        | {
            displayValue?: string;
            numericValue?: number;
            score?: number;
          }
        | undefined; // Allow additional audit fields
    };
  };
  finalUrl?: string;
  requestedUrl?: string;
  id?: string;
}

export class LighthouseService {
  private static readonly API_KEY = import.meta.env.VITE_PAGESPEED_API_KEY;
  private static readonly BASE_URL =
    "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";

  static async analyzeUrl(
    url: string,
    strategy: "mobile" | "desktop" = "mobile"
  ): Promise<LighthouseMetrics> {
    if (!this.API_KEY) {
      console.error(
        "PageSpeed Insights API key is required. Please add VITE_PAGESPEED_API_KEY to your environment variables."
      );
      throw new Error(
        "PageSpeed Insights API key is required. Please add VITE_PAGESPEED_API_KEY to your environment variables."
      );
    }

    const params = new URLSearchParams({
      url: url,
      key: this.API_KEY,
      strategy: strategy,
    });

    // Add each category as a separate parameter
    params.append("category", "performance");
    params.append("category", "accessibility");
    params.append("category", "best-practices");
    params.append("category", "seo");

    try {
      console.log(`Fetching PageSpeed data for: ${url}`);
      console.log(`API Key present: ${!!this.API_KEY}`);
      console.log(`API Key length: ${this.API_KEY?.length || 0}`);

      const fullUrl = `${this.BASE_URL}?${params}`;
      console.log(
        `Full API URL: ${fullUrl.replace(this.API_KEY || "", "API_KEY_HIDDEN")}`
      );

      const response = await fetch(fullUrl);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`PageSpeed API error response:`, errorText);
        throw new Error(
          `PageSpeed API error: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      const data: PageSpeedResponse = await response.json();

      return this.parsePageSpeedResults(data);
    } catch (error) {
      console.error("Error fetching PageSpeed data:", error);
      throw new Error(
        "Failed to analyze page performance. Please check the URL and try again."
      );
    }
  }

  private static parsePageSpeedResults(
    data: PageSpeedResponse
  ): LighthouseMetrics {
    // Add debugging to see what we're getting
    console.log("PageSpeed API full response:", data);
    console.log("Lighthouse result:", data.lighthouseResult);
    console.log("Categories:", data.lighthouseResult?.categories);
    console.log("Audits:", data.lighthouseResult?.audits);

    const { categories, audits } = data.lighthouseResult || {};

    if (!categories || !audits) {
      console.error("Missing categories or audits in PageSpeed response");
      return {
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
      };
    }

    // Convert scores from 0-1 to 0-100
    const performance = Math.round((categories.performance?.score || 0) * 100);
    const accessibility = Math.round(
      (categories.accessibility?.score || 0) * 100
    );
    const bestPractices = Math.round(
      (categories["best-practices"]?.score || 0) * 100
    );
    const seo = Math.round((categories.seo?.score || 0) * 100);

    console.log("Parsed category scores:", {
      performance,
      accessibility,
      bestPractices,
      seo,
    });

    // Parse Core Web Vitals with better debugging
    const fcpAudit = audits["first-contentful-paint"];
    const lcpAudit = audits["largest-contentful-paint"];
    const clsAudit = audits["cumulative-layout-shift"];
    const fidAudit = audits["first-input-delay"] || audits["max-potential-fid"];
    const tbtAudit = audits["total-blocking-time"];
    const siAudit = audits["speed-index"];

    console.log("Core Web Vitals audits:", {
      fcp: fcpAudit,
      lcp: lcpAudit,
      cls: clsAudit,
      fid: fidAudit,
      tbt: tbtAudit,
      si: siAudit,
    });

    const fcp =
      fcpAudit?.numericValue || this.parseTimeValue(fcpAudit?.displayValue);
    const lcp =
      lcpAudit?.numericValue || this.parseTimeValue(lcpAudit?.displayValue);
    const cls =
      clsAudit?.numericValue || this.parseNumericValue(clsAudit?.displayValue);
    const fid =
      fidAudit?.numericValue ||
      this.parseTimeValue(fidAudit?.displayValue, true);
    const tbt =
      tbtAudit?.numericValue ||
      this.parseTimeValue(tbtAudit?.displayValue, true);
    const si =
      siAudit?.numericValue || this.parseTimeValue(siAudit?.displayValue);

    console.log("Parsed Core Web Vitals:", { fcp, lcp, cls, fid, tbt, si });

    return {
      performance,
      accessibility,
      bestPractices,
      seo,
      fcp,
      lcp,
      cls,
      fid,
      tbt,
      si,
    };
  }

  private static parseTimeValue(
    value: string | undefined,
    isMilliseconds = false
  ): number {
    if (!value) return 0;

    // Extract numeric value from strings like "1.2 s" or "150 ms"
    const match = value.match(/[\d.]+/);
    if (!match) return 0;

    const numValue = parseFloat(match[0]);

    // Convert milliseconds to seconds if needed
    if (isMilliseconds && value.includes("ms")) {
      return numValue;
    } else if (!isMilliseconds && value.includes("s")) {
      return numValue;
    }

    return numValue;
  }

  private static parseNumericValue(value: string | undefined): number {
    if (!value) return 0;
    const match = value.match(/[\d.]+/);
    return match ? parseFloat(match[0]) : 0;
  }

  static async analyzeMultipleUrls(
    baseUrl: string,
    routes: string[]
  ): Promise<Record<string, LighthouseMetrics>> {
    const results: Record<string, LighthouseMetrics> = {};

    // Analyze each route sequentially to avoid rate limiting
    for (const route of routes) {
      const fullUrl = this.buildFullUrl(baseUrl, route);

      try {
        console.log(`Analyzing: ${fullUrl}`);
        results[route] = await this.analyzeUrl(fullUrl);

        // Add delay between requests to respect rate limits
        await this.delay(1000);
      } catch (error) {
        console.error(`Failed to analyze ${fullUrl}:`, error);
        // Continue with other routes even if one fails
        results[route] = this.getErrorMetrics();
      }
    }

    return results;
  }

  private static buildFullUrl(baseUrl: string, route: string): string {
    // Remove trailing slash from baseUrl and leading slash from route
    const cleanBaseUrl = baseUrl.replace(/\/$/, "");
    const cleanRoute = route.startsWith("/") ? route : `/${route}`;

    return `${cleanBaseUrl}${cleanRoute}`;
  }

  private static getErrorMetrics(): LighthouseMetrics {
    return {
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
    };
  }

  private static delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  static async analyzeUrlWithFullData(
    url: string,
    strategy: "mobile" | "desktop" = "mobile"
  ): Promise<{
    metrics: LighthouseMetrics;
    fullData: PageSpeedResponse;
    pageSpeedInsightsUrl: string;
  }> {
    if (!this.API_KEY) {
      console.error(
        "PageSpeed Insights API key is required. Please add VITE_PAGESPEED_API_KEY to your environment variables."
      );
      throw new Error(
        "PageSpeed Insights API key is required. Please add VITE_PAGESPEED_API_KEY to your environment variables."
      );
    }

    const params = new URLSearchParams({
      url: url,
      key: this.API_KEY,
      strategy: strategy,
    });

    // Add each category as a separate parameter
    params.append("category", "performance");
    params.append("category", "accessibility");
    params.append("category", "best-practices");
    params.append("category", "seo");

    try {
      console.log(`Fetching PageSpeed data for: ${url}`);
      console.log(`API Key present: ${!!this.API_KEY}`);

      const fullUrl = `${this.BASE_URL}?${params}`;
      console.log(
        `Full API URL: ${fullUrl.replace(this.API_KEY || "", "API_KEY_HIDDEN")}`
      );

      const response = await fetch(fullUrl);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`PageSpeed API error response:`, errorText);
        throw new Error(
          `PageSpeed API error: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      const data: PageSpeedResponse = await response.json();

      // Generate PageSpeed Insights URL
      // Since the API doesn't provide the exact analysis ID used by pagespeed.web.dev,
      // we'll create a URL that will run a new analysis on PageSpeed Insights
      const pageSpeedInsightsUrl = `https://pagespeed.web.dev/analysis?url=${encodeURIComponent(
        url
      )}&form_factor=${strategy}&category=performance&category=accessibility&category=best-practices&category=seo`;

      return {
        metrics: this.parsePageSpeedResults(data),
        fullData: data,
        pageSpeedInsightsUrl,
      };
    } catch (error) {
      console.error("Error fetching PageSpeed data:", error);
      throw new Error(
        "Failed to analyze page performance. Please check the URL and try again."
      );
    }
  }

  static async getDetailedAnalysis(
    url: string,
    strategy: "mobile" | "desktop" = "mobile"
  ): Promise<DetailedAnalysisResult> {
    if (!this.API_KEY) {
      throw new Error(
        "PageSpeed Insights API key is required. Please add VITE_PAGESPEED_API_KEY to your environment variables."
      );
    }

    const params = new URLSearchParams({
      url: url,
      key: this.API_KEY,
      strategy: strategy,
    });

    // Add each category as a separate parameter
    params.append("category", "performance");
    params.append("category", "accessibility");
    params.append("category", "best-practices");
    params.append("category", "seo");

    try {
      console.log(`Fetching detailed PageSpeed data for: ${url}`);
      const response = await fetch(`${this.BASE_URL}?${params}`);

      if (!response.ok) {
        throw new Error(
          `PageSpeed API error: ${response.status} ${response.statusText}`
        );
      }

      const data: PageSpeedResponse = await response.json();
      const metrics = this.parsePageSpeedResults(data);

      // Generate PageSpeed Insights URL
      // Since the API doesn't provide the exact analysis ID used by pagespeed.web.dev,
      // we'll create a URL that will run a new analysis on PageSpeed Insights
      const pageSpeedInsightsUrl = `https://pagespeed.web.dev/analysis?url=${encodeURIComponent(
        url
      )}&form_factor=${strategy}&category=performance&category=accessibility&category=best-practices&category=seo`;

      // Extract Core Web Vitals with detailed information
      const { audits } = data.lighthouseResult;
      const coreWebVitals = {
        fcp: {
          value: audits["first-contentful-paint"]?.numericValue || 0,
          score: Math.round(
            (audits["first-contentful-paint"]?.score || 0) * 100
          ),
          displayValue: audits["first-contentful-paint"]?.displayValue || "0 s",
        },
        lcp: {
          value: audits["largest-contentful-paint"]?.numericValue || 0,
          score: Math.round(
            (audits["largest-contentful-paint"]?.score || 0) * 100
          ),
          displayValue:
            audits["largest-contentful-paint"]?.displayValue || "0 s",
        },
        cls: {
          value: audits["cumulative-layout-shift"]?.numericValue || 0,
          score: Math.round(
            (audits["cumulative-layout-shift"]?.score || 0) * 100
          ),
          displayValue: audits["cumulative-layout-shift"]?.displayValue || "0",
        },
        tbt: {
          value: audits["total-blocking-time"]?.numericValue || 0,
          score: Math.round((audits["total-blocking-time"]?.score || 0) * 100),
          displayValue: audits["total-blocking-time"]?.displayValue || "0 ms",
        },
        si: {
          value: audits["speed-index"]?.numericValue || 0,
          score: Math.round((audits["speed-index"]?.score || 0) * 100),
          displayValue: audits["speed-index"]?.displayValue || "0 s",
        },
      };

      return {
        metrics,
        coreWebVitals,
        pageSpeedInsightsUrl,
        fullData: data,
      };
    } catch (error) {
      console.error("Error fetching detailed PageSpeed data:", error);
      throw new Error(
        "Failed to analyze page performance. Please check the URL and try again."
      );
    }
  }
}
