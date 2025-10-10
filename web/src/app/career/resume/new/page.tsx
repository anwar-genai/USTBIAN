'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { AppHeader } from '@/components/AppHeader';

type Step = 'basic' | 'education' | 'experience' | 'skills' | 'projects' | 'preview';

const STEPS: Step[] = ['basic', 'education', 'experience', 'skills', 'projects', 'preview'];

export default function NewResumePage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [currentStep, setCurrentStep] = useState<Step>('basic');
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  const [resumeData, setResumeData] = useState({
    title: '',
    fullName: '',
    email: '',
    phone: '',
    location: '',
    website: '',
    linkedin: '',
    github: '',
    summary: '',
    education: [] as any[],
    experience: [] as any[],
    skills: [] as any[],
    projects: [] as any[],
    certifications: [] as string[],
    template: 'modern',
    accentColor: '#3B82F6',
  });

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      router.push('/login');
      return;
    }
    setToken(storedToken);
  }, [router]);

  const handleAIGenerate = async () => {
    if (!resumeData.title) {
      alert('Please enter a resume title first');
      return;
    }

    setGenerating(true);
    try {
      const result = await api.generateResume(token, {
        targetRole: resumeData.title,
        industry: 'Technology',
        skills: resumeData.skills.map((s: any) => s.name),
        education: resumeData.education,
        experience: resumeData.experience,
      });

      setResumeData({
        ...resumeData,
        summary: result.summary,
        skills: [...resumeData.skills, ...result.suggestedSkills],
      });

      alert('AI content generated! Review the summary and skills sections.');
    } catch (error) {
      console.error('Error generating content:', error);
      alert('Failed to generate content. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    // Validate required fields
    if (!resumeData.title || resumeData.title.trim() === '') {
      alert('Please enter a resume title before saving.');
      return;
    }

    // Clean up data - convert empty strings to undefined for optional fields
    const cleanData = {
      ...resumeData,
      fullName: resumeData.fullName?.trim() || undefined,
      email: resumeData.email?.trim() || undefined,
      phone: resumeData.phone?.trim() || undefined,
      location: resumeData.location?.trim() || undefined,
      website: resumeData.website?.trim() || undefined,
      linkedin: resumeData.linkedin?.trim() || undefined,
      github: resumeData.github?.trim() || undefined,
      summary: resumeData.summary?.trim() || undefined,
    };

    console.log('Saving resume data:', cleanData);
    setSaving(true);
    try {
      const created = await api.createResume(token, cleanData);
      console.log('Resume created:', created);
      alert('Resume saved successfully!');
      router.push(`/career/resume/${created.id}`);
    } catch (error: any) {
      console.error('Error saving resume:', error);
      console.error('Error details:', error.message);
      alert(`Failed to save resume: ${error.message || 'Please try again.'}`);
    } finally {
      setSaving(false);
    }
  };

  const stepIndex = STEPS.indexOf(currentStep);
  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <AppHeader />
      
      {/* Breadcrumb Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/career')}
              className="text-gray-600 hover:text-gray-900 transition-colors text-sm"
            >
              ← Back to Career
            </button>
            <div className="h-4 w-px bg-gray-300"></div>
            <h2 className="text-lg font-semibold text-gray-700">
              Create Resume - Step {stepIndex + 1} of {STEPS.length}
            </h2>
          </div>
          <button
            onClick={handleAIGenerate}
            disabled={generating}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 font-medium disabled:opacity-50 flex items-center gap-2"
          >
              {generating ? (
                <>
                  <span className="animate-spin">⚡</span>
                  Generating...
                </>
              ) : (
                <>
                  ✨ AI Generate
                </>
              )}
            </button>
          </div>
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-600">
              {STEPS.map((step) => (
                <span
                  key={step}
                  className={`capitalize ${STEPS.indexOf(step) <= stepIndex ? 'text-blue-600 font-semibold' : ''}`}
                >
                  {step}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {currentStep === 'basic' && (
            <BasicInfoStep resumeData={resumeData} setResumeData={setResumeData} />
          )}
          {currentStep === 'education' && (
            <EducationStep resumeData={resumeData} setResumeData={setResumeData} />
          )}
          {currentStep === 'experience' && (
            <ExperienceStep resumeData={resumeData} setResumeData={setResumeData} />
          )}
          {currentStep === 'skills' && (
            <SkillsStep resumeData={resumeData} setResumeData={setResumeData} />
          )}
          {currentStep === 'projects' && (
            <ProjectsStep resumeData={resumeData} setResumeData={setResumeData} />
          )}
          {currentStep === 'preview' && (
            <PreviewStep resumeData={resumeData} />
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-8 border-t border-gray-200">
            <button
              onClick={() => {
                const prevIndex = Math.max(0, stepIndex - 1);
                setCurrentStep(STEPS[prevIndex]);
              }}
              disabled={stepIndex === 0}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Previous
            </button>

            {stepIndex < STEPS.length - 1 ? (
              <button
                onClick={() => {
                  const nextIndex = Math.min(STEPS.length - 1, stepIndex + 1);
                  setCurrentStep(STEPS[nextIndex]);
                }}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-medium"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-300 font-medium disabled:opacity-50"
              >
                {saving ? 'Saving...' : '✓ Save Resume'}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function BasicInfoStep({ resumeData, setResumeData }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Basic Information</h2>
        <p className="text-gray-600">Let's start with your personal details</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Resume Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={resumeData.title}
            onChange={(e) => setResumeData({ ...resumeData, title: e.target.value })}
            placeholder="e.g., Software Engineer Resume"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
          <input
            type="text"
            value={resumeData.fullName}
            onChange={(e) => setResumeData({ ...resumeData, fullName: e.target.value })}
            placeholder="John Doe"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <input
            type="email"
            value={resumeData.email}
            onChange={(e) => setResumeData({ ...resumeData, email: e.target.value })}
            placeholder="john@example.com"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
          <input
            type="tel"
            value={resumeData.phone}
            onChange={(e) => setResumeData({ ...resumeData, phone: e.target.value })}
            placeholder="+1 (555) 123-4567"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
          <input
            type="text"
            value={resumeData.location}
            onChange={(e) => setResumeData({ ...resumeData, location: e.target.value })}
            placeholder="San Francisco, CA"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn</label>
          <input
            type="url"
            value={resumeData.linkedin}
            onChange={(e) => setResumeData({ ...resumeData, linkedin: e.target.value })}
            placeholder="https://linkedin.com/in/johndoe"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">GitHub</label>
          <input
            type="url"
            value={resumeData.github}
            onChange={(e) => setResumeData({ ...resumeData, github: e.target.value })}
            placeholder="https://github.com/johndoe"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Professional Summary
          </label>
          <textarea
            value={resumeData.summary}
            onChange={(e) => setResumeData({ ...resumeData, summary: e.target.value })}
            placeholder="Write a compelling summary of your professional background..."
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            Tip: Use the AI Generate button to create a professional summary
          </p>
        </div>
      </div>
    </div>
  );
}

function EducationStep({ resumeData, setResumeData }: any) {
  const addEducation = () => {
    setResumeData({
      ...resumeData,
      education: [
        ...resumeData.education,
        { school: '', degree: '', field: '', startDate: '', endDate: '', gpa: '', achievements: [] },
      ],
    });
  };

  const removeEducation = (index: number) => {
    setResumeData({
      ...resumeData,
      education: resumeData.education.filter((_: any, i: number) => i !== index),
    });
  };

  const updateEducation = (index: number, field: string, value: any) => {
    const updated = [...resumeData.education];
    updated[index] = { ...updated[index], [field]: value };
    setResumeData({ ...resumeData, education: updated });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Education</h2>
          <p className="text-gray-600">Add your educational background</p>
        </div>
        <button
          onClick={addEducation}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          + Add Education
        </button>
      </div>

      {resumeData.education.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No education added yet. Click "+ Add Education" to get started.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {resumeData.education.map((edu: any, index: number) => (
            <div key={index} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-semibold text-gray-900">Education #{index + 1}</h3>
                <button
                  onClick={() => removeEducation(index)}
                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  Remove
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">School/University</label>
                  <input
                    type="text"
                    value={edu.school}
                    onChange={(e) => updateEducation(index, 'school', e.target.value)}
                    placeholder="Stanford University"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Degree</label>
                  <input
                    type="text"
                    value={edu.degree}
                    onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                    placeholder="Bachelor of Science"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Field of Study</label>
                  <input
                    type="text"
                    value={edu.field}
                    onChange={(e) => updateEducation(index, 'field', e.target.value)}
                    placeholder="Computer Science"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <input
                    type="text"
                    value={edu.startDate}
                    onChange={(e) => updateEducation(index, 'startDate', e.target.value)}
                    placeholder="2018"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                  <input
                    type="text"
                    value={edu.endDate}
                    onChange={(e) => updateEducation(index, 'endDate', e.target.value)}
                    placeholder="2022"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ExperienceStep({ resumeData, setResumeData }: any) {
  const addExperience = () => {
    setResumeData({
      ...resumeData,
      experience: [
        ...resumeData.experience,
        { company: '', position: '', startDate: '', endDate: '', current: false, description: '', achievements: [] },
      ],
    });
  };

  const removeExperience = (index: number) => {
    setResumeData({
      ...resumeData,
      experience: resumeData.experience.filter((_: any, i: number) => i !== index),
    });
  };

  const updateExperience = (index: number, field: string, value: any) => {
    const updated = [...resumeData.experience];
    updated[index] = { ...updated[index], [field]: value };
    setResumeData({ ...resumeData, experience: updated });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Work Experience</h2>
          <p className="text-gray-600">Add your professional experience</p>
        </div>
        <button
          onClick={addExperience}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          + Add Experience
        </button>
      </div>

      {resumeData.experience.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No experience added yet. Click "+ Add Experience" to get started.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {resumeData.experience.map((exp: any, index: number) => (
            <div key={index} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-semibold text-gray-900">Experience #{index + 1}</h3>
                <button
                  onClick={() => removeExperience(index)}
                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  Remove
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                  <input
                    type="text"
                    value={exp.company}
                    onChange={(e) => updateExperience(index, 'company', e.target.value)}
                    placeholder="Google"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
                  <input
                    type="text"
                    value={exp.position}
                    onChange={(e) => updateExperience(index, 'position', e.target.value)}
                    placeholder="Software Engineer"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <input
                    type="text"
                    value={exp.startDate}
                    onChange={(e) => updateExperience(index, 'startDate', e.target.value)}
                    placeholder="Jan 2022"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                  <input
                    type="text"
                    value={exp.endDate}
                    onChange={(e) => updateExperience(index, 'endDate', e.target.value)}
                    placeholder="Present"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={exp.description}
                    onChange={(e) => updateExperience(index, 'description', e.target.value)}
                    placeholder="Describe your role and responsibilities..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SkillsStep({ resumeData, setResumeData }: any) {
  const [newSkill, setNewSkill] = useState({ name: '', level: 'intermediate', category: '' });

  const addSkill = () => {
    if (newSkill.name) {
      setResumeData({
        ...resumeData,
        skills: [...resumeData.skills, newSkill],
      });
      setNewSkill({ name: '', level: 'intermediate', category: '' });
    }
  };

  const removeSkill = (index: number) => {
    setResumeData({
      ...resumeData,
      skills: resumeData.skills.filter((_: any, i: number) => i !== index),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Skills</h2>
        <p className="text-gray-600">Add your technical and soft skills</p>
      </div>

      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-4">Add New Skill</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <input
              type="text"
              value={newSkill.name}
              onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
              placeholder="e.g., React, Python, Communication"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && addSkill()}
            />
          </div>
          <button
            onClick={addSkill}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Add Skill
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {resumeData.skills.map((skill: any, index: number) => (
          <div
            key={index}
            className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-full border border-blue-200"
          >
            <span className="font-medium">{skill.name}</span>
            <button
              onClick={() => removeSkill(index)}
              className="hover:text-red-600 font-bold"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {resumeData.skills.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>No skills added yet. Add your first skill above.</p>
        </div>
      )}
    </div>
  );
}

function ProjectsStep({ resumeData, setResumeData }: any) {
  const addProject = () => {
    setResumeData({
      ...resumeData,
      projects: [
        ...resumeData.projects,
        { name: '', description: '', technologies: [], url: '' },
      ],
    });
  };

  const removeProject = (index: number) => {
    setResumeData({
      ...resumeData,
      projects: resumeData.projects.filter((_: any, i: number) => i !== index),
    });
  };

  const updateProject = (index: number, field: string, value: any) => {
    const updated = [...resumeData.projects];
    updated[index] = { ...updated[index], [field]: value };
    setResumeData({ ...resumeData, projects: updated });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Projects</h2>
          <p className="text-gray-600">Showcase your best work</p>
        </div>
        <button
          onClick={addProject}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          + Add Project
        </button>
      </div>

      {resumeData.projects.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No projects added yet. Click "+ Add Project" to get started.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {resumeData.projects.map((project: any, index: number) => (
            <div key={index} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-semibold text-gray-900">Project #{index + 1}</h3>
                <button
                  onClick={() => removeProject(index)}
                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  Remove
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Project Name</label>
                  <input
                    type="text"
                    value={project.name}
                    onChange={(e) => updateProject(index, 'name', e.target.value)}
                    placeholder="E-commerce Platform"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={project.description}
                    onChange={(e) => updateProject(index, 'description', e.target.value)}
                    placeholder="Describe your project..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">URL (Optional)</label>
                  <input
                    type="url"
                    value={project.url}
                    onChange={(e) => updateProject(index, 'url', e.target.value)}
                    placeholder="https://github.com/..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PreviewStep({ resumeData }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Preview</h2>
        <p className="text-gray-600">Review your resume before saving</p>
      </div>

      <div className="bg-white border-2 border-gray-200 rounded-xl p-8 shadow-lg">
        {/* Resume Preview */}
        <div className="space-y-6">
          <div className="text-center border-b-2 pb-6" style={{ borderColor: resumeData.accentColor }}>
            <h1 className="text-3xl font-bold text-gray-900">{resumeData.fullName || 'Your Name'}</h1>
            <div className="flex justify-center gap-4 mt-2 text-sm text-gray-600">
              {resumeData.email && <span>{resumeData.email}</span>}
              {resumeData.phone && <span>•</span>}
              {resumeData.phone && <span>{resumeData.phone}</span>}
              {resumeData.location && <span>•</span>}
              {resumeData.location && <span>{resumeData.location}</span>}
            </div>
          </div>

          {resumeData.summary && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2" style={{ color: resumeData.accentColor }}>
                Professional Summary
              </h2>
              <p className="text-gray-700">{resumeData.summary}</p>
            </div>
          )}

          {resumeData.experience.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-3" style={{ color: resumeData.accentColor }}>
                Experience
              </h2>
              <div className="space-y-4">
                {resumeData.experience.map((exp: any, i: number) => (
                  <div key={i}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900">{exp.position}</h3>
                        <p className="text-gray-600">{exp.company}</p>
                      </div>
                      <span className="text-sm text-gray-500">
                        {exp.startDate} - {exp.endDate}
                      </span>
                    </div>
                    {exp.description && <p className="text-gray-700 mt-2">{exp.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {resumeData.education.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-3" style={{ color: resumeData.accentColor }}>
                Education
              </h2>
              <div className="space-y-3">
                {resumeData.education.map((edu: any, i: number) => (
                  <div key={i} className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-900">{edu.degree} in {edu.field}</h3>
                      <p className="text-gray-600">{edu.school}</p>
                    </div>
                    <span className="text-sm text-gray-500">
                      {edu.startDate} - {edu.endDate}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {resumeData.skills.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-3" style={{ color: resumeData.accentColor }}>
                Skills
              </h2>
              <div className="flex flex-wrap gap-2">
                {resumeData.skills.map((skill: any, i: number) => (
                  <span key={i} className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                    {skill.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {resumeData.projects.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-3" style={{ color: resumeData.accentColor }}>
                Projects
              </h2>
              <div className="space-y-3">
                {resumeData.projects.map((project: any, i: number) => (
                  <div key={i}>
                    <h3 className="font-semibold text-gray-900">{project.name}</h3>
                    <p className="text-gray-700">{project.description}</p>
                    {project.url && (
                      <a href={project.url} className="text-blue-600 text-sm hover:underline">
                        View Project →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

