'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { AppHeader } from '@/components/AppHeader';

export default function ResumesListPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [resumes, setResumes] = useState<any[]>([]);
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

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100 border-green-300';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100 border-yellow-300';
    return 'text-red-600 bg-red-100 border-red-300';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <AppHeader />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          </div>
        ) : resumes.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="text-6xl mb-4">📄</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Resumes Yet</h2>
            <p className="text-gray-600 mb-6">Upload a resume or create one from scratch to get started</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => router.push('/career')}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
              >
                Upload Resume
              </button>
              <button
                onClick={() => router.push('/career/resume/new')}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Create New
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {resumes.map((resume) => (
              <button
                key={resume.id}
                onClick={() => router.push(`/career/resume/${resume.id}`)}
                className="w-full bg-white rounded-xl p-6 hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-blue-300 text-left group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {resume.title}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      {resume.fullName && <span>👤 {resume.fullName}</span>}
                      <span>📅 {new Date(resume.updatedAt).toLocaleDateString()}</span>
                    </div>
                    {resume.summary && (
                      <p className="text-gray-700 text-sm line-clamp-2">{resume.summary}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className={`px-4 py-2 rounded-full text-sm font-bold border-2 ${getScoreColor(resume.optimizationScore)}`}>
                      {resume.optimizationScore}% ATS
                    </div>
                    <span className="text-blue-600 font-medium text-sm group-hover:translate-x-1 transition-transform">
                      View →
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}


