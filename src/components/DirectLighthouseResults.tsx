import React, { useState } from 'react';
import { Activity, Download, Monitor, Smartphone, Clock, Zap, Eye, CheckCircle2, Globe, Info } from 'lucide-react';

interface CoreWebVitalsMetrics {
  fcp: { value: number; score: number; displayValue: string; title: string };
  lcp: { value: number; score: number; displayValue: string; title: string };
  cls: { value: number; score: number; displayValue: string; title: string };
  tbt: { value: number; score: number; displayValue: string; title: string };
  si: { value: number; score: number; displayValue: string; title: string };
  fid: { value: number; score: number; displayValue: string; title: string };
}

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

interface DirectLighthouseResult {
  metrics: LighthouseMetrics;
  coreWebVitals: CoreWebVitalsMetrics;
  fullReport: {
    lhr: Record<string, unknown>;
    report: string;
  };
  downloadableJson: string;
  storageInfo?: {
    saved: boolean;
    id?: string;
    filename?: string;
    downloadUrl?: string;
    viewUrl?: string;
  };
  // Additional fields from full Lighthouse response
  audits?: Record<string, unknown>;
  categories?: Record<string, unknown>;
  lighthouseVersion?: string;
  finalUrl?: string;
  fetchTime?: string;
}

interface DirectLighthouseResultsProps {
  result: DirectLighthouseResult;
  url: string;
  strategy: 'mobile' | 'desktop';
  timestamp: string;
  onClose: () => void;
}

