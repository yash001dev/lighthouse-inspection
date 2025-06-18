import React from 'react';
import { ExternalLink, Globe } from 'lucide-react';

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

interface PerformanceResult {
  id: string;
  url: string;
  timestamp: number | string;
  routes: { id: string; path: string; name: string; }[];
  results: { [route: string]: LighthouseMetrics };
  strategy?: 'mobile' | 'desktop';
  pageSpeedInsightsUrls?: Record<string, string>;
}

interface PageSpeedResultsProps {
  result: PerformanceResult;
  onClose: () => void;
}

export const PageSpeedResults: React.FC<PageSpeedResultsProps> = ({ result, onClose }) => {
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'bg-green-100';
    if (score >= 50) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const formatTimestamp = (timestamp: number | string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Globe className="h-6 w-6 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Google PageSpeed Insights Results</h2>
            <p className="text-gray-600">Analyzed on {formatTimestamp(result.timestamp)}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
        >
          ← Back to Analysis
        </button>
      </div>

      {/* Analysis Details */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <Globe className="h-5 w-5 text-blue-600" />
          <span className="font-medium text-blue-900">Base URL:</span>
          <span className="text-blue-700">{result.url}</span>
        </div>
        <div className="mt-2 flex items-center space-x-4">
          <span className="text-sm text-blue-700">
            Strategy: <span className="font-medium capitalize">{result.strategy || 'mobile'}</span>
          </span>
          <span className="text-sm text-blue-700">
            Routes Analyzed: <span className="font-medium">{result.routes.length}</span>
          </span>
        </div>
      </div>

      {/* Results for each route */}
      <div className="space-y-6">
        {result.routes.map((route) => {
          const metrics = result.results[route.path];
          if (!metrics) return null;

          return (
            <div key={route.id} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{route.name}</h3>
                {result.pageSpeedInsightsUrls?.[route.path] && (
                  <a
                    href={result.pageSpeedInsightsUrls[route.path]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
                  >
                    <span>View in PageSpeed Insights</span>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
              
              {/* Core Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className={`p-4 rounded-lg ${getScoreBgColor(metrics.performance)}`}>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getScoreColor(metrics.performance)}`}>
                      {metrics.performance}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Performance</div>
                  </div>
                </div>
                <div className={`p-4 rounded-lg ${getScoreBgColor(metrics.accessibility)}`}>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getScoreColor(metrics.accessibility)}`}>
                      {metrics.accessibility}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Accessibility</div>
                  </div>
                </div>
                <div className={`p-4 rounded-lg ${getScoreBgColor(metrics.bestPractices)}`}>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getScoreColor(metrics.bestPractices)}`}>
                      {metrics.bestPractices}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Best Practices</div>
                  </div>
                </div>
                <div className={`p-4 rounded-lg ${getScoreBgColor(metrics.seo)}`}>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getScoreColor(metrics.seo)}`}>
                      {metrics.seo}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">SEO</div>
                  </div>
                </div>
              </div>

              {/* Core Web Vitals */}
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Core Web Vitals</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">FCP:</span>
                    <span className="ml-2 font-medium">{(metrics.fcp / 1000).toFixed(2)}s</span>
                  </div>
                  <div>
                    <span className="text-gray-600">LCP:</span>
                    <span className="ml-2 font-medium">{(metrics.lcp / 1000).toFixed(2)}s</span>
                  </div>
                  <div>
                    <span className="text-gray-600">CLS:</span>
                    <span className="ml-2 font-medium">{metrics.cls.toFixed(3)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">FID:</span>
                    <span className="ml-2 font-medium">{metrics.fid}ms</span>
                  </div>
                  <div>
                    <span className="text-gray-600">TBT:</span>
                    <span className="ml-2 font-medium">{metrics.tbt}ms</span>
                  </div>
                  <div>
                    <span className="text-gray-600">SI:</span>
                    <span className="ml-2 font-medium">{(metrics.si / 1000).toFixed(2)}s</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Note about PageSpeed Insights */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> These results are powered by Google PageSpeed Insights API. 
          Click "View in PageSpeed Insights" links above to see detailed recommendations and 
          additional insights directly from Google's tool.
        </p>
      </div>
    </div>
  );
};
