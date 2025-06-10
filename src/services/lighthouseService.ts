interface LighthouseMetrics {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
  fcp: number;
  lcp: number;
  cls: number;
  fid: number;
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
      "first-contentful-paint": { displayValue: string };
      "largest-contentful-paint": { displayValue: string };
      "cumulative-layout-shift": { displayValue: string };
      "first-input-delay": { displayValue: string };
    };
  };
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
    params.append('category', 'performance');
    params.append('category', 'accessibility');
    params.append('category', 'best-practices');
    params.append('category', 'seo');

    try {
      console.log(`Fetching PageSpeed data for: ${url}?${params}`);
      const response = await fetch(`${this.BASE_URL}?${params}`);

      if (!response.ok) {
        throw new Error(
          `PageSpeed API error: ${response.status} ${response.statusText}`
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
    const { categories, audits } = data.lighthouseResult;

    // Convert scores from 0-1 to 0-100
    const performance = Math.round((categories.performance?.score || 0) * 100);
    const accessibility = Math.round(
      (categories.accessibility?.score || 0) * 100
    );
    const bestPractices = Math.round(
      (categories["best-practices"]?.score || 0) * 100
    );
    const seo = Math.round((categories.seo?.score || 0) * 100);

    // Parse Core Web Vitals
    const fcp = this.parseTimeValue(
      audits["first-contentful-paint"]?.displayValue
    );
    const lcp = this.parseTimeValue(
      audits["largest-contentful-paint"]?.displayValue
    );
    const cls = this.parseNumericValue(
      audits["cumulative-layout-shift"]?.displayValue
    );
    const fid = this.parseTimeValue(
      audits["first-input-delay"]?.displayValue,
      true
    );

    return {
      performance,
      accessibility,
      bestPractices,
      seo,
      fcp,
      lcp,
      cls,
      fid,
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
    };
  }

  private static delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
