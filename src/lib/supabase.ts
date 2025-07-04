import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase credentials not found. Using local storage fallback.");
}

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export interface LighthouseResult {
  id: string;
  domain: string;
  url: string;
  timestamp: number | string;
  routes: RouteConfig[];
  results: {
    [route: string]: {
      performance: number;
      accessibility: number;
      bestPractices: number;
      seo: number;
      fcp: number;
      lcp: number;
      cls: number;
      fid: number;
    };
  };
  avg_scores: {
    performance: number;
    accessibility: number;
    bestPractices: number;
    seo: number;
  };
  created_at?: string;
}

export interface RouteConfig {
  id: string;
  path: string;
  name: string;
}

export class LighthouseStorage {
  static extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return url;
    }
  }

  static normalizeTimestamp(timestamp: number | string): string {
    if (typeof timestamp === "number") {
      return new Date(timestamp).toISOString();
    }
    return timestamp;
  }

  static calculateAverageScores(
    results: LighthouseResult["results"]
  ): LighthouseResult["avg_scores"] {
    const routeCount = Object.keys(results).length;
    if (routeCount === 0) {
      return { performance: 0, accessibility: 0, bestPractices: 0, seo: 0 };
    }

    const totals = Object.values(results).reduce(
      (acc, result) => ({
        performance: acc.performance + result.performance,
        accessibility: acc.accessibility + result.accessibility,
        bestPractices: acc.bestPractices + result.bestPractices,
        seo: acc.seo + result.seo,
      }),
      { performance: 0, accessibility: 0, bestPractices: 0, seo: 0 }
    );

    return {
      performance: Math.round(totals.performance / routeCount),
      accessibility: Math.round(totals.accessibility / routeCount),
      bestPractices: Math.round(totals.bestPractices / routeCount),
      seo: Math.round(totals.seo / routeCount),
    };
  }

  static async saveResult(
    result: Omit<LighthouseResult, "id" | "domain" | "avg_scores">
  ): Promise<LighthouseResult | null> {
    const domain = this.extractDomain(result.url);
    const avg_scores = this.calculateAverageScores(result.results);

    // Convert timestamp to proper ISO string if it's a number
    const timestamp = this.normalizeTimestamp(result.timestamp);

    const resultToSave = {
      ...result,
      timestamp,
      domain,
      avg_scores,
    };

    if (supabase) {
      try {
        console.log("Attempting to save to Supabase:", resultToSave);

        const { data, error } = await supabase
          .from("lighthouse_results")
          .insert([resultToSave])
          .select()
          .single();

        if (error) {
          console.error("Error saving to Supabase:", error);
          throw new Error(`Database error: ${error.message}`);
        }

        console.log("Successfully saved to Supabase:", data);

        // Also save to local storage as backup
        this.saveToLocalStorage({ ...resultToSave, id: data.id });

        return data;
      } catch (error) {
        console.error("Supabase save failed:", error);
        // Fallback to localStorage
        return this.saveToLocalStorage(resultToSave);
      }
    } else {
      console.log("Supabase not configured, saving to localStorage only");
      return this.saveToLocalStorage(resultToSave);
    }
  }

  private static saveToLocalStorage(
    result: Omit<LighthouseResult, "id"> & { id?: string }
  ): LighthouseResult {
    const resultWithId = {
      ...result,
      id: result.id || Date.now().toString(),
    };

    const savedHistory = localStorage.getItem("lighthouse-history");
    const history: LighthouseResult[] = savedHistory
      ? JSON.parse(savedHistory)
      : [];
    const updatedHistory = [resultWithId, ...history.slice(0, 9)];
    localStorage.setItem("lighthouse-history", JSON.stringify(updatedHistory));

    return resultWithId;
  }

  static async getResultsByDomain(
    domain?: string
  ): Promise<LighthouseResult[]> {
    if (supabase) {
      try {
        let query = supabase
          .from("lighthouse_results")
          .select("*")
          .order("timestamp", { ascending: false });

        if (domain) {
          query = query.eq("domain", domain);
        }

        const { data, error } = await query.limit(50);

        if (error) {
          console.error("Error fetching from Supabase:", error);
          return this.getFromLocalStorage();
        }

        console.log(
          "Successfully loaded data from database:",
          data?.length || 0,
          "results"
        );
        return data || [];
      } catch (error) {
        console.error("Supabase fetch failed:", error);
        return this.getFromLocalStorage();
      }
    } else {
      console.log("Supabase not configured, loading from localStorage");
      return this.getFromLocalStorage();
    }
  }

  static async getResults(): Promise<LighthouseResult[]> {
    return this.getResultsByDomain();
  }

  static async testConnection(): Promise<{ success: boolean; error?: string }> {
    if (!supabase) {
      console.log("Supabase not configured");
      return { success: false, error: "Supabase not configured" };
    }

    try {
      // First check if we can connect at all
      const { error } = await supabase
        .from("lighthouse_results")
        .select("id")
        .limit(1);

      if (error) {
        console.error("Supabase connection error:", error);

        // Check if it's a table not found error
        if (
          error.message.includes('relation "lighthouse_results" does not exist')
        ) {
          return {
            success: false,
            error:
              "Table not found. Please run the migration in Supabase dashboard.",
          };
        }

        return { success: false, error: error.message };
      }

      console.log("Supabase connection successful");
      return { success: true };
    } catch (error) {
      console.error("Failed to connect to Supabase:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown connection error",
      };
    }
  }

  static async getAllDomains(): Promise<string[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("lighthouse_results")
          .select("domain")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching domains from Supabase:", error);
          return this.getDomainsFromLocalStorage();
        }

        const uniqueDomains = [
          ...new Set(data?.map((item) => item.domain) || []),
        ];
        return uniqueDomains;
      } catch (error) {
        console.error("Supabase domains fetch failed:", error);
        return this.getDomainsFromLocalStorage();
      }
    } else {
      return this.getDomainsFromLocalStorage();
    }
  }

  private static getFromLocalStorage(): LighthouseResult[] {
    const savedHistory = localStorage.getItem("lighthouse-history");
    return savedHistory ? JSON.parse(savedHistory) : [];
  }

  private static getDomainsFromLocalStorage(): string[] {
    const history = this.getFromLocalStorage();
    const domains = history.map((result) => this.extractDomain(result.url));
    return [...new Set(domains)];
  }

  static async getResultById(id: string): Promise<LighthouseResult | null> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("lighthouse_results")
          .select("*")
          .eq("id", id)
          .single();

        if (error) {
          console.error("Error fetching result by ID from Supabase:", error);
          return this.getResultByIdFromLocalStorage(id);
        }

        return data;
      } catch (error) {
        console.error("Supabase fetch by ID failed:", error);
        return this.getResultByIdFromLocalStorage(id);
      }
    } else {
      return this.getResultByIdFromLocalStorage(id);
    }
  }

  private static getResultByIdFromLocalStorage(
    id: string
  ): LighthouseResult | null {
    const history = this.getFromLocalStorage();
    return history.find((result) => result.id === id) || null;
  }
}
