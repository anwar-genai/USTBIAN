import jsPDF from 'jspdf';

export interface PDFResumeData {
  fullName: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  github?: string;
  website?: string;
  summary?: string;
  experience?: any[];
  education?: any[];
  skills?: any[];
  projects?: any[];
  certifications?: string[];
}

export type PDFTemplate = 'modern' | 'professional' | 'minimal' | 'creative';

export class ResumePDFGenerator {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number;
  private currentY: number;
  private accentColor: string;

  constructor(template: PDFTemplate = 'modern') {
    this.doc = new jsPDF();
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.margin = 20;
    this.currentY = this.margin;
    
    // Set accent color based on template
    this.accentColor = this.getAccentColor(template);
  }

  private getAccentColor(template: PDFTemplate): string {
    const colors: Record<PDFTemplate, string> = {
      modern: '#3B82F6',      // Blue
      professional: '#1F2937', // Dark Gray
      minimal: '#000000',      // Black
      creative: '#8B5CF6'      // Purple
    };
    const color = colors[template] || colors.modern;
    console.log(`Template: ${template} → Color: ${color}`);
    return color;
  }

  private hexToRGB(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : [0, 0, 0];
  }

  private checkPageBreak(height: number) {
    if (this.currentY + height > this.pageHeight - this.margin) {
      this.doc.addPage();
      this.currentY = this.margin;
    }
  }

  private addHeader(data: PDFResumeData) {
    // Get accent color once for the entire header
    const [r, g, b] = this.hexToRGB(this.accentColor);
    console.log(`Header color RGB: ${r}, ${g}, ${b}`);

    // Name - with accent color
    this.doc.setFontSize(24);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(r, g, b);
    this.doc.text(data.fullName || 'Your Name', this.pageWidth / 2, this.currentY, { align: 'center' });
    this.currentY += 8;

    // Contact Info
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(100, 100, 100);
    
    const contactInfo: string[] = [];
    if (data.email) contactInfo.push(data.email);
    if (data.phone) contactInfo.push(data.phone);
    if (data.location) contactInfo.push(data.location);
    
    const contactLine = contactInfo.join(' • ');
    this.doc.text(contactLine, this.pageWidth / 2, this.currentY, { align: 'center' });
    this.currentY += 5;

    // Links
    if (data.linkedin || data.github || data.website) {
      const links: string[] = [];
      if (data.linkedin) links.push(data.linkedin);
      if (data.github) links.push(data.github);
      if (data.website) links.push(data.website);
      
      this.doc.setFontSize(9);
      this.doc.setTextColor(59, 130, 246); // Blue for links
      this.doc.text(links.join(' • '), this.pageWidth / 2, this.currentY, { align: 'center' });
      this.currentY += 5;
    }

    // Horizontal line with accent color (reuse r, g, b from above)
    this.doc.setDrawColor(r, g, b);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    this.currentY += 8;
  }

  private addSection(title: string) {
    this.checkPageBreak(15);
    
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    
    // Force re-apply accent color for each section
    const [r, g, b] = this.hexToRGB(this.accentColor);
    this.doc.setTextColor(r, g, b);
    this.doc.text(title, this.margin, this.currentY);
    this.currentY += 3;

    // Underline with accent color
    this.doc.setDrawColor(r, g, b);
    this.doc.setLineWidth(0.3);
    this.doc.line(this.margin, this.currentY, this.margin + 40, this.currentY);
    this.currentY += 6;
  }

  private addParagraph(text: string, fontSize: number = 10) {
    this.doc.setFontSize(fontSize);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(60, 60, 60);

    const maxWidth = this.pageWidth - (2 * this.margin);
    const lines = this.doc.splitTextToSize(text, maxWidth);
    
    lines.forEach((line: string) => {
      this.checkPageBreak(6);
      this.doc.text(line, this.margin, this.currentY);
      this.currentY += 5;
    });
    this.currentY += 2;
  }

  private addSummary(summary: string) {
    if (!summary) return;
    this.addSection('PROFESSIONAL SUMMARY');
    this.addParagraph(summary);
  }

  private addExperience(experiences: any[]) {
    if (!experiences || experiences.length === 0) return;
    
    this.addSection('EXPERIENCE');

    experiences.forEach((exp, index) => {
      this.checkPageBreak(25);

      // Position & Company
      this.doc.setFontSize(11);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(40, 40, 40);
      this.doc.text(exp.position || 'Position', this.margin, this.currentY);
      this.currentY += 5;

      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(100, 100, 100);
      this.doc.text(exp.company || 'Company', this.margin, this.currentY);
      
      // Dates (right-aligned)
      const dateText = `${exp.startDate || 'Start'} - ${exp.endDate || 'End'}`;
      this.doc.text(dateText, this.pageWidth - this.margin, this.currentY, { align: 'right' });
      this.currentY += 6;

      // Description
      if (exp.description) {
        this.addParagraph(exp.description, 10);
      }

      // Achievements
      if (exp.achievements && exp.achievements.length > 0) {
        exp.achievements.forEach((achievement: string) => {
          this.checkPageBreak(6);
          this.doc.setFontSize(10);
          this.doc.setTextColor(60, 60, 60);
          this.doc.text('•', this.margin + 2, this.currentY);
          
          const maxWidth = this.pageWidth - (2 * this.margin) - 5;
          const lines = this.doc.splitTextToSize(achievement, maxWidth);
          lines.forEach((line: string, i: number) => {
            this.doc.text(line, this.margin + 7, this.currentY);
            if (i < lines.length - 1) {
              this.currentY += 5;
              this.checkPageBreak(5);
            }
          });
          this.currentY += 5;
        });
      }

      if (index < experiences.length - 1) {
        this.currentY += 3;
      }
    });
  }

