import { useState, useEffect } from 'react';
import { DirectLighthouseService, DetailedLighthouseResult } from '../services/directLighthouseService';
import { 
  BarChart3, 
  Download, 
  Zap, 
  Eye, 
  Smartphone, 
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp
} from 'lucide-react';

interface CoreWebVitalsAnalysisProps {
  onBack: () => void;
}

interface AnalysisResult {
  url: string;
  data: DetailedLighthouseResult;
  timestamp: Date;
}

export function CoreWebVitalsAnalysis({ onBack }: CoreWebVitalsAnalysisProps) {
  const [url1, setUrl1] = useState('');
  const [url2, setUrl2] = useState('');
  const [strategy, setStrategy] = useState<'mobile' | 'desktop'>('mobile');
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverHealthy, setServerHealthy] = useState<boolean | null>(null);

  // Check server health on component mount
  useEffect(() => {
    DirectLighthouseService.checkServerHealth().then(setServerHealthy);
  }, []);

  const handleAnalysis = async () => {
    if (!url1.trim()) {
      setError('Please enter at least one URL to analyze');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults([]);

    try {
      const urls = [url1.trim(), url2.trim()].filter(Boolean);
      const analysisResults: AnalysisResult[] = [];

      for (const url of urls) {
        console.log(`Analyzing ${url}...`);
        const data = await DirectLighthouseService.runLighthouseAnalysis(url, strategy);
        
        // Log the result data for debugging
        console.log(`Analysis complete for ${url}:`, data);
        console.log('Metrics:', data.metrics);
        console.log('Core Web Vitals:', data.coreWebVitals);
        
        analysisResults.push({
          url,
          data,
          timestamp: new Date()
        });
        
        // Add delay between requests
        if (urls.length > 1 && url !== urls[urls.length - 1]) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      console.log('All analysis results:', analysisResults);
      setResults(analysisResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during analysis');
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 90) return 'bg-green-100';
    if (score >= 50) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 90) return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (score >= 50) return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    return <AlertTriangle className="h-5 w-5 text-red-600" />;
  };

  const formatValue = (value: number, unit: string) => {
    if (unit === 'ms') {
      return value >= 1000 ? `${(value / 1000).toFixed(1)} s` : `${Math.round(value)} ms`;
    }
    if (unit === 's') {
      return `${(value / 1000).toFixed(1)} s`;
    }
    return value.toFixed(3);
  };

  const coreWebVitalsConfig = [
    {
      key: 'fcp',
      name: 'First Contentful Paint',
      description: 'Time until the first text or image is painted',
      icon: <Eye className="h-5 w-5" />,
      unit: 's',
      thresholds: { good: 1800, poor: 3000 }
    },
    {
      key: 'lcp',
      name: 'Largest Contentful Paint',
      description: 'Time until the largest text or image is painted',
      icon: <Zap className="h-5 w-5" />,
      unit: 's',
      thresholds: { good: 2500, poor: 4000 }
    },
    {
      key: 'cls',
      name: 'Cumulative Layout Shift',
      description: 'Amount of unexpected layout shift during page load',
      icon: <TrendingUp className="h-5 w-5" />,
      unit: '',
      thresholds: { good: 0.1, poor: 0.25 }
    },
    {
      key: 'tbt',
      name: 'Total Blocking Time',
      description: 'Total time between FCP and TTI where tasks blocked the main thread',
      icon: <Clock className="h-5 w-5" />,
      unit: 'ms',
      thresholds: { good: 200, poor: 600 }
    },
    {
      key: 'si',
      name: 'Speed Index',
      description: 'How quickly the contents of a page are visibly populated',
      icon: <BarChart3 className="h-5 w-5" />,
      unit: 's',
      thresholds: { good: 3400, poor: 5800 }
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <button
                onClick={onBack}
                className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all"
              >
                ←
              </button>
              <div className="p-3 bg-indigo-100 rounded-xl">
                <BarChart3 className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Core Web Vitals Analysis</h1>
                <p className="text-gray-600">Compare performance metrics between URLs</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Smartphone className="h-4 w-4 text-gray-500" />
              <select
                value={strategy}
                onChange={(e) => setStrategy(e.target.value as 'mobile' | 'desktop')}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
              >
                <option value="mobile">Mobile</option>
                <option value="desktop">Desktop</option>
              </select>
            </div>
          </div>

          {/* Analysis Form */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            {/* Server Health Status */}
            {serverHealthy !== null && (
              <div className={`p-3 rounded-lg mb-4 ${
                serverHealthy 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center space-x-2">
                  {serverHealthy ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  )}
                  <span className={`text-sm font-medium ${
                    serverHealthy ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {serverHealthy 
                      ? 'Lighthouse server is running' 
                      : 'Lighthouse server is not available. Please start the server on port 3001.'
                    }
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary URL to analyze
                </label>
                <input
                  type="url"
                  value={url1}
                  onChange={(e) => setUrl1(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Compare with URL (optional)
                </label>
                <input
                  type="url"
                  value={url2}
                  onChange={(e) => setUrl2(e.target.value)}
                  placeholder="https://example.com/compare"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <button
                onClick={handleAnalysis}
                disabled={isLoading || !url1.trim() || serverHealthy === false}
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Analyzing Performance...</span>
                  </div>
                ) : (
                  'Analyze Core Web Vitals'
                )}
              </button>
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600">{error}</p>
              </div>
            )}
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div className="space-y-8">
              {/* Performance Overview */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Performance Overview</h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {results.map((result, index) => (
                    <div key={index} className={`p-6 rounded-xl border-2 ${
                      index === 0 ? 'border-blue-200 bg-blue-50' : 'border-purple-200 bg-purple-50'
                    }`}>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-gray-900 truncate">{result.url}</h3>
                          <p className="text-sm text-gray-600">
                            {result.timestamp.toLocaleString()}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            const blob = new Blob([result.data.downloadableJson], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `lighthouse-${new URL(result.url).hostname}-${result.timestamp.getTime()}.json`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                          }}
                          className="flex items-center space-x-1 text-indigo-600 hover:text-indigo-700 text-sm"
                        >
                          <span>Download JSON</span>
                          <Download className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className={`p-3 rounded-lg ${getScoreBg(result.data.metrics.performance)}`}>
                          <div className="text-center">
                            <div className={`text-2xl font-bold ${getScoreColor(result.data.metrics.performance)}`}>
                              {result.data.metrics.performance}
                            </div>
                            <div className="text-xs text-gray-600">Performance</div>
                          </div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-center">
                            <div className="text-lg font-semibold text-gray-700">
                              {strategy === 'mobile' ? '📱' : '💻'}
                            </div>
                            <div className="text-xs text-gray-600">
                              {strategy.charAt(0).toUpperCase() + strategy.slice(1)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Debug info */}
                      <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                        <div className="text-xs text-gray-600">
                          <div>Performance: {result.data.metrics.performance}</div>
                          <div>Accessibility: {result.data.metrics.accessibility}</div>
                          <div>Best Practices: {result.data.metrics.bestPractices}</div>
                          <div>SEO: {result.data.metrics.seo}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Core Web Vitals Detailed Comparison */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Core Web Vitals Comparison</h2>
                
                <div className="space-y-8">
                  {coreWebVitalsConfig.map((metric) => (
                    <div key={metric.key} className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                          {metric.icon}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{metric.name}</h3>
                          <p className="text-sm text-gray-600">{metric.description}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {results.map((result, index) => {
                          const cwv = result.data.coreWebVitals[metric.key];
                          return (
                            <div key={index} className={`p-4 rounded-xl border-2 ${
                              index === 0 ? 'border-blue-200 bg-blue-50' : 'border-purple-200 bg-purple-50'
                            }`}>
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-sm font-medium text-gray-700">
                                  URL {index + 1}
                                </span>
                                <div className="flex items-center space-x-2">
                                  {getScoreIcon(cwv.score)}
                                  <span className={`text-lg font-bold ${getScoreColor(cwv.score)}`}>
                                    {cwv.score}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="text-center mb-3">
                                <div className="text-2xl font-bold text-gray-900">
                                  {cwv.displayValue}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {formatValue(cwv.value, metric.unit)}
                                </div>
                              </div>

                              <div className="bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${
                                    cwv.score >= 90 ? 'bg-green-500' : 
                                    cwv.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${cwv.score}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {results.length > 1 && (
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <div className="text-center">
                            <div className="text-sm text-gray-600 mb-1">Difference</div>
                            <div className={`text-lg font-semibold ${
                              results[1].data.coreWebVitals[metric.key].score > results[0].data.coreWebVitals[metric.key].score 
                                ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {results[1].data.coreWebVitals[metric.key].score > results[0].data.coreWebVitals[metric.key].score ? '+' : ''}
                              {results[1].data.coreWebVitals[metric.key].score - results[0].data.coreWebVitals[metric.key].score} points
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Raw JSON Data */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Raw JSON Response</h2>
                
                <div className="space-y-4">
                  {results.map((result, index) => (
                    <div key={index}>
                      <h3 className="font-medium text-gray-900 mb-2">
                        URL {index + 1}: {result.url}
                      </h3>
                      <div className="bg-gray-50 p-4 rounded-lg overflow-auto">
                        <pre className="text-xs text-gray-700">
                          {result.data.downloadableJson}
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
