'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function OptimizeResumePage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [resumes, setResumes] = useState<any[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [optimizing, setOptimizing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      router.push('/login');
      return;
    }
    setToken(storedToken);
    loadResumes(storedToken);
  }, [router]);

  const loadResumes = async (authToken: string) => {
    try {
      const data = await api.getResumes(authToken);
      setResumes(data);
    } catch (error) {
      console.error('Error loading resumes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOptimize = async () => {
    if (!selectedResumeId) {
      alert('Please select a resume to optimize');
      return;
    }

    setOptimizing(true);
    try {
      const optimization = await api.optimizeResume(token, selectedResumeId, targetRole, jobDescription);
      setResult(optimization);
    } catch (error) {
      console.error('Error optimizing resume:', error);
      alert('Failed to optimize resume. Please try again.');
    } finally {
      setOptimizing(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'from-green-500 to-emerald-500';
    if (score >= 60) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-pink-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50">
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/career')}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← Back
            </button>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Resume Optimizer
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Select Resume</h2>
              
              {resumes.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">No resumes available</p>
                  <button
                    onClick={() => router.push('/career/resume/new')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create Resume
                  </button>
                </div>
              ) : (
                <select
                  value={selectedResumeId}
                  onChange={(e) => setSelectedResumeId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">-- Select a resume --</option>
                  {resumes.map((resume) => (
                    <option key={resume.id} value={resume.id}>
                      {resume.title} (Score: {resume.optimizationScore}%)
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Optimization Context</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Role (Optional)
                  </label>
                  <input
                    type="text"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    placeholder="e.g., Senior Software Engineer"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Helps AI tailor suggestions to your desired role
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Description (Optional)
                  </label>
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste a job description to get role-specific optimization..."
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Optimize for a specific job posting
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleOptimize}
              disabled={optimizing || !selectedResumeId}
              className="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 font-bold text-lg shadow-lg hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {optimizing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">🔄</span>
                  Analyzing Resume...
                </span>
              ) : (
                '🚀 Optimize Resume'
              )}
            </button>
          </div>

          {/* Results Section */}
          <div className="lg:sticky lg:top-24 lg:h-fit">
            {!result ? (
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 text-center">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Analysis Yet</h3>
                <p className="text-gray-600">
                  Select a resume and click "Optimize Resume" to get AI-powered suggestions
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Score Card */}
                <div className={`bg-gradient-to-br ${getScoreColor(result.score)} rounded-2xl p-8 text-white shadow-xl`}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold">Optimization Score</h2>
                    <div className="text-right">
                      <div className="text-5xl font-bold">{result.score}</div>
                      <div className="text-xl">/100</div>
                    </div>
                  </div>
                  <div className="h-3 bg-white/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white rounded-full transition-all duration-1000"
                      style={{ width: `${result.score}%` }}
                    />
                  </div>
                </div>

                {/* Improved Summary */}
                {result.improvedSummary && (
                  <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-2xl">✨</span>
                      <h3 className="text-lg font-bold text-gray-900">Improved Summary</h3>
                    </div>
                    <p className="text-gray-700 bg-green-50 p-4 rounded-lg border border-green-200">
                      {result.improvedSummary}
                    </p>
                  </div>
                )}

                {/* Suggestions */}
                <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    Suggestions ({result.suggestions?.length || 0})
                  </h3>
                  <div className="space-y-4">
                    {result.suggestions?.map((suggestion: any, index: number) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border-2 ${getPriorityColor(suggestion.priority)}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">
                              {suggestion.priority === 'high' && '🔴'}
                              {suggestion.priority === 'medium' && '🟡'}
                              {suggestion.priority === 'low' && '🔵'}
                            </span>
                            <h4 className="font-semibold">{suggestion.title}</h4>
                          </div>
                          <span className="text-xs uppercase font-bold px-2 py-1 rounded">
                            {suggestion.priority}
                          </span>
                        </div>
                        <p className="text-sm mb-2">{suggestion.description}</p>
                        <div className="text-xs opacity-75">Category: {suggestion.category}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Next Steps</h3>
                  <div className="space-y-3">
                    <button
                      onClick={() => router.push(`/career/resume/${selectedResumeId}`)}
                      className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      📝 Edit Resume
                    </button>
                    <button
                      onClick={handleOptimize}
                      disabled={optimizing}
                      className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
                    >
                      🔄 Re-analyze
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

