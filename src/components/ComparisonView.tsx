import React from 'react';
import { ArrowLeft, BarChart3, TrendingUp, TrendingDown, Minus, Globe, Calendar } from 'lucide-react';
import { LighthouseResult } from '../lib/supabase';

interface ComparisonViewProps {
  results: LighthouseResult[];
  onBack: () => void;
}

export function ComparisonView({ results, onBack }: ComparisonViewProps) {
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

  const getDifferenceIcon = (diff: number) => {
    if (diff > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (diff < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  const getDifferenceColor = (diff: number) => {
    if (diff > 0) return 'text-green-600';
    if (diff < 0) return 'text-red-600';
    return 'text-gray-500';
  };

  const calculateDifference = (current: number, previous: number) => {
    return current - previous;
  };

  const metrics = ['performance', 'accessibility', 'bestPractices', 'seo'] as const;
  const metricLabels = {
    performance: 'Performance',
    accessibility: 'Accessibility',
    bestPractices: 'Best Practices',
    seo: 'SEO'
  };

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
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div className="p-3 bg-indigo-100 rounded-xl">
                <BarChart3 className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Performance Comparison</h1>
                <p className="text-gray-600">Comparing {results.length} test results</p>
              </div>
            </div>
          </div>

          {/* Results Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {results.map((result, index) => (
              <div key={result.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold ${
                    index === 0 ? 'bg-blue-600' : index === 1 ? 'bg-purple-600' : 'bg-teal-600'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 truncate">{result.url}</h3>
                    <div className="flex items-center space-x-3 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(result.timestamp).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Globe className="h-3 w-3" />
                        <span>{result.domain}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {metrics.map((metric) => (
                    <div key={metric} className={`p-3 rounded-lg ${getScoreBg(result.avg_scores[metric])}`}>
                      <div className="text-center">
                        <div className={`text-lg font-bold ${getScoreColor(result.avg_scores[metric])}`}>
                          {result.avg_scores[metric]}
                        </div>
                        <div className="text-xs text-gray-600">{metricLabels[metric]}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Detailed Comparison */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Score Comparison</h2>
            
            <div className="space-y-6">
              {metrics.map((metric) => (
                <div key={metric} className="space-y-3">
                  <h3 className="font-medium text-gray-900">{metricLabels[metric]}</h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {results.map((result, index) => (
                      <div key={result.id} className="relative">
                        <div className={`p-4 rounded-lg border-2 ${
                          index === 0 ? 'border-blue-200 bg-blue-50' : 
                          index === 1 ? 'border-purple-200 bg-purple-50' : 
                          'border-teal-200 bg-teal-50'
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Test {index + 1}</span>
                            <span className={`text-2xl font-bold ${getScoreColor(result.avg_scores[metric])}`}>
                              {result.avg_scores[metric]}
                            </span>
                          </div>
                          
                          {index > 0 && (
                            <div className="flex items-center space-x-2 text-sm">
                              {getDifferenceIcon(calculateDifference(result.avg_scores[metric], results[0].avg_scores[metric]))}
                              <span className={getDifferenceColor(calculateDifference(result.avg_scores[metric], results[0].avg_scores[metric]))}>
                                {calculateDifference(result.avg_scores[metric], results[0].avg_scores[metric]) > 0 ? '+' : ''}
                                {calculateDifference(result.avg_scores[metric], results[0].avg_scores[metric])} vs Test 1
                              </span>
                            </div>
                          )}
                          
                          <div className="mt-3 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                result.avg_scores[metric] >= 90 ? 'bg-green-500' : 
                                result.avg_scores[metric] >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${result.avg_scores[metric]}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Route-by-Route Comparison */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Route Performance Comparison</h2>
            
            <div className="space-y-8">
              {results.map((result, resultIndex) => (
                <div key={result.id} className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-semibold ${
                      resultIndex === 0 ? 'bg-blue-600' : resultIndex === 1 ? 'bg-purple-600' : 'bg-teal-600'
                    }`}>
                      {resultIndex + 1}
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">{result.url}</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {Object.entries(result.results).map(([route, metrics]) => (
                      <div key={route} className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-3">
                          {result.routes.find(r => r.path === route)?.name || route}
                          <span className="text-sm text-gray-500 ml-2">({route})</span>
                        </h4>
                        
                        <div className="grid grid-cols-4 gap-2">
                          <div className="text-center">
                            <div className={`text-lg font-bold ${getScoreColor(metrics.performance)}`}>
                              {metrics.performance}
                            </div>
                            <div className="text-xs text-gray-600">Perf</div>
                          </div>
                          <div className="text-center">
                            <div className={`text-lg font-bold ${getScoreColor(metrics.accessibility)}`}>
                              {metrics.accessibility}
                            </div>
                            <div className="text-xs text-gray-600">A11y</div>
                          </div>
                          <div className="text-center">
                            <div className={`text-lg font-bold ${getScoreColor(metrics.bestPractices)}`}>
                              {metrics.bestPractices}
                            </div>
                            <div className="text-xs text-gray-600">BP</div>
                          </div>
                          <div className="text-center">
                            <div className={`text-lg font-bold ${getScoreColor(metrics.seo)}`}>
                              {metrics.seo}
                            </div>
                            <div className="text-xs text-gray-600">SEO</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}