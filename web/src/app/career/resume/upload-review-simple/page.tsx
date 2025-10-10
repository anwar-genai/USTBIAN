'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/AppHeader';

export default function UploadReviewSimplePage() {
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

    const parsedData = sessionStorage.getItem('parsedResume');
    if (!parsedData) {
      router.push('/career');
      return;
    }

    setResumeData(JSON.parse(parsedData));
  }, [router]);

  // SIMPLIFIED: Direct optimization without saving to DB first
  const handleOptimize = async () => {
    if (!resumeData) return;

    setOptimizing(true);
    try {
      console.log('Calling direct optimization...');
      
      // Call OpenAI directly with resume data (no DB save first)
      const res = await fetch('http://localhost:3000/career/resumes/optimize-direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          // Send resume data directly
          summary: resumeData.summary,
          experience: resumeData.experience,
          skills: resumeData.skills,
          education: resumeData.education,
          projects: resumeData.projects,
          targetRole: undefined,
          jobDescription: undefined,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Optimization failed:', errorText);
        throw new Error(errorText || 'Failed to optimize');
      }

      const result = await res.json();
      console.log('Optimization complete:', result);
      setOptimization(result);
    } catch (error: any) {
      console.error('=== Optimization Error ===');
      console.error(error);
      alert(`Failed to optimize: ${error.message}`);
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
      const res = await fetch('http://localhost:3000/career/resumes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: `My Resume - ${new Date().toLocaleDateString()}`,
          ...cleanResumeData,
        }),
      });

      if (!res.ok) throw new Error('Failed to save');
      
      const created = await res.json();

      // Then update with optimization data if we have it
      if (optimization) {
        const updateRes = await fetch(`http://localhost:3000/career/resumes/${created.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            optimizationScore: optimization.score,
            suggestions: optimization.suggestions,
          }),
        });
        if (!updateRes.ok) console.warn('Failed to update optimization data');
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

                {resumeData.summary && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Summary</h4>
                    <p className="text-gray-700 text-sm">{resumeData.summary}</p>
                  </div>
                )}

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
                  '🚀 Get ATS Score (Direct - No DB Save)'
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
                  Click the button to get your ATS score directly from AI (no database save required)
                </p>
                <div className="bg-blue-50 rounded-xl p-4 text-left">
                  <p className="text-sm text-gray-700">
                    <strong>Simplified approach:</strong>
                  </p>
                  <ul className="text-sm text-gray-600 mt-2 space-y-1">
                    <li>✓ Direct AI call (no temp save)</li>
                    <li>✓ Faster processing</li>
                    <li>✓ Save only when you want</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
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
                </div>

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
                        <h4 className="font-semibold text-gray-900 text-sm">{suggestion.title}</h4>
                        <p className="text-sm text-gray-700 mt-1">{suggestion.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

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

