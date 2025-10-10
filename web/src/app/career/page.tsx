'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { AppHeader } from '@/components/AppHeader';

export default function CareerDashboard() {
  const router = useRouter();
  const [token, setToken] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      router.push('/login');
      return;
    }
    setToken(storedToken);
  }, [router]);

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    // Check file type
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a PDF or Word document (.pdf, .docx, .doc)');
      return;
    }

    // Check file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://localhost:3000/career/resumes/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload failed:', errorText);
        
        // Try to parse as JSON to get better error message
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.message || 'Failed to upload resume');
        } catch {
          throw new Error(errorText || 'Failed to upload resume');
        }
      }

      const parsedData = await response.json();
      console.log('Parsed data received:', parsedData);
      
      // Check if parsing was successful
      if (parsedData.parsingSuccess === false) {
        console.warn('PDF parsing failed, but file was accepted');
        
        // Show a friendly message
        const userWantsToContinue = confirm(
          `✅ File uploaded successfully!\n\n` +
          `⚠️ We couldn't automatically extract data from your PDF.\n` +
          `This can happen with certain PDF formats.\n\n` +
          `Would you like to enter your information manually?\n` +
          `(You can type or copy-paste from your PDF)`
        );
        
        if (!userWantsToContinue) {
          setUploading(false);
          return;
        }
      }
      
      // Store parsed data and navigate to review page
      sessionStorage.setItem('parsedResume', JSON.stringify(parsedData));
      router.push('/career/resume/upload-review');
    } catch (error: any) {
      console.error('Upload error:', error);
      
      let errorMessage = 'Failed to upload resume. ';
      if (error.message.includes('Invalid file type')) {
        errorMessage = 'Invalid file type. Please upload a PDF or Word document (.pdf, .docx, .doc)';
      } else if (error.message.includes('AI service')) {
        errorMessage = 'AI service is temporarily unavailable. Please try again later or enter your information manually.';
      } else if (error.message.includes('PDF')) {
        errorMessage += 'There was an issue reading your PDF file. You can still enter your information manually.';
      } else if (error.message.includes('DOCX') || error.message.includes('Word')) {
        errorMessage += 'There was an issue reading your Word document. You can still enter your information manually.';
      } else {
        errorMessage += 'Please check your file and try again. Supported formats: PDF, DOCX';
      }
      
      alert(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <AppHeader />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Get Your Resume Ready for <span className="text-blue-600">Any Job</span>
          </h2>
          <p className="text-xl text-gray-600 mb-2">
            Upload your resume or CV and get instant AI-powered optimization
          </p>
          <p className="text-sm text-gray-500">
            💡 <strong>Resume vs CV?</strong> Both work! We optimize any format for job applications
          </p>
        </div>

        {/* Main Upload Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden mb-8 border border-gray-100">
          {/* Upload Area */}
          <div
            className={`p-12 border-4 border-dashed transition-all duration-300 ${
              dragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
            } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
          >
            <div className="text-center">
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-6"></div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                    Analyzing Your Resume...
                  </h3>
                  <p className="text-gray-600">
                    AI is extracting and optimizing your content
                  </p>
                </>
              ) : (
                <>
                  <div className="mb-6">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full mb-4">
                      <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    Drop your resume here
                  </h3>
                  <p className="text-gray-600 mb-6">
                    or click to browse files
                  </p>
                  
                  <label className="inline-block">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <span className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-lg cursor-pointer hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl inline-flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Choose File
                    </span>
                  </label>
                  
                  <p className="text-sm text-gray-500 mt-4">
                    Supports PDF and Word documents (.pdf, .docx, .doc)
                  </p>
                </>
              )}
            </div>
          </div>

          {/* What You'll Get */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-8">
            <h4 className="text-lg font-bold text-gray-900 mb-4 text-center">
              What You'll Get Instantly:
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-4 text-center">
                <div className="text-3xl mb-2">📊</div>
                <h5 className="font-semibold text-gray-900 mb-1">ATS Score</h5>
                <p className="text-sm text-gray-600">See how well your resume passes automated screening</p>
              </div>
              <div className="bg-white rounded-xl p-4 text-center">
                <div className="text-3xl mb-2">✨</div>
                <h5 className="font-semibold text-gray-900 mb-1">Smart Suggestions</h5>
                <p className="text-sm text-gray-600">Get specific tips to improve your resume</p>
              </div>
              <div className="bg-white rounded-xl p-4 text-center">
                <div className="text-3xl mb-2">🎯</div>
                <h5 className="font-semibold text-gray-900 mb-1">Optimized Version</h5>
                <p className="text-sm text-gray-600">Download improved, ATS-friendly resume</p>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Create from Scratch */}
          <button
            onClick={() => router.push('/career/resume/new')}
            className="bg-white rounded-2xl p-8 text-left hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-blue-300 group"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Start from Scratch</h3>
                <p className="text-gray-600 text-sm">Create a professional resume step by step with AI assistance</p>
              </div>
            </div>
          </button>

          {/* View My Resumes */}
          <button
            onClick={() => router.push('/career/resumes')}
            className="bg-white rounded-2xl p-8 text-left hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-purple-300 group"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2">My Resumes</h3>
                <p className="text-gray-600 text-sm">View and manage your saved resumes and scores</p>
              </div>
            </div>
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-12 text-center">
          <h4 className="text-lg font-semibold text-gray-900 mb-3">
            📚 Quick Tips for Students
          </h4>
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 text-left max-w-2xl mx-auto">
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold mt-1">→</span>
                <span><strong>Resume vs CV?</strong> In the US, a resume is 1-2 pages for jobs. A CV is longer and used for academic positions. For most jobs, upload your resume!</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold mt-1">→</span>
                <span><strong>ATS (Applicant Tracking System)</strong> is software that scans resumes. We optimize your resume to pass ATS and reach human recruiters.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold mt-1">→</span>
                <span><strong>File Format:</strong> PDF is best. Word documents (.docx) also work. Avoid images or fancy graphics.</span>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
