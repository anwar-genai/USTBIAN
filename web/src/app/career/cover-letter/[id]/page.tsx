'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';

export default function CoverLetterDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [token, setToken] = useState('');
  const [coverLetter, setCoverLetter] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      router.push('/login');
      return;
    }
    setToken(storedToken);
    loadCoverLetter(storedToken);
  }, [router, id]);

  const loadCoverLetter = async (authToken: string) => {
    try {
      const data = await api.getCoverLetter(authToken, id);
      setCoverLetter(data);
    } catch (error) {
      console.error('Error loading cover letter:', error);
      alert('Failed to load cover letter');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this cover letter?')) return;

    try {
      await api.deleteCoverLetter(token, id);
      alert('Cover letter deleted successfully');
      router.push('/career');
    } catch (error) {
      console.error('Error deleting cover letter:', error);
      alert('Failed to delete cover letter');
    }
  };

  const handleExport = () => {
    // Use browser print dialog (can save as PDF)
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading cover letter...</p>
        </div>
      </div>
    );
  }

  if (!coverLetter) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Cover letter not found</p>
          <button onClick={() => router.push('/career')} className="mt-4 text-purple-600 hover:underline">
            Go back
          </button>
        </div>
      </div>
    );
  }

  const formattedDate = coverLetter.dateWritten 
    ? new Date(coverLetter.dateWritten).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
      {/* Header - Hidden when printing */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => router.push('/career')} className="text-gray-600 hover:text-gray-900 transition-colors">
                ← Back
              </button>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {coverLetter.title}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
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
        {/* Cover Letter Preview - Printable */}
        <div className="bg-white rounded-2xl shadow-xl p-12 border border-gray-100 print:shadow-none print:border-0">
          <div className="space-y-8">
            {/* Sender Info */}
            <div>
              <p className="text-gray-900 font-medium">{coverLetter.senderName}</p>
              <p className="text-gray-600 text-sm">{coverLetter.senderEmail}</p>
              {coverLetter.senderPhone && <p className="text-gray-600 text-sm">{coverLetter.senderPhone}</p>}
              {coverLetter.senderAddress && <p className="text-gray-600 text-sm">{coverLetter.senderAddress}</p>}
            </div>

            {/* Date */}
            <div>
              <p className="text-gray-600 text-sm">{formattedDate}</p>
            </div>

            {/* Recipient Info */}
            <div>
              {coverLetter.recipientName && <p className="text-gray-900 font-medium">{coverLetter.recipientName}</p>}
              {coverLetter.recipientTitle && <p className="text-gray-600 text-sm">{coverLetter.recipientTitle}</p>}
              <p className="text-gray-900 font-medium">{coverLetter.company}</p>
              {coverLetter.companyAddress && <p className="text-gray-600 text-sm">{coverLetter.companyAddress}</p>}
            </div>

            {/* Subject */}
            <div>
              <p className="text-gray-900 font-semibold">
                Re: Application for {coverLetter.jobTitle}
              </p>
            </div>

            {/* Content */}
            <div className="prose prose-sm max-w-none">
              <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {coverLetter.content}
              </div>
            </div>

            {/* Closing */}
            <div>
              <p className="text-gray-900">Sincerely,</p>
              <p className="text-gray-900 font-medium mt-4">{coverLetter.senderName}</p>
            </div>
          </div>
        </div>

        {/* Metadata - Hidden when printing */}
        <div className="mt-8 bg-white rounded-2xl shadow-xl p-6 border border-gray-100 print:hidden">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Letter Details</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Job Title</p>
              <p className="font-semibold text-gray-900">{coverLetter.jobTitle}</p>
            </div>
            <div>
              <p className="text-gray-600">Company</p>
              <p className="font-semibold text-gray-900">{coverLetter.company}</p>
            </div>
            <div>
              <p className="text-gray-600">Tone</p>
              <p className="font-semibold text-gray-900 capitalize">{coverLetter.tone}</p>
            </div>
            <div>
              <p className="text-gray-600">Created</p>
              <p className="font-semibold text-gray-900">
                {new Date(coverLetter.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          {coverLetter.keyPoints && coverLetter.keyPoints.length > 0 && (
            <div className="mt-4">
              <p className="text-gray-600 mb-2">Key Points</p>
              <ul className="list-disc list-inside space-y-1">
                {coverLetter.keyPoints.map((point: string, i: number) => (
                  <li key={i} className="text-gray-700">{point}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
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

