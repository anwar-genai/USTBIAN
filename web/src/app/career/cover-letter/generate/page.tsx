'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function GenerateCoverLetterPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [resumes, setResumes] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    jobTitle: '',
    company: '',
    jobDescription: '',
    resumeId: '',
    senderName: '',
    senderEmail: '',
    senderPhone: '',
    whyInterested: '',
    relevantExperience: '',
    keyStrengths: '',
    tone: 'professional',
  });

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
    }
  };

  const handleGenerate = async () => {
    if (!formData.jobTitle || !formData.company || !formData.jobDescription || !formData.senderName) {
      alert('Please fill in all required fields');
      return;
    }

    setGenerating(true);
    try {
      const result = await api.generateCoverLetter(token, formData);
      setGeneratedContent(result.content);
    } catch (error) {
      console.error('Error generating cover letter:', error);
      alert('Failed to generate cover letter. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!generatedContent) {
      alert('Please generate a cover letter first');
      return;
    }

    setSaving(true);
    try {
      const coverLetterData = {
        title: formData.title || `${formData.jobTitle} Cover Letter`,
        jobTitle: formData.jobTitle,
        company: formData.company,
        jobDescription: formData.jobDescription,
        content: generatedContent,
        senderName: formData.senderName,
        senderEmail: formData.senderEmail,
        senderPhone: formData.senderPhone,
        tone: formData.tone,
      };

      const created = await api.createCoverLetter(token, coverLetterData);
      alert('Cover letter saved successfully!');
      router.push(`/career/cover-letter/${created.id}`);
    } catch (error) {
      console.error('Error saving cover letter:', error);
      alert('Failed to save cover letter. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/career')}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                ← Back
              </button>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Generate Cover Letter
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Job Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.jobTitle}
                    onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                    placeholder="e.g., Software Engineer"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="e.g., Google"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.jobDescription}
                    onChange={(e) => setFormData({ ...formData, jobDescription: e.target.value })}
                    placeholder="Paste the job description here..."
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Your Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.senderName}
                    onChange={(e) => setFormData({ ...formData, senderName: e.target.value })}
                    placeholder="John Doe"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.senderEmail}
                    onChange={(e) => setFormData({ ...formData, senderEmail: e.target.value })}
                    placeholder="john@example.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Link Resume (Optional)
                  </label>
                  <select
                    value={formData.resumeId}
                    onChange={(e) => setFormData({ ...formData, resumeId: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">-- None --</option>
                    {resumes.map((resume) => (
                      <option key={resume.id} value={resume.id}>
                        {resume.title}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Linking a resume helps AI generate more personalized content
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Customization</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Why are you interested?
                  </label>
                  <textarea
                    value={formData.whyInterested}
                    onChange={(e) => setFormData({ ...formData, whyInterested: e.target.value })}
                    placeholder="What excites you about this company/role?"
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Relevant Experience
                  </label>
                  <textarea
                    value={formData.relevantExperience}
                    onChange={(e) => setFormData({ ...formData, relevantExperience: e.target.value })}
                    placeholder="Key experiences relevant to this role..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tone</label>
                  <select
                    value={formData.tone}
                    onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="professional">Professional</option>
                    <option value="enthusiastic">Enthusiastic</option>
                    <option value="formal">Formal</option>
                    <option value="creative">Creative</option>
                  </select>
                </div>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 font-bold text-lg shadow-lg hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⚡</span>
                  Generating with AI...
                </span>
              ) : (
                '✨ Generate Cover Letter'
              )}
            </button>
          </div>

          {/* Preview Section */}
          <div className="lg:sticky lg:top-24 lg:h-fit">
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Generated Letter</h2>
                {generatedContent && (
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : '✓ Save'}
                  </button>
                )}
              </div>

              {!generatedContent ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">✉️</div>
                  <p className="text-gray-600 mb-2">No letter generated yet</p>
                  <p className="text-sm text-gray-500">
                    Fill in the form and click "Generate Cover Letter"
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Letter Header */}
                  <div className="border-b pb-4">
                    <p className="text-sm text-gray-600">{formData.senderName}</p>
                    {formData.senderEmail && (
                      <p className="text-sm text-gray-600">{formData.senderEmail}</p>
                    )}
                    {formData.senderPhone && (
                      <p className="text-sm text-gray-600">{formData.senderPhone}</p>
                    )}
                    <p className="text-sm text-gray-600 mt-4">{new Date().toLocaleDateString()}</p>
                    <p className="text-sm text-gray-600 mt-2">
                      Hiring Manager
                      <br />
                      {formData.company}
                    </p>
                  </div>

                  {/* Letter Content */}
                  <div className="prose prose-sm max-w-none">
                    <textarea
                      value={generatedContent}
                      onChange={(e) => setGeneratedContent(e.target.value)}
                      className="w-full h-96 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                      placeholder="Generated letter will appear here..."
                    />
                  </div>

                  <div className="border-t pt-4">
                    <p className="text-sm text-gray-600">
                      Sincerely,
                      <br />
                      {formData.senderName}
                    </p>
                  </div>

                  {/* Tips */}
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h3 className="font-semibold text-purple-900 mb-2">💡 Pro Tips:</h3>
                    <ul className="text-sm text-purple-800 space-y-1">
                      <li>• Review and personalize the generated content</li>
                      <li>• Add specific examples from your experience</li>
                      <li>• Check company name spelling and details</li>
                      <li>• Proofread before saving</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

