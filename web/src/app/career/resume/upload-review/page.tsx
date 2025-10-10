'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { AppHeader } from '@/components/AppHeader';

export default function UploadReviewPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [resumeData, setResumeData] = useState<any>(null);
  const [optimizing, setOptimizing] = useState(false);
  const [optimization, setOptimization] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      router.push('/login');
      return;
    }
    setToken(storedToken);

    // Get parsed resume data
    const parsedData = sessionStorage.getItem('parsedResume');
    if (!parsedData) {
      router.push('/career');
      return;
    }

    setResumeData(JSON.parse(parsedData));
  }, [router]);

  const handleOptimize = async () => {
    if (!resumeData) return;

    setOptimizing(true);
    try {
      console.log('Step 1: Creating temporary resume...');
      console.log('Resume data:', resumeData);
      
      // Filter out extra fields that the backend DTO doesn't accept
      const { rawText, parsingSuccess, fileName, error, ...cleanResumeData } = resumeData;
      
      console.log('Cleaned resume data (removed rawText, parsingSuccess, fileName)');
      
      // First, save the resume temporarily
      const tempResume = await api.createResume(token, {
        title: `Uploaded Resume - ${new Date().toLocaleDateString()}`,
        ...cleanResumeData,
      });

      console.log('Step 2: Temporary resume created:', tempResume.id);
      console.log('Step 3: Requesting optimization...');

      // Then optimize it
      const result = await api.optimizeResume(token, tempResume.id);
      
      console.log('Step 4: Optimization complete!', result);
      setOptimization(result);
    } catch (error: any) {
      console.error('=== Optimization Error ===');
      console.error('Error type:', error.constructor?.name);
      console.error('Error message:', error.message);
      console.error('Full error:', error);
      
      // Show more specific error message
      let errorMsg = 'Failed to optimize resume. ';
      if (error.message?.includes('Failed to create')) {
        errorMsg += 'Could not save your resume. Please check the console and try again.';
      } else if (error.message?.includes('Failed to optimize')) {
        errorMsg += 'AI optimization service error. Please check your OpenAI API key and try again.';
      } else if (error.message) {
        errorMsg += error.message;
      } else {
        errorMsg += 'Please check the console for details and try again.';
      }
      
      alert(errorMsg);
    } finally {
      setOptimizing(false);
    }
  };

  const handleSave = async () => {
    if (!resumeData) return;

    setSaving(true);
    try {
      // Filter out extra fields that the backend DTO doesn't accept
      const { rawText, parsingSuccess, fileName, error, optimizationScore, suggestions, ...cleanResumeData } = resumeData;
      
      // Create the resume first
      const created = await api.createResume(token, {
        title: `My Resume - ${new Date().toLocaleDateString()}`,
        ...cleanResumeData,
      });

      // Then update it with optimization data if we have it
      if (optimization) {
        await api.updateResume(token, created.id, {
          optimizationScore: optimization.score,
          suggestions: optimization.suggestions,
        });
      }

      // Redirect directly to resume detail page
      router.push(`/career/resume/${created.id}`);
    } catch (error: any) {
      console.error('Save error:', error);
      alert(`Failed to save: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (!resumeData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'from-green-500 to-emerald-500';
    if (score >= 60) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-pink-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <AppHeader />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Resume Preview */}
          <div>
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">📄 Your Resume</h2>
              
              <div className="space-y-6">
                {/* Contact Info */}
                {resumeData.fullName && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{resumeData.fullName}</h3>
                    <div className="text-sm text-gray-600 mt-1 space-y-1">
                      {resumeData.email && <div>✉️ {resumeData.email}</div>}
                      {resumeData.phone && <div>📱 {resumeData.phone}</div>}
                      {resumeData.location && <div>📍 {resumeData.location}</div>}
                    </div>
                  </div>
                )}

                {/* Summary */}
                {resumeData.summary && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Summary</h4>
                    <p className="text-gray-700 text-sm">{resumeData.summary}</p>
                  </div>
                )}

                {/* Experience */}
                {resumeData.experience && resumeData.experience.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Experience</h4>
                    <div className="space-y-3">
                      {resumeData.experience.map((exp: any, i: number) => (
                        <div key={i} className="text-sm">
                          <p className="font-medium text-gray-900">{exp.position}</p>
                          <p className="text-gray-600">{exp.company}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skills */}
                {resumeData.skills && resumeData.skills.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {resumeData.skills.slice(0, 10).map((skill: any, i: number) => (
                        <span key={i} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          {typeof skill === 'string' ? skill : skill.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {!optimization && (
              <button
                onClick={handleOptimize}
                disabled={optimizing}
                className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {optimizing ? (
                  <span className="flex items-center justify-center gap-3">
                    <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></span>
                    Analyzing with AI...
                  </span>
                ) : (
                  '🚀 Get ATS Score & Suggestions'
                )}
              </button>
            )}
          </div>

          {/* Right: Optimization Results */}
          <div>
            {!optimization ? (
              <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
                <div className="text-6xl mb-4">🎯</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Ready to Optimize?</h3>
                <p className="text-gray-600 mb-6">
                  Click the button to get your ATS score and personalized suggestions to improve your resume
                </p>
                <div className="bg-blue-50 rounded-xl p-4 text-left">
                  <p className="text-sm text-gray-700">
                    <strong>What we'll check:</strong>
                  </p>
                  <ul className="text-sm text-gray-600 mt-2 space-y-1">
                    <li>✓ Keyword optimization</li>
                    <li>✓ ATS compatibility</li>
                    <li>✓ Achievement quantification</li>
                    <li>✓ Action verb usage</li>
                    <li>✓ Format and structure</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Score Card */}
                <div className={`bg-gradient-to-br ${getScoreColor(optimization.score)} rounded-2xl p-8 text-white shadow-xl`}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold">ATS Score</h2>
                    <div className="text-right">
                      <div className="text-5xl font-bold">{optimization.score}</div>
                      <div className="text-lg">/100</div>
                    </div>
                  </div>
                  <div className="h-3 bg-white/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white rounded-full transition-all duration-1000"
                      style={{ width: `${optimization.score}%` }}
                    />
                  </div>
                  <p className="mt-4 text-white/90 text-sm">
                    {optimization.score >= 80 && "Excellent! Your resume is well-optimized."}
                    {optimization.score >= 60 && optimization.score < 80 && "Good! A few improvements will make it even better."}
                    {optimization.score < 60 && "Needs improvement. Follow the suggestions below."}
                  </p>
                </div>

                {/* Suggestions */}
                <div className="bg-white rounded-2xl shadow-xl p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    💡 Suggestions ({optimization.suggestions?.length || 0})
                  </h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {optimization.suggestions?.map((suggestion: any, index: number) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border-l-4 ${
                          suggestion.priority === 'high'
                            ? 'bg-red-50 border-red-500'
                            : suggestion.priority === 'medium'
                            ? 'bg-yellow-50 border-yellow-500'
                            : 'bg-blue-50 border-blue-500'
                        }`}
                      >
                        <div className="flex items-start gap-2 mb-1">
                          <span className="text-lg">
                            {suggestion.priority === 'high' && '🔴'}
                            {suggestion.priority === 'medium' && '🟡'}
                            {suggestion.priority === 'low' && '🔵'}
                          </span>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 text-sm">{suggestion.title}</h4>
                            <p className="text-sm text-gray-700 mt-1">{suggestion.description}</p>
                            <span className="text-xs text-gray-500 mt-1 inline-block">
                              {suggestion.category}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold text-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : '✓ Save Resume'}
                  </button>
                  <button
                    onClick={() => router.push('/career')}
                    className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                  >
                    Start Over
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}