  private addEducation(education: any[]) {
    if (!education || education.length === 0) return;
    
    this.addSection('EDUCATION');

    education.forEach((edu, index) => {
      this.checkPageBreak(15);

      // Degree
      this.doc.setFontSize(11);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(40, 40, 40);
      this.doc.text(`${edu.degree || 'Degree'} in ${edu.field || 'Field'}`, this.margin, this.currentY);
      this.currentY += 5;

      // School & Dates
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(100, 100, 100);
      this.doc.text(edu.school || 'School', this.margin, this.currentY);
      
      const dateText = `${edu.startDate || 'Start'} - ${edu.endDate || 'End'}`;
      this.doc.text(dateText, this.pageWidth - this.margin, this.currentY, { align: 'right' });
      this.currentY += 5;

      // GPA
      if (edu.gpa) {
        this.doc.setTextColor(60, 60, 60);
        this.doc.text(`GPA: ${edu.gpa}`, this.margin, this.currentY);
        this.currentY += 5;
      }

      if (index < education.length - 1) {
        this.currentY += 3;
      }
    });
  }

  private addSkills(skills: any[]) {
    if (!skills || skills.length === 0) return;
    
    this.addSection('SKILLS');

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(60, 60, 60);

    // Group skills by category if available
    const categorized: { [key: string]: string[] } = {};
    const uncategorized: string[] = [];

    skills.forEach(skill => {
      const skillName = typeof skill === 'string' ? skill : skill.name;
      const category = typeof skill === 'object' && skill.category ? skill.category : null;
      
      if (category && category !== 'General') {
        if (!categorized[category]) categorized[category] = [];
        categorized[category].push(skillName);
      } else {
        uncategorized.push(skillName);
      }
    });

    // Print categorized skills with better formatting
    Object.entries(categorized).forEach(([category, skillList]) => {
      this.checkPageBreak(8);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(40, 40, 40);
      this.doc.text(`${category}:`, this.margin, this.currentY);
      this.currentY += 5;
      
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(60, 60, 60);
      const maxWidth = this.pageWidth - (2 * this.margin);
      const skillText = skillList.join(' • ');
      const lines = this.doc.splitTextToSize(skillText, maxWidth);
      lines.forEach((line: string) => {
        this.checkPageBreak(5);
        this.doc.text(line, this.margin, this.currentY);
        this.currentY += 5;
      });
      this.currentY += 2;
    });

    // Print uncategorized skills in a nice grid
    if (uncategorized.length > 0) {
      this.checkPageBreak(8);
      const maxWidth = this.pageWidth - (2 * this.margin);
      const skillText = uncategorized.join(' • ');
      const lines = this.doc.splitTextToSize(skillText, maxWidth);
      lines.forEach((line: string) => {
        this.checkPageBreak(5);
        this.doc.text(line, this.margin, this.currentY);
        this.currentY += 5;
      });
    }

    this.currentY += 3;
  }

  private addProjects(projects: any[]) {
    if (!projects || projects.length === 0) return;
    
    this.addSection('PROJECTS');

    projects.forEach((project, index) => {
      this.checkPageBreak(20);

      // Project name
      this.doc.setFontSize(11);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(40, 40, 40);
      this.doc.text(project.name || 'Project Name', this.margin, this.currentY);
      this.currentY += 5;

      // Description
      if (project.description) {
        this.addParagraph(project.description, 10);
      }

      // Technologies
      if (project.technologies && project.technologies.length > 0) {
        this.doc.setFontSize(9);
        this.doc.setFont('helvetica', 'italic');
        this.doc.setTextColor(100, 100, 100);
        this.doc.text(`Technologies: ${project.technologies.join(', ')}`, this.margin, this.currentY);
        this.currentY += 6;
      }

      if (index < projects.length - 1) {
        this.currentY += 3;
      }
    });
  }

  private addCertifications(certifications: string[]) {
    if (!certifications || certifications.length === 0) return;
    
    this.addSection('CERTIFICATIONS');

    certifications.forEach(cert => {
      this.checkPageBreak(6);
      this.doc.setFontSize(10);
      this.doc.setTextColor(60, 60, 60);
      this.doc.text('•', this.margin + 2, this.currentY);
      this.doc.text(cert, this.margin + 7, this.currentY);
      this.currentY += 5;
    });
  }

  public generate(data: PDFResumeData, template: PDFTemplate = 'modern'): jsPDF {
    // Update accent color based on template
    this.accentColor = this.getAccentColor(template);
    
    console.log(`Generating PDF with template: ${template}, color: ${this.accentColor}`);
    
    // Add all sections in the requested order:
    // Summary → Skills → Projects → Education → Experience
    this.addHeader(data);
    this.addSummary(data.summary || '');
    this.addSkills(data.skills || []);
    this.addProjects(data.projects || []);
    this.addEducation(data.education || []);
    this.addExperience(data.experience || []);
    this.addCertifications(data.certifications || []);

    return this.doc;
  }

  public download(fileName: string = 'resume.pdf') {
    this.doc.save(fileName);
  }

  public getBlob(): Blob {
    return this.doc.output('blob');
  }

  public getDataUri(): string {
    return this.doc.output('datauristring');
  }
}

// Helper function to generate and download PDF
export function generateResumePDF(
  resumeData: PDFResumeData,
  fileName: string = 'resume.pdf',
  template: PDFTemplate = 'modern'
) {
  const generator = new ResumePDFGenerator(template);
  generator.generate(resumeData, template);
  generator.download(fileName);
}

