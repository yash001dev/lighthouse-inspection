import React, { useState, useEffect } from 'react';
import { History, ChevronRight, Globe, Calendar, BarChart3, ArrowLeft, Filter, Search } from 'lucide-react';
import { LighthouseStorage, LighthouseResult } from '../lib/supabase';

interface HistoryViewProps {
  onBack: () => void;
  onLoadResult: (result: LighthouseResult) => void;
  onCompareResults: (results: LighthouseResult[]) => void;
}

export function HistoryView({ onBack, onLoadResult, onCompareResults }: HistoryViewProps) {
  const [results, setResults] = useState<LighthouseResult[]>([]);
  const [domains, setDomains] = useState<string[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedResults, setSelectedResults] = useState<Set<string>>(new Set());
  const [compareMode, setCompareMode] = useState(false);

  useEffect(() => {
    loadData();
  }, [selectedDomain]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allDomains, domainResults] = await Promise.all([
        LighthouseStorage.getAllDomains(),
        LighthouseStorage.getResultsByDomain(selectedDomain || undefined)
      ]);
      
      setDomains(allDomains);
      setResults(domainResults);
    } catch (error) {
      console.error('Error loading history data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredResults = results.filter(result => {
    if (!searchTerm) return true;
    return result.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
           result.domain.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const groupedResults = filteredResults.reduce((groups, result) => {
    const domain = result.domain;
    if (!groups[domain]) {
      groups[domain] = [];
    }
    groups[domain].push(result);
    return groups;
  }, {} as Record<string, LighthouseResult[]>);

  const handleResultSelect = (resultId: string) => {
    if (compareMode) {
      const newSelected = new Set(selectedResults);
      if (newSelected.has(resultId)) {
        newSelected.delete(resultId);
      } else if (newSelected.size < 3) { // Limit to 3 comparisons
        newSelected.add(resultId);
      }
      setSelectedResults(newSelected);
    } else {
      const result = results.find(r => r.id === resultId);
      if (result) {
        onLoadResult(result);
      }
    }
  };

  const handleCompare = () => {
    const resultsToCompare = results.filter(r => selectedResults.has(r.id));
    if (resultsToCompare.length >= 2) {
      onCompareResults(resultsToCompare);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-indigo-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <p className="text-gray-600">Loading test history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
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
                <History className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Test History</h1>
                <p className="text-gray-600">
                  {results.length} test{results.length !== 1 ? 's' : ''} across {domains.length} domain{domains.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {compareMode && selectedResults.size >= 2 && (
                <button
                  onClick={handleCompare}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Compare {selectedResults.size} Results
                </button>
              )}
              <button
                onClick={() => {
                  setCompareMode(!compareMode);
                  setSelectedResults(new Set());
                }}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  compareMode 
                    ? 'bg-red-600 text-white hover:bg-red-700' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {compareMode ? 'Cancel Compare' : 'Compare Mode'}
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Filter className="h-4 w-4 inline mr-1" />
                  Filter by Domain
                </label>
                <select
                  value={selectedDomain}
                  onChange={(e) => setSelectedDomain(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">All Domains</option>
                  {domains.map(domain => (
                    <option key={domain} value={domain}>{domain}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Search className="h-4 w-4 inline mr-1" />
                  Search
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by URL or domain..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Results */}
          {Object.keys(groupedResults).length === 0 ? (
            <div className="text-center py-12">
              <History className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No test history found</h3>
              <p className="text-gray-600">
                {searchTerm || selectedDomain 
                  ? 'Try adjusting your filters or search terms.'
                  : 'Run your first performance test to see results here.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedResults).map(([domain, domainResults]) => (
                <div key={domain} className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Globe className="h-5 w-5 text-indigo-600" />
                    <h2 className="text-xl font-semibold text-gray-900">{domain}</h2>
                    <span className="text-sm text-gray-500">
                      {domainResults.length} test{domainResults.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {domainResults.map((result) => (
                      <div
                        key={result.id}
                        onClick={() => handleResultSelect(result.id)}
                        className={`bg-white rounded-xl shadow-sm border-2 p-6 transition-all cursor-pointer ${
                          compareMode
                            ? selectedResults.has(result.id)
                              ? 'border-indigo-500 bg-indigo-50'
                              : 'border-gray-200 hover:border-gray-300'
                            : 'border-gray-200 hover:shadow-md hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-1">{result.url}</h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-4 w-4" />
                                <span>{new Date(result.timestamp).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <BarChart3 className="h-4 w-4" />
                                <span>{result.routes.length} route{result.routes.length !== 1 ? 's' : ''}</span>
                              </div>
                            </div>
                          </div>
                          {!compareMode && <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />}
                          {compareMode && selectedResults.has(result.id) && (
                            <div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-4 gap-3">
                          {[
                            { label: 'Perf', score: result.avg_scores.performance },
                            { label: 'A11y', score: result.avg_scores.accessibility },
                            { label: 'BP', score: result.avg_scores.bestPractices },
                            { label: 'SEO', score: result.avg_scores.seo },
                          ].map((metric) => (
                            <div key={metric.label} className={`p-3 rounded-lg ${getScoreBg(metric.score)}`}>
                              <div className="text-center">
                                <div className={`text-lg font-bold ${getScoreColor(metric.score)}`}>
                                  {metric.score}
                                </div>
                                <div className="text-xs text-gray-600">{metric.label}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}