export const DirectLighthouseResults: React.FC<DirectLighthouseResultsProps> = ({ 
  result, 
  url, 
  strategy, 
  timestamp, 
  onClose 
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'accessibility' | 'best-practices' | 'seo'>('overview');
  const [expandedMetrics, setExpandedMetrics] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 50) return 'text-orange-500';
    return 'text-red-500';
  };

  const getScoreBg = (score: number) => {
    if (score >= 90) return 'bg-green-50 border-green-200';
    if (score >= 50) return 'bg-orange-50 border-orange-200';
    return 'bg-red-50 border-red-200';
  };

  const getScoreCircleColor = (score: number) => {
    if (score >= 90) return 'stroke-green-500';
    if (score >= 50) return 'stroke-orange-500';
    return 'stroke-red-500';
  };

  const downloadReport = () => {
    const blob = new Blob([result.downloadableJson], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lighthouse-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const renderScoreCircle = (score: number, size: 'sm' | 'lg' = 'lg') => {
    const radius = size === 'lg' ? 45 : 20;
    const strokeWidth = size === 'lg' ? 8 : 3;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
      <div className="relative">
        <svg 
          width={size === 'lg' ? 100 : 50} 
          height={size === 'lg' ? 100 : 50} 
          className="transform -rotate-90"
        >
          <circle
            cx={size === 'lg' ? 50 : 25}
            cy={size === 'lg' ? 50 : 25}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            className="text-gray-200"
          />
          <circle
            cx={size === 'lg' ? 50 : 25}
            cy={size === 'lg' ? 50 : 25}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className={getScoreCircleColor(score)}
            strokeLinecap="round"
          />
        </svg>
        <div className={`absolute inset-0 flex items-center justify-center ${size === 'lg' ? 'text-2xl' : 'text-sm'} font-bold ${getScoreColor(score)}`}>
          {score}
        </div>
      </div>
    );
  };

  const categories = [
    { 
      id: 'performance', 
      name: 'Performance', 
      score: result.metrics.performance, 
      icon: Zap,
      description: 'Values are estimated and may vary. The performance score is calculated from these metrics.'
    },
    { 
      id: 'accessibility', 
      name: 'Accessibility', 
      score: result.metrics.accessibility, 
      icon: Eye,
      description: 'These checks highlight opportunities to improve the accessibility of your web app.'
    },
    { 
      id: 'best-practices', 
      name: 'Best Practices', 
      score: result.metrics.bestPractices, 
      icon: CheckCircle2,
      description: 'These checks highlight opportunities to follow web development best practices.'
    },
    { 
      id: 'seo', 
      name: 'SEO', 
      score: result.metrics.seo, 
      icon: Globe,
      description: 'These checks ensure that your page is optimized for search engine results ranking.'
    },
  ];

  const coreMetrics = [
    {
      id: 'fcp',
      title: 'First Contentful Paint',
      value: result.coreWebVitals.fcp.displayValue,
      description: 'First Contentful Paint marks the time at which the first text or image is painted.',
      score: result.coreWebVitals.fcp.score,
    },
    {
      id: 'lcp',
      title: 'Largest Contentful Paint',
      value: result.coreWebVitals.lcp.displayValue,
      description: 'Largest Contentful Paint marks the time at which the largest text or image is painted.',
      score: result.coreWebVitals.lcp.score,
    },
    {
      id: 'cls',
      title: 'Cumulative Layout Shift',
      value: result.coreWebVitals.cls.displayValue,
      description: 'Cumulative Layout Shift measures the movement of visible elements within the viewport.',
      score: result.coreWebVitals.cls.score,
    },
    {
      id: 'si',
      title: 'Speed Index',
      value: result.coreWebVitals.si.displayValue,
      description: 'Speed Index shows how quickly the contents of a page are visibly populated.',
      score: result.coreWebVitals.si.score,
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Activity className="h-6 w-6 text-blue-600" />
              <div>
                <h1 className="text-xl font-medium text-gray-900">Lighthouse Report</h1>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>{url}</span>
                  <span>•</span>
                  <div className="flex items-center space-x-1">
                    {strategy === 'mobile' ? <Smartphone className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
                    <span className="capitalize">{strategy}</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{formatTimestamp(timestamp)}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={downloadReport}
                className="inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Download className="h-4 w-4" />
                <span>Download Report</span>
              </button>
              <button
                onClick={onClose}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
              >
                ← Back
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', name: 'Overview' },
              { id: 'performance', name: 'Performance' },
              { id: 'accessibility', name: 'Accessibility' },
              { id: 'best-practices', name: 'Best Practices' },
              { id: 'seo', name: 'SEO' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'overview' | 'performance' | 'accessibility' | 'best-practices' | 'seo')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Score Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className={`p-6 rounded-lg border ${getScoreBg(category.score)} cursor-pointer hover:shadow-md transition-shadow`}
                  onClick={() => setActiveTab(category.id as 'overview' | 'performance' | 'accessibility' | 'best-practices' | 'seo')}
                >
                  <div className="flex items-center justify-between mb-4">
                    <category.icon className={`h-6 w-6 ${getScoreColor(category.score)}`} />
                    {renderScoreCircle(category.score, 'sm')}
                  </div>
                  <h3 className="font-medium text-gray-900 mb-2">{category.name}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{category.description}</p>
                </div>
              ))}
            </div>

            {/* Core Web Vitals */}
            <div className="bg-white border border-gray-200 rounded-lg">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-gray-900">Metrics</h2>
                  <button
                    onClick={() => setExpandedMetrics(!expandedMetrics)}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    {expandedMetrics ? 'Collapse' : 'Expand'} view
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Values are estimated and may vary. The performance score is calculated from these metrics.
                </p>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {coreMetrics.map((metric) => (
                    <div key={metric.id} className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        {metric.score >= 90 ? (
                          <div className="w-3 h-3 bg-green-500 rounded-full mt-1.5"></div>
                        ) : metric.score >= 50 ? (
                          <div className="w-3 h-3 bg-orange-500 rounded-full mt-1.5"></div>
                        ) : (
                          <div className="w-3 h-3 bg-red-500 rounded-full mt-1.5"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-gray-900">{metric.title}</h3>
                          <span className={`text-lg font-mono ${getScoreColor(metric.score)}`}>
                            {metric.value}
                          </span>
                        </div>
                        {expandedMetrics && (
                          <p className="text-sm text-gray-600 mt-1">{metric.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Additional Metrics */}
            <div className="bg-white border border-gray-200 rounded-lg">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Additional Metrics</h2>
                <p className="text-sm text-gray-600 mt-1">
                  These metrics provide additional insight into your page's performance.
                </p>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-3 h-3 bg-gray-400 rounded-full mt-1.5 flex-shrink-0"></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900">Total Blocking Time</h3>
                        <span className="text-lg font-mono text-gray-900">
                          {result.coreWebVitals.tbt.displayValue}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="w-3 h-3 bg-gray-400 rounded-full mt-1.5 flex-shrink-0"></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900">Max Potential First Input Delay</h3>
                        <span className="text-lg font-mono text-gray-900">
                          {result.coreWebVitals.fid.displayValue}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Individual Category Views */}
        {activeTab !== 'overview' && (
          <div className="space-y-8">
            {(() => {
              const category = categories.find(c => c.id === activeTab);
              if (!category) return null;

              return (
                <div className="space-y-6">
                  {/* Category Header */}
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-4">
                      {renderScoreCircle(category.score)}
                      <div>
                        <h1 className="text-2xl font-medium text-gray-900">{category.name}</h1>
                        <p className="text-gray-600">{category.description}</p>
                      </div>
                    </div>
                  </div>

                  {/* Score Range Legend */}
                  <div className="flex items-center space-x-6 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span>0–49</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <span>50–89</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span>90–100</span>
                    </div>
                  </div>

                  {/* Category Specific Content */}
                  {activeTab === 'performance' && (
                    <div className="space-y-6">
                      {/* Metrics Section */}
                      <div className="bg-white border border-gray-200 rounded-lg">
                        <div className="p-6 border-b border-gray-200">
                          <h2 className="text-lg font-medium text-gray-900">Metrics</h2>
                          <p className="text-sm text-gray-600 mt-1">
                            Values are estimated and may vary. The performance score is calculated from these metrics.
                          </p>
                        </div>
                        <div className="p-6">
                          <div className="space-y-4">
                            {coreMetrics.map((metric) => (
                              <div key={metric.id} className="flex items-center justify-between p-4 rounded-lg border border-gray-200">
                                <div className="flex items-center space-x-4">
                                  <div className={`w-3 h-3 rounded-full ${
                                    metric.score >= 90 ? 'bg-green-500' : 
                                    metric.score >= 50 ? 'bg-orange-500' : 'bg-red-500'
                                  }`}></div>
                                  <div>
                                    <h3 className="font-medium text-gray-900">{metric.title}</h3>
                                    <p className="text-sm text-gray-600">{metric.description}</p>
                                  </div>
                                </div>
                                <span className={`text-lg font-mono ${getScoreColor(metric.score)}`}>
                                  {metric.value}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Placeholder for other categories */}
                  {activeTab !== 'performance' && (
                    <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                      <Info className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Detailed {category.name} Analysis
                      </h3>
                      <p className="text-gray-600">
                        This section would contain detailed audit results for {category.name.toLowerCase()}.
                        The full Lighthouse report data is available in the downloaded JSON file.
                      </p>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
};
