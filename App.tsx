import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Chat, Type } from "@google/genai";
import { Loader2, Briefcase, FileText, UserCheck, Compass, Target, Sparkles, Send, RefreshCw, Upload, Download, X, CheckCircle, Printer, Globe, Mail, Phone, MapPin, Linkedin, AlertCircle, Plus, Edit3, GitBranch, MessageSquare, ChevronDown, ChevronUp, GraduationCap, Wrench, BookOpen, Lightbulb, User, Camera, Settings, Palette, LayoutTemplate, Moon, Sun, Languages, Image as ImageIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// --- Configuration & Constants ---
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Enum for Tabs
enum Tab {
  HOME = 'HOME',
  RESUME = 'RESUME',
  INTERVIEW = 'INTERVIEW',
  CAREER = 'CAREER',
  ATS = 'ATS',
  IMAGES = 'IMAGES'
}

// Translations
const translations = {
  ar: {
    appTitle: 'مساري',
    home: 'الرئيسية',
    resume: 'السيرة الذاتية',
    interview: 'المقابلة',
    career: 'المسار الوظيفي',
    ats: 'ATS',
    images: 'توليد صور',
    settings: 'الإعدادات',
    theme: 'المظهر',
    language: 'اللغة',
    light: 'فاتح',
    dark: 'داكن',
    arabic: 'العربية',
    english: 'English',
    developedBy: 'تم التطوير بواسطة الذكاء الاصطناعي - 2024',
    close: 'إغلاق',
    analyze: 'تحليل',
    uploadResume: 'ارفع سيرتك الذاتية',
    interviewPrep: 'التحضير للمقابلة',
    startChat: 'ابدأ المحادثة',
    typeMessage: 'اكتب رسالتك...',
    careerPath: 'تحليل المسار الوظيفي',
    atsCheck: 'فحص التوافق (ATS)',
    jobDescription: 'الوصف الوظيفي',
    pasteJob: 'الصق الوصف الوظيفي هنا',
    results: 'النتائج',
    generateImage: 'توليد صورة',
    imagePromptPlaceholder: 'وصف الصورة (مثال: شعار لمطور برمجيات...)',
    imageSize: 'حجم الصورة',
    generating: 'جاري التوليد...',
  },
  en: {
    appTitle: 'Masari',
    home: 'Home',
    resume: 'Resume',
    interview: 'Interview',
    career: 'Career Path',
    ats: 'ATS Check',
    images: 'Generate Images',
    settings: 'Settings',
    theme: 'Theme',
    language: 'Language',
    light: 'Light',
    dark: 'Dark',
    arabic: 'العربية',
    english: 'English',
    developedBy: 'Powered by AI - 2024',
    close: 'Close',
    analyze: 'Analyze',
    uploadResume: 'Upload your Resume',
    interviewPrep: 'Interview Prep',
    startChat: 'Start Chatting',
    typeMessage: 'Type your message...',
    careerPath: 'Career Path Analysis',
    atsCheck: 'ATS Check',
    jobDescription: 'Job Description',
    pasteJob: 'Paste job description here',
    results: 'Results',
    generateImage: 'Generate Image',
    imagePromptPlaceholder: 'Image description (e.g. A logo for a software developer...)',
    imageSize: 'Image Size',
    generating: 'Generating...',
  }
};

// Data Interfaces
interface ResumeData {
  fullName: string;
  title: string;
  contact: {
    phone: string;
    email: string;
    linkedin: string;
    location?: string;
  };
  summary: string;
  education: Array<{
    degree: string;
    school: string;
    year: string;
  }>;
  experience: Array<{
    role: string;
    company: string;
    date: string;
    points: string[];
  }>;
  skills: string[];
  courses?: Array<{ name: string }>;
  volunteering?: Array<{ title: string; points: string[] }>;
}

interface AnalysisData {
  atsScore: number;
  atsLog: string[];
  suggestedRoles: string[];
  interviewPrep: Array<{
    question: string;
    focusArea: string;
    tip: string;
  }>;
}

interface FullResponse {
  resume: ResumeData;
  analysis: AnalysisData;
}

// --- Helper Functions ---
const readFileAsBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// --- Helper Components ---

// Button Component
const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { 
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}> = ({ 
  className = '', 
  variant = 'primary', 
  size = 'md',
  children, 
  ...props 
}) => {
  const baseStyles = "rounded-lg font-bold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed print:hidden";
  const variants = {
    primary: "bg-primary text-white hover:brightness-90 shadow-sm", 
    secondary: "bg-[var(--color-secondary)] text-white hover:opacity-90 shadow-sm",
    outline: "border-2 border-[var(--color-border)] hover:border-primary hover:text-primary text-[var(--color-text-secondary)] bg-[var(--color-card)]",
    ghost: "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]"
  };
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-6 py-2.5",
    lg: "px-8 py-3 text-lg"
  };

  return (
    <button className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
};

// Card Component
const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-[var(--color-card)] rounded-2xl p-6 shadow-sm border border-[var(--color-border)] ${className} print:shadow-none print:p-0 print:border-none`}>
    {children}
  </div>
);

// Loading Spinner
const LoadingState: React.FC<{ message?: string }> = ({ message = "جاري المعالجة..." }) => (
  <div className="flex flex-col items-center justify-center py-12 text-[var(--color-text-muted)]">
    <Loader2 className="w-8 h-8 animate-spin mb-3 text-primary" />
    <p>{message}</p>
  </div>
);

// File Upload Component
const FileUploader: React.FC<{ 
  label: string; 
  accept?: string; 
  onFileSelect: (file: File) => void; 
  selectedFile: File | null;
  onClear: () => void;
}> = ({ label, accept = ".pdf,.txt,.doc,.docx,image/*", onFileSelect, selectedFile, onClear }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-2 print:hidden">
      <label className="block text-sm font-bold text-[var(--color-text-main)]">{label}</label>
      
      {!selectedFile ? (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-[var(--color-border)] rounded-2xl p-8 text-center hover:border-primary hover:bg-[var(--color-primary-light)] transition-colors cursor-pointer group bg-[var(--color-card)]"
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept={accept} 
            onChange={(e) => e.target.files?.[0] && onFileSelect(e.target.files[0])} 
          />
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-[var(--color-primary-light)] text-primary rounded-full group-hover:scale-110 transition-transform">
              <Upload className="w-6 h-6" />
            </div>
          </div>
          <p className="text-[var(--color-text-main)] font-bold mb-1">اضغط للرفع أو اسحب الملف هنا</p>
          <p className="text-[var(--color-text-muted)] text-sm">ندعم PDF, الصور, والملفات النصية</p>
        </div>
      ) : (
        <div className="flex items-center justify-between p-4 bg-[var(--color-primary-light)] border border-[var(--color-border)] rounded-lg">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2 bg-[var(--color-card)] text-primary rounded-lg shadow-sm">
              <FileText className="w-5 h-5" />
            </div>
            <div className="truncate">
              <p className="font-bold text-[var(--color-text-main)] truncate">{selectedFile.name}</p>
              <p className="text-xs text-primary">{(selectedFile.size / 1024).toFixed(1)} KB</p>
            </div>
          </div>
          <button onClick={onClear} className="p-1 hover:bg-[var(--color-card)] rounded-full text-primary hover:text-[#EF4444] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};

// Resume Template Component (A4 Style)
const ResumeTemplate: React.FC<{ data: ResumeData; language: 'ar' | 'en' }> = ({ data, language }) => {
  const isRTL = language === 'ar';
  
  return (
    <div 
      className={`bg-white mx-auto text-[#1E293B] shadow-lg print:shadow-none print:w-full print:absolute print:top-0 print:left-0 print:m-0`}
      style={{ 
        width: '210mm', 
        minHeight: '297mm', 
        padding: '15mm 20mm',
        direction: isRTL ? 'rtl' : 'ltr',
        fontFamily: isRTL ? 'Cairo, sans-serif' : 'Arial, sans-serif'
      }}
    >
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold uppercase tracking-wide text-[#4F46E5] mb-2">{data.fullName}</h1>
        <h2 className="text-xl text-[#64748B] font-medium uppercase tracking-wider">{data.title}</h2>
        
        <div className="flex flex-wrap justify-center items-center gap-4 mt-4 text-sm text-[#475569] border-t border-b border-[#E2E8F0] py-3">
          {data.contact.phone && (
            <div className="flex items-center gap-1">
              <Phone className="w-3 h-3 text-[#4F46E5]" />
              <span>{data.contact.phone}</span>
            </div>
          )}
          {data.contact.email && (
            <div className="flex items-center gap-1">
              <Mail className="w-3 h-3 text-[#4F46E5]" />
              <span>{data.contact.email}</span>
            </div>
          )}
          {data.contact.linkedin && (
            <div className="flex items-center gap-1">
              <Linkedin className="w-3 h-3 text-[#4F46E5]" />
              <span>{data.contact.linkedin}</span>
            </div>
          )}
           {data.contact.location && (
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-[#4F46E5]" />
              <span>{data.contact.location}</span>
            </div>
          )}
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-6">
        {/* Summary */}
        {data.summary && (
          <section>
            <h3 className="text-lg font-bold uppercase border-b-2 border-[#4F46E5] pb-1 mb-3 tracking-wide text-[#4F46E5]">
              {isRTL ? 'الملخص المهني' : 'Profile Summary'}
            </h3>
            <p className="text-[#1E293B] leading-relaxed text-justify text-sm">
              {data.summary}
            </p>
          </section>
        )}

        {/* Education */}
        {data.education && data.education.length > 0 && (
          <section>
            <h3 className="text-lg font-bold uppercase border-b-2 border-[#4F46E5] pb-1 mb-3 tracking-wide text-[#4F46E5]">
              {isRTL ? 'التعليم' : 'Education'}
            </h3>
            <div className="space-y-3">
              {data.education.map((edu, idx) => (
                <div key={idx}>
                  <div className="flex justify-between items-baseline mb-1">
                    <h4 className="font-bold text-[#1E293B]">{edu.school}</h4>
                    <span className="text-sm text-[#475569]">{edu.year}</span>
                  </div>
                  <p className="text-[#475569] font-medium">{edu.degree}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Experience */}
        {data.experience && data.experience.length > 0 && (
          <section>
            <h3 className="text-lg font-bold uppercase border-b-2 border-[#4F46E5] pb-1 mb-3 tracking-wide text-[#4F46E5]">
               {isRTL ? 'الخبرات العملية' : 'Work Experience'}
            </h3>
            <div className="space-y-4">
              {data.experience.map((exp, idx) => (
                <div key={idx}>
                   <div className="flex justify-between items-baseline mb-1">
                    <h4 className="font-bold text-[#1E293B] text-md">{exp.role}</h4>
                    <span className="text-sm text-[#475569] font-medium">{exp.date}</span>
                  </div>
                  <div className="text-[#64748B] italic mb-2">{exp.company}</div>
                  <ul className={`list-disc ${isRTL ? 'mr-5' : 'ml-5'} text-sm text-[#1E293B] space-y-1`}>
                    {exp.points.map((point, pIdx) => (
                      <li key={pIdx}>{point}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Skills */}
        {data.skills && data.skills.length > 0 && (
          <section>
            <h3 className="text-lg font-bold uppercase border-b-2 border-[#4F46E5] pb-1 mb-3 tracking-wide text-[#4F46E5]">
               {isRTL ? 'المهارات' : 'Skills'}
            </h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2">
               {data.skills.map((skill, idx) => (
                 <div key={idx} className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 bg-[#4F46E5] rounded-full"></div>
                   <span className="text-sm text-[#1E293B]">{skill}</span>
                 </div>
               ))}
            </div>
          </section>
        )}

        {/* Courses/Certificates */}
        {data.courses && data.courses.length > 0 && (
          <section>
            <h3 className="text-lg font-bold uppercase border-b-2 border-[#4F46E5] pb-1 mb-3 tracking-wide text-[#4F46E5]">
               {isRTL ? 'الدورات والشهادات' : 'Courses & Certificates'}
            </h3>
             <ul className={`list-disc ${isRTL ? 'mr-5' : 'ml-5'} text-sm text-[#1E293B] space-y-1`}>
               {data.courses.map((course, idx) => (
                 <li key={idx}>{course.name}</li>
               ))}
             </ul>
          </section>
        )}

        {/* Volunteering */}
        {data.volunteering && data.volunteering.length > 0 && (
          <section>
            <h3 className="text-lg font-bold uppercase border-b-2 border-[#4F46E5] pb-1 mb-3 tracking-wide text-[#4F46E5]">
               {isRTL ? 'التطوع والتدريب' : 'Volunteering & Training'}
            </h3>
            <div className="space-y-3">
              {data.volunteering.map((vol, idx) => (
                <div key={idx}>
                  <h4 className="font-bold text-sm mb-1 text-[#1E293B]">{vol.title}</h4>
                   <ul className={`list-disc ${isRTL ? 'mr-5' : 'ml-5'} text-sm text-[#1E293B] space-y-1`}>
                    {vol.points.map((p, pIdx) => <li key={pIdx}>{p}</li>)}
                   </ul>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
};

// Visual Concept Map Component
const CareerMap: React.FC<{ data: AnalysisData }> = ({ data }) => {
  return (
    <div className="space-y-8">
      {/* 1. Job Titles Node */}
      <div className="relative border-r-4 border-[var(--color-primary-light)] pr-6 mr-4">
         <div className="absolute -right-3 top-0 bg-primary rounded-full w-6 h-6 flex items-center justify-center text-white">
           <Briefcase className="w-3 h-3" />
         </div>
         <h4 className="font-bold text-lg text-primary mb-3">المسميات الوظيفية المناسبة (Job Titles)</h4>
         <div className="flex flex-wrap gap-2">
            {data.suggestedRoles.map((role, i) => (
              <span key={i} className="px-3 py-1 bg-[var(--color-primary-light)] text-primary rounded-full text-sm border border-[var(--color-border)]" dir="auto">
                {role}
              </span>
            ))}
         </div>
         <p className="text-xs text-[var(--color-text-muted)] mt-2">بناءً على مهاراتك وخبراتك في السيرة الذاتية</p>
      </div>

      {/* 2. Connection Line */}
      <div className="mr-4 h-8 border-r-4 border-[var(--color-border)] border-dashed"></div>

      {/* 3. Interview Questions Node */}
      <div className="relative border-r-4 border-[var(--color-primary-light)] pr-6 mr-4">
         <div className="absolute -right-3 top-0 bg-accent rounded-full w-6 h-6 flex items-center justify-center text-white">
           <MessageSquare className="w-3 h-3" />
         </div>
         <h4 className="font-bold text-lg text-primary mb-3">أسئلة المقابلة المتوقعة (Interview Questions)</h4>
         <div className="grid gap-4">
           {data.interviewPrep.map((item, i) => (
             <div key={i} className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
               <div className="flex items-center gap-2 mb-2">
                 <span className="bg-[var(--color-primary-light)] text-primary text-xs px-2 py-0.5 rounded font-bold">{item.focusArea}</span>
               </div>
               <p className="font-bold text-[var(--color-text-main)] text-sm mb-2 whitespace-pre-line" dir="auto">"{item.question}"</p>
               <div className="text-xs text-[var(--color-text-secondary)] bg-[var(--color-bg)] p-2 rounded">
                 <span className="font-bold text-primary">نصيحة: </span>
                 {item.tip}
               </div>
             </div>
           ))}
         </div>
         <p className="text-xs text-[var(--color-text-muted)] mt-2">تم استنتاج هذه الأسئلة من نقاط القوة والضعف في ملفك</p>
      </div>
    </div>
  );
}

// --- Feature Components ---

// 1. Home Tab (Educational Journey)
const HomeTab: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto pb-12">
      {/* Main Hero Section */}
      <div className="flex flex-col items-center text-center space-y-4 mb-16 mt-12">
        
        {/* Profile Image & Identification */}
        <div className="flex flex-col items-center">
            {/* Project Owner Image - REMOVED as requested */}
            
            {/* Name */}
            <h1 className="text-5xl font-bold text-[var(--color-text-main)] mb-6 text-primary">محمد دغري</h1>
            
            {/* Removed Title as requested */}
            
            {/* Short Bio */}
            <div className="max-w-2xl mx-auto">
              <p className="text-[var(--color-text-secondary)] text-lg leading-relaxed">
                "أنا محمد، مهتم بالمجال التقني وبداية مسيرتي المهنية.
                بدأ شغفي بالتقنية من الرغبة في الفهم والتعلّم،
                ومع الوقت أدركت أن التطور الحقيقي يأتي من التطبيق العملي وليس الدراسة فقط."
              </p>
            </div>
        </div>

        {/* Social */}
        <div className="pt-4">
            <a 
              href="https://www.linkedin.com/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="inline-flex items-center gap-2 px-8 py-3 bg-[#0077b5] hover:bg-[#006396] text-white rounded-full transition-all shadow-md hover:shadow-lg font-bold dir-ltr"
            >
              <Linkedin className="w-5 h-5" />
              <span>Connect on LinkedIn</span>
            </a>
        </div>

      </div>

      {/* Content Grid */}
      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {/* Academic */}
        <Card className="hover:translate-y-[-2px] transition-transform duration-300">
           <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-[var(--color-primary-light)] text-primary rounded-xl">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-xl text-primary">الرحلة الأكاديمية</h3>
           </div>
           <ul className="space-y-4 text-[var(--color-text-secondary)] text-base leading-relaxed">
              <li className="flex items-start gap-3">
                <span className="mt-2 w-1.5 h-1.5 bg-primary rounded-full shrink-0"></span>
                <span>درست تخصص تقنية المعلومات في جامعة جازان.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-2 w-1.5 h-1.5 bg-primary rounded-full shrink-0"></span>
                <span>اكتسبت أساسًا قويًا في أنظمة التشغيل والشبكات.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-2 w-1.5 h-1.5 bg-primary rounded-full shrink-0"></span>
                <span>تعلمت أساسيات الدعم الفني ومبادئ الأمن السيبراني.</span>
              </li>
           </ul>
        </Card>

        {/* Practical */}
        <Card className="hover:translate-y-[-2px] transition-transform duration-300">
           <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-[var(--color-primary-light)] text-primary rounded-xl">
                <Wrench className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-xl text-primary">التعلّم العملي</h3>
           </div>
           <ul className="space-y-4 text-[var(--color-text-secondary)] text-base leading-relaxed">
              <li className="flex items-start gap-3">
                <span className="mt-2 w-1.5 h-1.5 bg-[var(--color-text-muted)] rounded-full shrink-0"></span>
                <span>التدريب العملي في بيئات عمل حقيقية واكتساب الخبرة الميدانية.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-2 w-1.5 h-1.5 bg-[var(--color-text-muted)] rounded-full shrink-0"></span>
                <span>التعامل المباشر مع مشاكل تقنية واقعية وإيجاد حلول فعالة.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-2 w-1.5 h-1.5 bg-[var(--color-text-muted)] rounded-full shrink-0"></span>
                <span>تطوير مهارات حل المشكلات والعمل تحت الضغط.</span>
              </li>
           </ul>
        </Card>

        {/* Continuous Learning */}
        <Card className="hover:translate-y-[-2px] transition-transform duration-300">
           <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-[var(--color-primary-light)] text-primary rounded-xl">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-xl text-primary">التعلّم المستمر</h3>
           </div>
           <ul className="space-y-4 text-[var(--color-text-secondary)] text-base leading-relaxed">
              <li className="flex items-start gap-3">
                <span className="mt-2 w-1.5 h-1.5 bg-primary rounded-full shrink-0"></span>
                <span>التعلّم الذاتي المستمر عبر الدورات والمنصات التعليمية.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-2 w-1.5 h-1.5 bg-primary rounded-full shrink-0"></span>
                <span>التركيز الحالي على تطوير المهارات في مجال الأمن السيبراني.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-2 w-1.5 h-1.5 bg-primary rounded-full shrink-0"></span>
                <span>متابعة أحدث التقنيات والأدوات في عالم التكنولوجيا المتسارع.</span>
              </li>
           </ul>
        </Card>

         {/* Goal */}
        <Card className="hover:translate-y-[-2px] transition-transform duration-300">
           <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-[var(--color-primary-light)] text-primary rounded-xl">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-xl text-primary">هدفي</h3>
           </div>
           <ul className="space-y-4 text-[var(--color-text-secondary)] text-base leading-relaxed">
              <li className="flex items-start gap-3">
                <span className="mt-2 w-1.5 h-1.5 bg-[var(--color-text-muted)] rounded-full shrink-0"></span>
                <span>تطوير مهاراتي التقنية والمهنية بشكل مستمر ومحترف.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-2 w-1.5 h-1.5 bg-[var(--color-text-muted)] rounded-full shrink-0"></span>
                <span>بناء مشاريع تقنية مفيدة تترك أثراً إيجابياً.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-2 w-1.5 h-1.5 bg-[var(--color-text-muted)] rounded-full shrink-0"></span>
                <span>مساعدة الآخرين في رحلتهم المهنية وتبادل المعرفة.</span>
              </li>
           </ul>
        </Card>
      </div>

      {/* Why This App (Clean Flat Design) */}
      <div className="bg-[var(--color-card)] rounded-2xl p-8 shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-[var(--color-border)]">
        <div className="flex flex-col md:flex-row items-start gap-6">
           <div className="p-4 bg-[var(--color-primary-light)] rounded-full shrink-0">
              <Lightbulb className="w-8 h-8 text-primary" />
           </div>
           <div>
              <h3 className="font-bold text-2xl mb-4 text-primary">لماذا هذا التطبيق؟</h3>
              <p className="text-[var(--color-text-secondary)] leading-relaxed text-lg">
                "واجهت صعوبة كبيرة في كتابة السيرة الذاتية والاستعداد للمقابلات،
                فقررت تحويل هذه التحديات إلى فرصة تعلّم،
                ومن هنا جاءت فكرة هذا التطبيق لمساعدة نفسي ومساعدة غيري في بناء مستقبل مهني أفضل."
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};

// 2. Resume Tab
const ResumeTab: React.FC<{ language: 'ar' | 'en' }> = ({ language }) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const t = translations[language];

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const base64Data = await readFileAsBase64(file);
      const prompt = language === 'ar' ? 
        "قم بتحليل السيرة الذاتية واستخراج البيانات التالية بدقة. تأكد من استخراج التواريخ والتفاصيل. إذا كان الملف صورة، استخدم OCR." : 
        "Analyze the resume and extract the following data precisely. Ensure dates and details are extracted.";

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
            {
                inlineData: {
                    mimeType: file.type,
                    data: base64Data
                }
            },
            { text: prompt }
        ],
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    fullName: { type: Type.STRING },
                    title: { type: Type.STRING },
                    contact: {
                        type: Type.OBJECT,
                        properties: {
                            phone: { type: Type.STRING },
                            email: { type: Type.STRING },
                            linkedin: { type: Type.STRING },
                            location: { type: Type.STRING },
                        }
                    },
                    summary: { type: Type.STRING },
                    education: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                degree: { type: Type.STRING },
                                school: { type: Type.STRING },
                                year: { type: Type.STRING },
                            }
                        }
                    },
                    experience: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                role: { type: Type.STRING },
                                company: { type: Type.STRING },
                                date: { type: Type.STRING },
                                points: { type: Type.ARRAY, items: { type: Type.STRING } },
                            }
                        }
                    },
                    skills: { type: Type.ARRAY, items: { type: Type.STRING } },
                    courses: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: { name: { type: Type.STRING } }
                        }
                    },
                    volunteering: {
                         type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: { 
                                title: { type: Type.STRING },
                                points: { type: Type.ARRAY, items: { type: Type.STRING } }
                            }
                        }
                    }
                }
            }
        }
      });
      
      if (response.text) {
          setResumeData(JSON.parse(response.text));
      }
    } catch (error) {
      console.error("Error analyzing resume:", error);
      alert(language === 'ar' ? "حدث خطأ أثناء تحليل السيرة الذاتية" : "Error analyzing resume");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingState message={language === 'ar' ? 'جاري تحليل السيرة الذاتية...' : 'Analyzing resume...'} />;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {!resumeData ? (
        <Card>
           <h2 className="text-xl font-bold mb-4">{t.resume}</h2>
           <FileUploader 
             label={t.uploadResume} 
             selectedFile={file}
             onFileSelect={setFile}
             onClear={() => setFile(null)}
           />
           <div className="mt-4 flex justify-end">
             <Button onClick={handleAnalyze} disabled={!file}>
                {t.analyze}
                <Sparkles className="w-4 h-4" />
             </Button>
           </div>
        </Card>
      ) : (
        <div className="space-y-6">
            <div className="flex justify-end gap-2 print:hidden">
                <Button variant="outline" onClick={() => setResumeData(null)}>
                    {language === 'ar' ? 'تحميل جديد' : 'Upload New'}
                </Button>
                <Button onClick={() => window.print()}>
                    {language === 'ar' ? 'طباعة / PDF' : 'Print / PDF'}
                    <Printer className="w-4 h-4" />
                </Button>
            </div>
            <ResumeTemplate data={resumeData} language={language} />
        </div>
      )}
    </div>
  );
};

// 3. Interview Tab
const InterviewTab: React.FC<{ language: 'ar' | 'en' }> = ({ language }) => {
  const [messages, setMessages] = useState<Array<{role: 'user'|'model', text: string}>>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatSession = useRef<Chat | null>(null);
  const t = translations[language];

  useEffect(() => {
    chatSession.current = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: language === 'ar' ? 
          "أنت مدرب مقابلات عمل محترف وودود. ساعد المستخدم في التحضير للمقابلة من خلال طرح أسئلة شائعة وتقديم تغذية راجعة بناءة." : 
          "You are a professional and friendly interview coach. Help the user prepare for their interview by asking common questions and providing constructive feedback."
      }
    });
    setMessages([]);
  }, [language]);

  const handleSend = async () => {
    if (!input.trim() || !chatSession.current) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const result = await chatSession.current.sendMessage({ message: userMsg });
      setMessages(prev => [...prev, { role: 'model', text: result.text }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: language === 'ar' ? 'حدث خطأ، يرجى المحاولة مرة أخرى.' : 'Error occurred, please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="max-w-2xl mx-auto h-[600px] flex flex-col bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] shadow-sm">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
                <div className="text-center text-[var(--color-text-muted)] mt-20">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="font-bold">{t.interviewPrep}</p>
                    <p className="text-sm mt-2">{t.startChat}</p>
                </div>
            )}
            {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-2xl ${m.role === 'user' ? 'bg-primary text-white rounded-tr-none' : 'bg-[var(--color-bg)] text-[var(--color-text-main)] rounded-tl-none border border-[var(--color-border)]'}`}>
                        <ReactMarkdown>{m.text}</ReactMarkdown>
                    </div>
                </div>
            ))}
            {loading && (
                 <div className="flex justify-start">
                    <div className="bg-[var(--color-bg)] p-3 rounded-2xl rounded-tl-none border border-[var(--color-border)]">
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    </div>
                </div>
            )}
        </div>
        <div className="p-4 border-t border-[var(--color-border)] flex gap-2">
            <input 
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleSend()}
                placeholder={t.typeMessage}
                className="flex-1 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-primary/20 text-[var(--color-text-main)]"
            />
            <Button onClick={handleSend} disabled={loading || !input.trim()} size="sm">
                <Send className="w-4 h-4" />
            </Button>
        </div>
      </div>
  );
};

// 4. Career Tab
const CareerTab: React.FC<{ language: 'ar' | 'en' }> = ({ language }) => {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
    const t = translations[language];

    const handleAnalyze = async () => {
        if (!file) return;
        setLoading(true);
        try {
            const base64Data = await readFileAsBase64(file);
            const prompt = language === 'ar' ? 
                "بناءً على السيرة الذاتية، اقترح مسارات وظيفية وأسئلة مقابلة." : 
                "Based on the resume, suggest career paths and interview questions.";

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: [
                    { inlineData: { mimeType: file.type, data: base64Data } },
                    { text: prompt }
                ],
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            atsScore: { type: Type.NUMBER },
                            atsLog: { type: Type.ARRAY, items: { type: Type.STRING } }, // Not used here primarily but good to have
                            suggestedRoles: { type: Type.ARRAY, items: { type: Type.STRING } },
                            interviewPrep: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        question: { type: Type.STRING },
                                        focusArea: { type: Type.STRING },
                                        tip: { type: Type.STRING }
                                    }
                                }
                            }
                        }
                    }
                }
            });
            if (response.text) {
                setAnalysis(JSON.parse(response.text));
            }
        } catch (error) {
            console.error(error);
            alert("Error");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <LoadingState message={language === 'ar' ? 'جاري تحليل المسار الوظيفي...' : 'Analyzing career path...'} />;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {!analysis ? (
                 <Card>
                    <h2 className="text-xl font-bold mb-4">{t.careerPath}</h2>
                    <FileUploader 
                        label={t.uploadResume} 
                        selectedFile={file}
                        onFileSelect={setFile}
                        onClear={() => setFile(null)}
                    />
                    <div className="mt-4 flex justify-end">
                        <Button onClick={handleAnalyze} disabled={!file}>
                            {t.analyze}
                            <Compass className="w-4 h-4" />
                        </Button>
                    </div>
                </Card>
            ) : (
                <div className="space-y-6">
                    <Button variant="outline" onClick={() => setAnalysis(null)}>
                        {language === 'ar' ? 'تحليل جديد' : 'New Analysis'}
                    </Button>
                    <Card>
                        <CareerMap data={analysis} />
                    </Card>
                </div>
            )}
        </div>
    );
};

// 5. ATS Tab
const AtsTab: React.FC<{ language: 'ar' | 'en' }> = ({ language }) => {
    const [file, setFile] = useState<File | null>(null);
    const [jobDesc, setJobDesc] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ score: number, feedback: string[] } | null>(null);
    const t = translations[language];

    const handleCheck = async () => {
        if (!file || !jobDesc) return;
        setLoading(true);
        try {
            const base64Data = await readFileAsBase64(file);
            const prompt = language === 'ar' ? 
                `قارن السيرة الذاتية مع الوصف الوظيفي التالي وقم بتقييم التوافق (ATS Score) من 100. وقدم ملاحظات للتحسين.
                 الوصف الوظيفي: ${jobDesc}` : 
                `Compare the resume with the following job description and provide an ATS Score out of 100 and improvement feedback.
                 Job Description: ${jobDesc}`;

             const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: [
                    { inlineData: { mimeType: file.type, data: base64Data } },
                    { text: prompt }
                ],
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            score: { type: Type.NUMBER },
                            feedback: { type: Type.ARRAY, items: { type: Type.STRING } }
                        }
                    }
                }
            });
            if (response.text) {
                setResult(JSON.parse(response.text));
            }

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <LoadingState message={language === 'ar' ? 'جاري فحص التوافق...' : 'Checking ATS compatibility...'} />;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {!result ? (
                <Card>
                    <h2 className="text-xl font-bold mb-4">{t.atsCheck}</h2>
                     <div className="space-y-6">
                        <FileUploader 
                            label={t.uploadResume} 
                            selectedFile={file}
                            onFileSelect={setFile}
                            onClear={() => setFile(null)}
                        />
                        <div>
                            <label className="block text-sm font-bold text-[var(--color-text-main)] mb-2">{t.jobDescription}</label>
                            <textarea
                                value={jobDesc}
                                onChange={(e) => setJobDesc(e.target.value)}
                                className="w-full h-32 p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] focus:ring-2 focus:ring-primary/20 outline-none text-[var(--color-text-main)]"
                                placeholder={t.pasteJob}
                            />
                        </div>
                        <div className="flex justify-end">
                             <Button onClick={handleCheck} disabled={!file || !jobDesc}>
                                {t.analyze}
                                <Target className="w-4 h-4" />
                            </Button>
                        </div>
                     </div>
                </Card>
            ) : (
                <div className="space-y-6">
                    <Button variant="outline" onClick={() => setResult(null)}>
                        {language === 'ar' ? 'فحص جديد' : 'New Check'}
                    </Button>
                    <Card>
                        <div className="text-center mb-8">
                            <div className={`text-6xl font-bold mb-2 ${result.score >= 70 ? 'text-green-500' : result.score >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                                {result.score}%
                            </div>
                            <p className="text-[var(--color-text-muted)]">ATS Score</p>
                        </div>
                        <div className="space-y-3">
                            <h3 className="font-bold text-lg">{language === 'ar' ? 'ملاحظات التحسين:' : 'Improvement Feedback:'}</h3>
                            {result.feedback.map((item, idx) => (
                                <div key={idx} className="flex items-start gap-2 p-3 bg-[var(--color-bg)] rounded-lg">
                                    <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                    <span className="text-[var(--color-text-main)]">{item}</span>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

// 6. Image Generation Tab
const ImageGenTab: React.FC<{ language: 'ar' | 'en' }> = ({ language }) => {
    const [prompt, setPrompt] = useState('');
    const [size, setSize] = useState<'1K' | '2K' | '4K'>('1K');
    const [loading, setLoading] = useState(false);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const t = translations[language];

    const handleGenerate = async () => {
        if (!prompt) return;
        setLoading(true);
        setGeneratedImage(null);

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-3-pro-image-preview',
                contents: {
                    parts: [{ text: prompt }]
                },
                config: {
                    imageConfig: {
                        imageSize: size
                    }
                }
            });

            if (response.candidates?.[0]?.content?.parts) {
                for (const part of response.candidates[0].content.parts) {
                    if (part.inlineData) {
                        setGeneratedImage(`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`);
                        break;
                    }
                }
            }
        } catch (error) {
            console.error("Image generation error:", error);
            alert(language === 'ar' ? 'حدث خطأ أثناء توليد الصورة' : 'Error generating image');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <Card>
                <h2 className="text-xl font-bold mb-4">{t.generateImage}</h2>
                <div className="space-y-4">
                    <div>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="w-full h-32 p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] focus:ring-2 focus:ring-primary/20 outline-none text-[var(--color-text-main)]"
                            placeholder={t.imagePromptPlaceholder}
                        />
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4">
                        <label className="font-bold text-sm text-[var(--color-text-main)]">{t.imageSize}:</label>
                        <div className="flex gap-2">
                            {['1K', '2K', '4K'].map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setSize(s as any)}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold border transition-colors ${
                                        size === s 
                                        ? 'bg-primary text-white border-primary' 
                                        : 'bg-[var(--color-bg)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:bg-[var(--color-bg-hover)]'
                                    }`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Button onClick={handleGenerate} disabled={!prompt || loading}>
                            {loading ? t.generating : t.generateImage}
                            {!loading && <ImageIcon className="w-4 h-4" />}
                        </Button>
                    </div>
                </div>
            </Card>

            {loading && <LoadingState message={t.generating} />}

            {generatedImage && (
                <Card className="flex flex-col items-center">
                    <img src={generatedImage} alt="Generated" className="max-w-full rounded-lg shadow-lg mb-4" />
                    <Button onClick={() => {
                        const link = document.createElement('a');
                        link.href = generatedImage;
                        link.download = `generated-image-${Date.now()}.png`;
                        link.click();
                    }} variant="outline">
                        {language === 'ar' ? 'تحميل الصورة' : 'Download Image'}
                        <Download className="w-4 h-4" />
                    </Button>
                </Card>
            )}
        </div>
    );
};

// --- Main App Component ---

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.HOME);
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const t = translations[language];

  // Apply theme to body
  useEffect(() => {
    document.body.className = theme === 'dark' ? 'bg-[#0f172a]' : 'bg-[#f8fafc]';
    // Set CSS variables for theme
    const root = document.documentElement;
    if (theme === 'dark') {
      root.style.setProperty('--color-bg', '#0f172a');
      root.style.setProperty('--color-card', '#1e293b');
      root.style.setProperty('--color-text-main', '#f1f5f9');
      root.style.setProperty('--color-text-secondary', '#94a3b8');
      root.style.setProperty('--color-text-muted', '#64748b');
      root.style.setProperty('--color-border', '#334155');
      root.style.setProperty('--color-primary-light', 'rgba(79, 70, 229, 0.2)');
      root.style.setProperty('--color-bg-hover', '#334155');
    } else {
      root.style.setProperty('--color-bg', '#f8fafc');
      root.style.setProperty('--color-card', '#ffffff');
      root.style.setProperty('--color-text-main', '#0f172a');
      root.style.setProperty('--color-text-secondary', '#475569');
      root.style.setProperty('--color-text-muted', '#94a3b8');
      root.style.setProperty('--color-border', '#e2e8f0');
      root.style.setProperty('--color-primary-light', '#e0e7ff');
      root.style.setProperty('--color-bg-hover', '#f1f5f9');
    }
  }, [theme]);

  const navItems = [
    { id: Tab.HOME, label: t.home, icon: LayoutTemplate },
    { id: Tab.RESUME, label: t.resume, icon: FileText },
    { id: Tab.INTERVIEW, label: t.interview, icon: MessageSquare },
    { id: Tab.CAREER, label: t.career, icon: Compass },
    { id: Tab.ATS, label: t.ats, icon: Target },
    { id: Tab.IMAGES, label: t.images, icon: ImageIcon },
  ];

  return (
    <div className={`min-h-screen font-sans ${language === 'ar' ? 'font-[Cairo]' : 'font-[Inter]'} transition-colors duration-300`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* Header */}
      <header className="bg-[var(--color-card)] border-b border-[var(--color-border)] sticky top-0 z-50 print:hidden">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/30">
              M
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
              {t.appTitle}
            </span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2
                  ${activeTab === item.id 
                    ? 'bg-primary text-white shadow-md shadow-primary/25' 
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
                  }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </nav>

          {/* Settings */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLanguage(l => l === 'ar' ? 'en' : 'ar')}
              className="p-2 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] transition-colors"
              title={t.language}
            >
              <Languages className="w-5 h-5" />
            </button>
            <button
              onClick={() => setTheme(th => th === 'light' ? 'dark' : 'light')}
              className="p-2 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] transition-colors"
              title={t.theme}
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
          </div>
        </div>
        
        {/* Mobile Nav */}
        <div className="md:hidden border-t border-[var(--color-border)] overflow-x-auto">
          <div className="flex p-2 gap-2 min-w-max">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap flex items-center gap-2 transition-colors
                   ${activeTab === item.id 
                    ? 'bg-primary text-white' 
                    : 'text-[var(--color-text-secondary)] bg-[var(--color-bg)]'
                  }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === Tab.HOME && <HomeTab />}
        {activeTab === Tab.RESUME && <ResumeTab language={language} />}
        {activeTab === Tab.INTERVIEW && <InterviewTab language={language} />}
        {activeTab === Tab.CAREER && <CareerTab language={language} />}
        {activeTab === Tab.ATS && <AtsTab language={language} />}
        {activeTab === Tab.IMAGES && <ImageGenTab language={language} />}
      </main>

      {/* Footer */}
      <footer className="text-center py-8 text-[var(--color-text-muted)] text-sm print:hidden">
        <p>{t.developedBy}</p>
      </footer>
    </div>
  );
};

export default App;