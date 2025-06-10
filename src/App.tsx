import React, { useState, useEffect } from 'react';
import { Globe, Clock, Zap, Eye, Database, ChevronRight, BarChart3, History, Plus, X, CheckCircle2, AlertCircle, Play, Wifi, WifiOff } from 'lucide-react';
import { LighthouseService } from './services/lighthouseService';
import { LighthouseStorage, LighthouseResult } from './lib/supabase';
import { HistoryView } from './components/HistoryView';
import { ComparisonView } from './components/ComparisonView';

interface RouteConfig {
  id: string;
  path: string;
  name: string;
}

interface PerformanceResult {
  id: string;
  url: string;
  timestamp: number;
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
}

function App() {
  const [step, setStep] = useState(1);
  const [baseUrl, setBaseUrl] = useState('');
  const [routeType, setRouteType] = useState<'all' | 'custom'>('all');
  const [customRoutes, setCustomRoutes] = useState<RouteConfig[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState({ current: 0, total: 0, currentUrl: '' });
  const [currentResult, setCurrentResult] = useState<PerformanceResult | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonResults, setComparisonResults] = useState<LighthouseResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [hasSupabase, setHasSupabase] = useState(false);

  useEffect(() => {
    // Check if API key is configured
    setHasApiKey(!!import.meta.env.VITE_PAGESPEED_API_KEY);
    
    // Check if Supabase is configured
    setHasSupabase(!!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY));
  }, []);

  const addCustomRoute = () => {
    const newRoute: RouteConfig = {
      id: Date.now().toString(),
      path: '',
      name: `Route ${customRoutes.length + 1}`,
    };
    setCustomRoutes([...customRoutes, newRoute]);
  };

  const updateCustomRoute = (id: string, field: 'path' | 'name', value: string) => {
    setCustomRoutes(customRoutes.map(route => 
      route.id === id ? { ...route, [field]: value } : route
    ));
  };

  const removeCustomRoute = (id: string) => {
    setCustomRoutes(customRoutes.filter(route => route.id !== id));
  };

  const runPerformanceTest = async () => {
    console.log('Running performance test with base URL:', baseUrl);
    setIsLoading(true);
    setError(null);
    
    try {
      const routes = routeType === 'all' 
        ? [{ id: '1', path: '/', name: 'Home Page' }]
        : customRoutes.filter(route => route.path.trim());
      console.log('Running performance test for routes:', routes);
      setLoadingProgress({ current: 0, total: routes.length, currentUrl: '' });

      const results: PerformanceResult['results'] = {};
      
      if (hasApiKey) {
        // Use real PageSpeed Insights API
        const routePaths = routes.map(route => route.path);
        const apiResults = await LighthouseService.analyzeMultipleUrls(baseUrl, routePaths);
        
        // Map API results to our format
        routes.forEach((route, index) => {
          setLoadingProgress({ 
            current: index + 1, 
            total: routes.length, 
            currentUrl: `${baseUrl}${route.path}` 
          });
          
          results[route.path] = apiResults[route.path] || {
            performance: 0,
            accessibility: 0,
            bestPractices: 0,
            seo: 0,
            fcp: 0,
            lcp: 0,
            cls: 0,
            fid: 0,
          };
        });
      } else {
        // Fallback to mock data with realistic delay
        for (let i = 0; i < routes.length; i++) {
          const route = routes[i];
          setLoadingProgress({ 
            current: i + 1, 
            total: routes.length, 
            currentUrl: `${baseUrl}${route.path}` 
          });
          
          // Simulate API call delay
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          results[route.path] = {
            performance: Math.floor(Math.random() * 30) + 70,
            accessibility: Math.floor(Math.random() * 20) + 80,
            bestPractices: Math.floor(Math.random() * 25) + 75,
            seo: Math.floor(Math.random() * 20) + 80,
            fcp: Math.random() * 1.5 + 1.2,
            lcp: Math.random() * 2 + 2.5,
            cls: Math.random() * 0.1,
            fid: Math.random() * 50 + 50,
          };
        }
      }

      const newResult: PerformanceResult = {
        id: Date.now().toString(),
        url: baseUrl,
        timestamp: Date.now(),
        routes,
        results,
      };

      // Save to cloud storage
      try {
        await LighthouseStorage.saveResult({
          url: newResult.url,
          timestamp: newResult.timestamp,
          routes: newResult.routes,
          results: newResult.results,
        });
      } catch (saveError) {
        console.error('Failed to save result to cloud storage:', saveError);
        // Continue with local storage fallback
      }
      
      setCurrentResult(newResult);
      setStep(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
      setLoadingProgress({ current: 0, total: 0, currentUrl: '' });
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

  const resetTool = () => {
    setStep(1);
    setBaseUrl('');
    setRouteType('all');
    setCustomRoutes([]);
    setCurrentResult(null);
    setIsLoading(false);
    setError(null);
    setShowHistory(false);
    setShowComparison(false);
    setComparisonResults([]);
  };

  const loadHistoryResult = (result: LighthouseResult) => {
    // Convert LighthouseResult to PerformanceResult format
    const performanceResult: PerformanceResult = {
      id: result.id,
      url: result.url,
      timestamp: result.timestamp,
      routes: result.routes,
      results: result.results,
    };
    
    setCurrentResult(performanceResult);
    setShowHistory(false);
    setStep(4);
  };

  const handleCompareResults = (results: LighthouseResult[]) => {
    setComparisonResults(results);
    setShowHistory(false);
    setShowComparison(true);
  };

  // Show comparison view
  if (showComparison) {
    return (
      <ComparisonView
        results={comparisonResults}
        onBack={() => {
          setShowComparison(false);
          setShowHistory(true);
        }}
      />
    );
  }

  // Show history view
  if (showHistory) {
    return (
      <HistoryView
        onBack={() => setShowHistory(false)}
        onLoadResult={loadHistoryResult}
        onCompareResults={handleCompareResults}
      />
    );
  }

  // API Key Setup Notice
  if (!hasApiKey && step === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
              <div className="text-center mb-6">
                <div className="p-4 bg-yellow-100 rounded-2xl w-fit mx-auto mb-4">
                  <AlertCircle className="h-8 w-8 text-yellow-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">API Configuration</h1>
                <p className="text-gray-600">Configure your APIs for the best experience.</p>
              </div>

              <div className="space-y-6">
                <div className="bg-blue-50 rounded-lg p-6">
                  <h3 className="font-semibold text-blue-900 mb-3">PageSpeed Insights API (Optional):</h3>
                  <ol className="list-decimal list-inside space-y-2 text-blue-800 text-sm">
                    <li>Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="underline">Google Cloud Console</a></li>
                    <li>Enable the PageSpeed Insights API</li>
                    <li>Create an API key and add as <code className="bg-blue-100 px-2 py-1 rounded">VITE_PAGESPEED_API_KEY</code></li>
                  </ol>
                </div>

                {!hasSupabase && (
                  <div className="bg-purple-50 rounded-lg p-6">
                    <h3 className="font-semibold text-purple-900 mb-3">Supabase Database (Recommended):</h3>
                    <p className="text-purple-800 text-sm mb-3">
                      For cloud storage and sharing test results across users.
                    </p>
                    <button
                      onClick={() => window.open('https://bolt.new/setup/supabase', '_blank')}
                      className="text-purple-700 underline text-sm hover:text-purple-800"
                    >
                      Click here to set up Supabase →
                    </button>
                  </div>
                )}

                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Current Status:</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      {hasApiKey ? <Wifi className="h-4 w-4 text-green-600" /> : <WifiOff className="h-4 w-4 text-gray-400" />}
                      <span className={hasApiKey ? 'text-green-700' : 'text-gray-600'}>
                        PageSpeed API: {hasApiKey ? 'Connected' : 'Demo mode'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {hasSupabase ? <Database className="h-4 w-4 text-green-600" /> : <Database className="h-4 w-4 text-gray-400" />}
                      <span className={hasSupabase ? 'text-green-700' : 'text-gray-600'}>
                        Cloud Storage: {hasSupabase ? 'Connected' : 'Local only'}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setHasApiKey(true)}
                  className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Continue with Current Setup
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 border-4 border-indigo-200 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {hasApiKey ? 'Running Real Lighthouse Analysis' : 'Running Performance Analysis'}
          </h2>
          <p className="text-gray-600 mb-4">
            {loadingProgress.total > 0 
              ? `Analyzing ${loadingProgress.current} of ${loadingProgress.total} routes...`
              : 'This may take a few moments...'
            }
          </p>
          {loadingProgress.currentUrl && (
            <p className="text-sm text-gray-500 mb-4">Current: {loadingProgress.currentUrl}</p>
          )}
          <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              {hasApiKey ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
              <span>{hasApiKey ? 'Real API' : 'Demo data'}</span>
            </div>
            <div className="flex items-center space-x-2">
              {hasSupabase ? <Database className="h-4 w-4" /> : <Database className="h-4 w-4 text-gray-400" />}
              <span>{hasSupabase ? 'Cloud storage' : 'Local only'}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            <div className="p-4 bg-red-100 rounded-2xl w-fit mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Analysis Failed</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={resetTool}
              className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 4 && currentResult) {
    const avgScores = Object.values(currentResult.results).reduce(
      (acc, result) => ({
        performance: acc.performance + result.performance,
        accessibility: acc.accessibility + result.accessibility,
        bestPractices: acc.bestPractices + result.bestPractices,
        seo: acc.seo + result.seo,
      }),
      { performance: 0, accessibility: 0, bestPractices: 0, seo: 0 }
    );

    const routeCount = Object.keys(currentResult.results).length;
    Object.keys(avgScores).forEach(key => {
      avgScores[key as keyof typeof avgScores] = Math.round(avgScores[key as keyof typeof avgScores] / routeCount);
    });

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-green-100 rounded-xl">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Performance Results</h1>
                  <div className="flex items-center space-x-4 text-gray-600">
                    <span>{currentResult.url}</span>
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center space-x-1">
                        {hasApiKey ? <Wifi className="h-4 w-4 text-green-600" /> : <WifiOff className="h-4 w-4 text-gray-400" />}
                        <span>{hasApiKey ? 'Real data' : 'Demo data'}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        {hasSupabase ? <Database className="h-4 w-4 text-green-600" /> : <Database className="h-4 w-4 text-gray-400" />}
                        <span>{hasSupabase ? 'Saved to cloud' : 'Local only'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={resetTool}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                New Test
              </button>
            </div>

            {/* Overall Scores */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[
                { label: 'Performance', score: avgScores.performance, icon: Zap },
                { label: 'Accessibility', score: avgScores.accessibility, icon: Eye },
                { label: 'Best Practices', score: avgScores.bestPractices, icon: CheckCircle2 },
                { label: 'SEO', score: avgScores.seo, icon: Globe },
              ].map((metric) => (
                <div key={metric.label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <metric.icon className={`h-6 w-6 ${getScoreColor(metric.score)}`} />
                    <span className={`text-2xl font-bold ${getScoreColor(metric.score)}`}>
                      {metric.score}
                    </span>
                  </div>
                  <h3 className="font-medium text-gray-900">{metric.label}</h3>
                  <div className="mt-3 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${metric.score >= 90 ? 'bg-green-500' : metric.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${metric.score}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Detailed Results by Route */}
            <div className="space-y-6">
              {Object.entries(currentResult.results).map(([route, metrics]) => (
                <div key={route} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {currentResult.routes.find(r => r.path === route)?.name || route}
                    <span className="text-sm text-gray-500 ml-2">({route})</span>
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {[
                      { label: 'Performance', score: metrics.performance },
                      { label: 'Accessibility', score: metrics.accessibility },
                      { label: 'Best Practices', score: metrics.bestPractices },
                      { label: 'SEO', score: metrics.seo },
                    ].map((metric) => (
                      <div key={metric.label} className={`p-4 rounded-lg ${getScoreBg(metric.score)}`}>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">{metric.label}</span>
                          <span className={`text-lg font-bold ${getScoreColor(metric.score)}`}>
                            {metric.score}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{metrics.fcp.toFixed(1)}s</div>
                      <div className="text-sm text-gray-600">First Contentful Paint</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{metrics.lcp.toFixed(1)}s</div>
                      <div className="text-sm text-gray-600">Largest Contentful Paint</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{metrics.cls.toFixed(3)}</div>
                      <div className="text-sm text-gray-600">Cumulative Layout Shift</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-teal-600">{metrics.fid.toFixed(0)}ms</div>
                      <div className="text-sm text-gray-600">First Input Delay</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="p-4 bg-indigo-100 rounded-2xl">
                <BarChart3 className="h-8 w-8 text-indigo-600" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900">Lighthouse Performance Tool</h1>
            </div>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Analyze your website's performance, accessibility, best practices, and SEO with comprehensive Lighthouse audits.
            </p>
            <div className="flex items-center justify-center space-x-6 mt-6">
              <button
                onClick={() => setShowHistory(true)}
                className="inline-flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                <History className="h-4 w-4" />
                <span>View Test History</span>
              </button>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-2">
                  {hasApiKey ? <Wifi className="h-4 w-4 text-green-600" /> : <WifiOff className="h-4 w-4" />}
                  <span>{hasApiKey ? 'Real API' : 'Demo Mode'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  {hasSupabase ? <Database className="h-4 w-4 text-green-600" /> : <Database className="h-4 w-4 text-gray-400" />}
                  <span>{hasSupabase ? 'Cloud Storage' : 'Local Only'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-12">
            {[1, 2, 3].map((stepNum) => (
              <React.Fragment key={stepNum}>
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${
                    step >= stepNum
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {stepNum}
                </div>
                {stepNum < 3 && (
                  <div
                    className={`w-20 h-1 mx-4 ${
                      step > stepNum ? 'bg-indigo-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            {/* Step 1: Enter Base URL */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <Globe className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Enter Your Website URL</h2>
                  <p className="text-gray-600">Start by providing the base URL of the website you want to analyze.</p>
                </div>

                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Website URL
                  </label>
                  <input
                    type="url"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  />
                  {baseUrl && !baseUrl.startsWith('http') && (
                    <div className="flex items-center space-x-2 text-yellow-600">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm">Please include http:// or https://</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setStep(2)}
                  disabled={!baseUrl || !baseUrl.startsWith('http')}
                  className="w-full flex items-center justify-center space-x-2 bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <span>Continue</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Step 2: Choose Route Type */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <Database className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Routes to Test</h2>
                  <p className="text-gray-600">Choose whether to test all routes or specific custom routes.</p>
                </div>

                <div className="space-y-4">
                  <div
                    onClick={() => setRouteType('all')}
                    className={`p-6 border-2 rounded-xl cursor-pointer transition-colors ${
                      routeType === 'all'
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-4 h-4 rounded-full border-2 ${
                          routeType === 'all'
                            ? 'border-indigo-500 bg-indigo-500'
                            : 'border-gray-300'
                        }`}
                      />
                      <div>
                        <h3 className="font-semibold text-gray-900">Home Page Only</h3>
                        <p className="text-gray-600">Test the main page of your website.</p>
                      </div>
                    </div>
                  </div>

                  <div
                    onClick={() => setRouteType('custom')}
                    className={`p-6 border-2 rounded-xl cursor-pointer transition-colors ${
                      routeType === 'custom'
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-4 h-4 rounded-full border-2 ${
                          routeType === 'custom'
                            ? 'border-indigo-500 bg-indigo-500'
                            : 'border-gray-300'
                        }`}
                      />
                      <div>
                        <h3 className="font-semibold text-gray-900">Custom Routes</h3>
                        <p className="text-gray-600">Specify exact routes you want to test for performance.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 py-3 px-6 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => routeType === 'custom' ? setStep(3) : runPerformanceTest()}
                    className="flex-1 flex items-center justify-center space-x-2 bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <span>{routeType === 'custom' ? 'Continue' : 'Run Test'}</span>
                    {routeType === 'custom' ? <ChevronRight className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Custom Routes */}
            {step === 3 && routeType === 'custom' && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <Plus className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Configure Custom Routes</h2>
                  <p className="text-gray-600">Add the specific routes you want to test for performance analysis.</p>
                </div>

                <div className="space-y-4">
                  {customRoutes.map((route) => (
                    <div key={route.id} className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={route.name}
                          onChange={(e) => updateCustomRoute(route.id, 'name', e.target.value)}
                          placeholder="Route name"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 mb-2"
                        />
                        <input
                          type="text"
                          value={route.path}
                          onChange={(e) => updateCustomRoute(route.id, 'path', e.target.value)}
                          placeholder="/path/to/page"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      <button
                        onClick={() => removeCustomRoute(route.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}

                  <button
                    onClick={addCustomRoute}
                    className="w-full flex items-center justify-center space-x-2 py-3 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Route</span>
                  </button>
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={() => setStep(2)}
                    className="flex-1 py-3 px-6 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={runPerformanceTest}
                    disabled={customRoutes.filter(r => r.path.trim()).length === 0}
                    className="flex-1 flex items-center justify-center space-x-2 bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Play className="h-4 w-4" />
                    <span>Run Performance Test</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;