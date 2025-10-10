'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';

interface HashtagTrend {
  tag: string;
  count: number;
}

export function TrendingHashtags() {
  const router = useRouter();
  const [trends, setTrends] = useState<HashtagTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    loadTrends();
    
    // Set up real-time listener for new posts
    const socket = getSocket();
    
    socket.on('post.created', () => {
      console.log('New post detected, refreshing trends...');
      refreshTrends();
    });

    // Also refresh every 30 seconds as fallback
    const interval = setInterval(() => refreshTrends(), 30000);
    
    return () => {
      socket.off('post.created');
      clearInterval(interval);
    };
  }, []);

  const loadTrends = async () => {
    try {
      const data = await api.getTrendingHashtags(8);
      setTrends(data);
    } catch (error) {
      console.error('Failed to load trending hashtags:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshTrends = async () => {
    try {
      setIsUpdating(true);
      const data = await api.getTrendingHashtags(8);
      setTrends(data);
    } catch (error) {
      console.error('Failed to refresh trending hashtags:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const getTrendColor = (index: number) => {
    const colors = [
      'from-pink-500 to-rose-500',      // #1
      'from-purple-500 to-indigo-500',  // #2
      'from-blue-500 to-cyan-500',      // #3
      'from-emerald-500 to-teal-500',   // #4
      'from-amber-500 to-orange-500',   // #5
      'from-pink-400 to-purple-400',    // #6
      'from-blue-400 to-indigo-400',    // #7
      'from-teal-400 to-green-400',     // #8
    ];
    return colors[index] || colors[0];
  };

  const getSize = (index: number) => {
    if (index === 0) return 'text-2xl';
    if (index === 1) return 'text-xl';
    if (index === 2) return 'text-lg';
    return 'text-base';
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-white via-purple-50/30 to-blue-50/30 backdrop-blur-sm rounded-2xl shadow-lg border border-purple-100/50 p-6 sticky top-20">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-lg">🔥</span>
          </div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Trending Now
          </h2>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded-lg w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (trends.length === 0) {
    return (
      <div className="bg-gradient-to-br from-white via-purple-50/30 to-blue-50/30 backdrop-blur-sm rounded-2xl shadow-lg border border-purple-100/50 p-6 sticky top-20">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-lg">🔥</span>
          </div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Trending Now
          </h2>
        </div>
        <p className="text-gray-500 text-sm text-center py-4">
          No trending hashtags yet. Start using hashtags in your posts!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-white via-purple-50/30 to-blue-50/30 backdrop-blur-sm rounded-2xl shadow-lg border border-purple-100/50 p-6 sticky top-20 hover:shadow-xl transition-shadow duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center ${isUpdating ? 'animate-spin' : 'animate-pulse'}`}>
            <span className="text-white text-lg">{isUpdating ? '🔄' : '🔥'}</span>
          </div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Trending Now
          </h2>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full border transition-all duration-300 ${
          isUpdating 
            ? 'text-blue-600 bg-blue-50 border-blue-200 animate-pulse' 
            : 'text-green-600 bg-green-50 border-green-200'
        }`}>
          {isUpdating ? 'Updating...' : '● Live'}
        </span>
      </div>

      {/* Trending Tags */}
      <div className="space-y-2">
        {trends.map((trend, index) => (
          <button
            key={trend.tag}
            onClick={() => router.push(`/hashtag/${trend.tag}`)}
            className="group w-full text-left p-3 rounded-xl hover:bg-white/80 transition-all duration-300 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] border border-transparent hover:border-purple-200/50"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Rank Badge */}
                <div className={`flex-shrink-0 w-7 h-7 bg-gradient-to-br ${getTrendColor(index)} rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow`}>
                  <span className="text-white font-bold text-xs">
                    {index + 1}
                  </span>
                </div>
                
                {/* Hashtag */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`font-bold text-gray-800 group-hover:bg-gradient-to-r ${getTrendColor(index)} group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300 ${getSize(index)} truncate`}>
                      #{trend.tag}
                    </span>
                    {index < 3 && (
                      <span className="flex-shrink-0 text-xs">
                        {index === 0 && '🏆'}
                        {index === 1 && '🥈'}
                        {index === 2 && '🥉'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-500 font-medium">
                      {trend.count} {trend.count === 1 ? 'post' : 'posts'}
                    </span>
                    {/* Trending indicator for top 3 */}
                    {index < 3 && (
                      <span className="text-xs text-pink-600 font-semibold flex items-center gap-0.5">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                        </svg>
                        Hot
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Arrow */}
              <svg className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-all duration-300 group-hover:translate-x-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>

            {/* Sparkle animation for top 3 */}
            {index < 3 && (
              <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="text-yellow-400 text-xs animate-pulse">✨</span>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-5 pt-4 border-t border-gray-200/50">
        <p className="text-xs text-center text-gray-500">
          🔴 Real-time updates • Last 7 days
        </p>
      </div>
    </div>
  );
}

