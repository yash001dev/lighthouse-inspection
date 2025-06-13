import React from 'react';
import { BarChart3, Wifi, WifiOff, Database, Zap, Eye, CheckCircle2, Globe } from 'lucide-react';

interface LoadingSpinnerProps {
  hasApiKey: boolean;
  hasSupabase: boolean;
  loadingProgress: {
    current: number;
    total: number;
    currentUrl: string;
  };
  customMessage?: string;
  customDescription?: string;
}

export function LoadingSpinner({ 
  hasApiKey, 
  hasSupabase, 
  loadingProgress, 
  customMessage,
  customDescription 
}: LoadingSpinnerProps) {
  const metrics = [
    { icon: Zap, label: 'Performance', color: 'text-blue-500' },
    { icon: Eye, label: 'Accessibility', color: 'text-green-500' },
    { icon: CheckCircle2, label: 'Best Practices', color: 'text-purple-500' },
    { icon: Globe, label: 'SEO', color: 'text-orange-500' },
  ];

  // Calculate progress percentage
  const getProgressPercentage = () => {
    if (loadingProgress.total === 0) return 0;
    return Math.round((loadingProgress.current / loadingProgress.total) * 100);
  };

  // Determine if we should show progress bar
  const showProgressBar = loadingProgress.total > 0 && !customMessage;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 p-8 max-w-lg mx-auto">
        <div className="text-center">
          {/* Animated Logo */}
          <div className="relative mb-8">
            <div className="w-20 h-20 mx-auto relative">
              {/* Outer rotating ring */}
              <div className="absolute inset-0 border-4 border-indigo-100 rounded-full animate-spin"></div>
              <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin" style={{ animationDuration: '1s' }}></div>
              
              {/* Inner pulsing circle */}
              <div className="absolute inset-4 bg-indigo-100 rounded-full animate-pulse"></div>
              <div className="absolute inset-6 bg-indigo-600 rounded-full flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          {/* Title and Description */}
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            {customMessage || (hasApiKey ? 'Running Lighthouse Analysis' : 'Generating Performance Report')}
          </h3>
          <p className="text-gray-600 mb-6">
            {customDescription || (showProgressBar 
              ? `Analyzing ${loadingProgress.current} of ${loadingProgress.total} routes...`
              : 'This may take a few moments...'
            )}
          </p>

          {/* Current URL */}
          {loadingProgress.currentUrl && !customMessage && (
            <div className="mb-6 p-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-500 mb-1">Currently analyzing:</p>
              <p className="font-medium text-gray-900 truncate">{loadingProgress.currentUrl}</p>
            </div>
          )}

          {/* Custom URL for history loading */}
          {loadingProgress.currentUrl && customMessage && (
            <div className="mb-6 p-4 bg-gray-50 rounded-xl">
              <p className="font-medium text-gray-900">{loadingProgress.currentUrl}</p>
            </div>
          )}

          {/* Progress Bar - Only show for actual testing, not for history loading */}
          {showProgressBar && (
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progress</span>
                <span>{getProgressPercentage()}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 h-3 rounded-full transition-all duration-500 ease-out relative overflow-hidden" 
                  style={{ width: `${getProgressPercentage()}%` }}
                >
                  <div className="absolute inset-0 bg-white opacity-30 animate-pulse"></div>
                </div>
              </div>
            </div>
          )}

          {/* Animated Metrics - Only show for performance testing */}
          {!customMessage && (
            <div className="grid grid-cols-2 gap-4 mb-6">
              {metrics.map((metric, index) => (
                <div 
                  key={metric.label} 
                  className="p-4 bg-gray-50 rounded-xl transition-all duration-300 hover:bg-gray-100"
                  style={{ 
                    animationDelay: `${index * 0.2}s`,
                    animation: 'fadeInUp 0.6s ease-out forwards'
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg bg-white shadow-sm`}>
                      <metric.icon className={`h-5 w-5 ${metric.color}`} />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900">{metric.label}</p>
                      <div className="flex space-x-1 mt-1">
                        {[...Array(3)].map((_, i) => (
                          <div 
                            key={i}
                            className="w-2 h-2 bg-gray-300 rounded-full animate-pulse"
                            style={{ animationDelay: `${i * 0.2}s` }}
                          ></div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Status Indicators - Only show for performance testing */}
          {!customMessage && (
            <div className="flex items-center justify-center space-x-6 text-xs text-gray-500 mb-6">
              <div className="flex items-center space-x-2">
                {hasApiKey ? (
                  <div className="flex items-center space-x-1">
                    <Wifi className="h-4 w-4 text-green-500" />
                    <span className="text-green-600 font-medium">Real API Data</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1">
                    <WifiOff className="h-4 w-4 text-gray-400" />
                    <span>Demo Mode</span>
                  </div>
                )}
              </div>
              <div className="w-px h-4 bg-gray-300"></div>
              <div className="flex items-center space-x-2">
                {hasSupabase ? (
                  <div className="flex items-center space-x-1">
                    <Database className="h-4 w-4 text-green-500" />
                    <span className="text-green-600 font-medium">Cloud Storage</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1">
                    <Database className="h-4 w-4 text-gray-400" />
                    <span>Local Storage</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Loading Tips */}
          <div className="mt-6 p-4 bg-blue-50 rounded-xl">
            <p className="text-sm text-blue-800">
              <span className="font-medium">💡 Tip:</span> {customMessage 
                ? 'Your test history is being loaded from the database.'
                : hasApiKey 
                  ? 'We\'re fetching real performance data from Google PageSpeed Insights API.'
                  : 'Connect your PageSpeed Insights API key for real performance data.'
              }
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}