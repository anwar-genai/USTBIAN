'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';

export default function ResumeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [token, setToken] = useState('');
  const [resume, setResume] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      router.push('/login');
      return;
    }
    setToken(storedToken);
    loadResume(storedToken);
  }, [router, id]);

  const loadResume = async (authToken: string) => {
    try {
      const data = await api.getResume(authToken, id);
      setResume(data);
    } catch (error) {
      console.error('Error loading resume:', error);
      alert('Failed to load resume');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this resume?')) return;

    try {
      await api.deleteResume(token, id);
      alert('Resume deleted successfully');
      router.push('/career');
    } catch (error) {
      console.error('Error deleting resume:', error);
      alert('Failed to delete resume');
    }
  };

  const handleExport = () => {
    // Use browser print dialog (can save as PDF)
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading resume...</p>
        </div>
      </div>
    );
  }

  if (!resume) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Resume not found</p>
          <button onClick={() => router.push('/career')} className="mt-4 text-blue-600 hover:underline">
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Header - Hidden when printing */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => router.push('/career')} className="text-gray-600 hover:text-gray-900 transition-colors">
                ← Back
              </button>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {resume.title}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push(`/career/resume/optimize`)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                🚀 Optimize
              </button>
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                📄 Export PDF
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 print:py-0">
        {/* Resume Preview - Printable */}
        <div className="bg-white rounded-2xl shadow-xl p-12 border border-gray-100 print:shadow-none print:border-0">
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center border-b-2 pb-6" style={{ borderColor: resume.accentColor }}>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{resume.fullName || 'Your Name'}</h1>
              <div className="flex justify-center flex-wrap gap-3 text-sm text-gray-600">
                {resume.email && <span>{resume.email}</span>}
                {resume.phone && <span>•</span>}
                {resume.phone && <span>{resume.phone}</span>}
                {resume.location && <span>•</span>}
                {resume.location && <span>{resume.location}</span>}
              </div>
              <div className="flex justify-center flex-wrap gap-3 mt-2 text-sm text-gray-600">
                {resume.linkedin && (
                  <a href={resume.linkedin} className="text-blue-600 hover:underline">LinkedIn</a>
                )}
                {resume.github && (
                  <a href={resume.github} className="text-blue-600 hover:underline">GitHub</a>
                )}
                {resume.website && (
                  <a href={resume.website} className="text-blue-600 hover:underline">Website</a>
                )}
              </div>
            </div>

            {/* Professional Summary */}
            {resume.summary && (
              <div>
                <h2 className="text-2xl font-bold mb-3" style={{ color: resume.accentColor }}>
                  Professional Summary
                </h2>
                <p className="text-gray-700 leading-relaxed">{resume.summary}</p>
              </div>
            )}

            {/* Experience */}
            {resume.experience?.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4" style={{ color: resume.accentColor }}>
                  Experience
                </h2>
                <div className="space-y-4">
                  {resume.experience.map((exp: any, i: number) => (
                    <div key={i}>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{exp.position}</h3>
                          <p className="text-gray-600">{exp.company}</p>
                        </div>
                        <span className="text-sm text-gray-500">
                          {exp.startDate} - {exp.endDate}
                        </span>
                      </div>
                      {exp.description && <p className="text-gray-700">{exp.description}</p>}
                      {exp.achievements?.length > 0 && (
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          {exp.achievements.map((achievement: string, j: number) => (
                            <li key={j} className="text-gray-700">{achievement}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {resume.education?.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4" style={{ color: resume.accentColor }}>
                  Education
                </h2>
                <div className="space-y-3">
                  {resume.education.map((edu: any, i: number) => (
                    <div key={i} className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {edu.degree} in {edu.field}
                        </h3>
                        <p className="text-gray-600">{edu.school}</p>
                        {edu.gpa && <p className="text-sm text-gray-500">GPA: {edu.gpa}</p>}
                      </div>
                      <span className="text-sm text-gray-500">
                        {edu.startDate} - {edu.endDate}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skills */}
            {resume.skills?.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-3" style={{ color: resume.accentColor }}>
                  Skills
                </h2>
                <div className="flex flex-wrap gap-2">
                  {resume.skills.map((skill: any, i: number) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium"
                    >
                      {skill.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Projects */}
            {resume.projects?.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4" style={{ color: resume.accentColor }}>
                  Projects
                </h2>
                <div className="space-y-4">
                  {resume.projects.map((project: any, i: number) => (
                    <div key={i}>
                      <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                      <p className="text-gray-700 mt-1">{project.description}</p>
                      {project.technologies?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {project.technologies.map((tech: string, j: number) => (
                            <span key={j} className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}
                      {project.url && (
                        <a href={project.url} className="text-blue-600 text-sm hover:underline mt-1 inline-block">
                          View Project →
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Certifications */}
            {resume.certifications?.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-3" style={{ color: resume.accentColor }}>
                  Certifications
                </h2>
                <ul className="list-disc list-inside space-y-1">
                  {resume.certifications.map((cert: string, i: number) => (
                    <li key={i} className="text-gray-700">{cert}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Optimization Score - Hidden when printing */}
        {resume.optimizationScore > 0 && (
          <div className="mt-8 bg-white rounded-2xl shadow-xl p-6 border border-gray-100 print:hidden">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Optimization Score</h3>
                <p className="text-sm text-gray-600">Based on AI analysis</p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold" style={{ color: resume.accentColor }}>
                  {resume.optimizationScore}%
                </div>
                <button
                  onClick={() => router.push('/career/resume/optimize')}
                  className="text-sm text-blue-600 hover:underline mt-1"
                >
                  Get suggestions →
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:border-0 {
            border: 0 !important;
          }
          .print\\:py-0 {
            padding-top: 0 !important;
            padding-bottom: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}

