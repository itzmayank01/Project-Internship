import { useState, useCallback, useMemo, type CSSProperties, type ReactNode } from 'react';
import {
  User, FileText, Monitor, GraduationCap, ClipboardCheck,
  ChevronRight, Check, Lock, Upload, CloudUpload, X,
  Phone, Mail, Building2, Briefcase, CalendarDays, Heart,
  Laptop, MonitorSmartphone, Keyboard, Mouse, Headphones,
  BookOpen, Shield, Wrench, Users, ExternalLink,
  HelpCircle, MessageSquare, FileQuestion, ChevronDown,
  Sparkles, AlertCircle, Trash2, Eye, CheckCircle2, Clock, Star,
  LayoutDashboard, Settings, Bell, LogOut
} from 'lucide-react';

/* =============================================
   TYPES
   ============================================= */
interface PersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  role: string;
  startDate: string;
  emergencyContact: string;
  emergencyPhone: string;
}

interface UploadedFile {
  id: string;
  name: string;
  size: string;
  type: string;
  status: 'uploading' | 'completed' | 'error';
  progress: number;
}

interface EquipmentItem {
  id: string;
  name: string;
  icon: ReactNode;
  selected: boolean;
  preference: string;
  options: string[];
}

interface TrainingModule {
  id: string;
  name: string;
  icon: ReactNode;
  description: string;
  duration: string;
  completed: boolean;
  progress: number;
}

interface StepInfo {
  id: number;
  title: string;
  icon: ReactNode;
  status: 'completed' | 'current' | 'locked';
}

/* =============================================
   MAIN APP COMPONENT
   ============================================= */
export default function App() {
  const [activeStep, setActiveStep] = useState(1);
  const [personalInfoSaved, setPersonalInfoSaved] = useState(false);

  /* ---------- Personal Info State ---------- */
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    firstName: 'Alex',
    lastName: 'Johnson',
    email: 'alex.johnson@company.com',
    phone: '+1 (555) 234-5678',
    department: 'Engineering',
    role: 'Senior Frontend Developer',
    startDate: '2026-06-15',
    emergencyContact: 'Sarah Johnson',
    emergencyPhone: '+1 (555) 876-5432',
  });

  /* ---------- Document Upload State ---------- */
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([
    { id: '1', name: 'passport_scan.pdf', size: '2.4 MB', type: 'ID Proof', status: 'completed', progress: 100 },
  ]);
  const [isDragging, setIsDragging] = useState(false);

  /* ---------- IT Setup State ---------- */
  const [equipment, setEquipment] = useState<EquipmentItem[]>([
    { id: 'laptop', name: 'Laptop', icon: <Laptop size={20} />, selected: true, preference: 'MacBook Pro 16"', options: ['MacBook Pro 14"', 'MacBook Pro 16"', 'Dell XPS 15', 'ThinkPad X1 Carbon'] },
    { id: 'monitor', name: 'External Monitor', icon: <MonitorSmartphone size={20} />, selected: true, preference: 'Dell UltraSharp 27" 4K', options: ['Dell UltraSharp 27" 4K', 'LG 27" 4K', 'Samsung 32" Curved', 'Dual 24" Setup'] },
    { id: 'keyboard', name: 'Keyboard', icon: <Keyboard size={20} />, selected: false, preference: '', options: ['Apple Magic Keyboard', 'Logitech MX Keys', 'Keychron K2', 'Das Keyboard'] },
    { id: 'mouse', name: 'Mouse', icon: <Mouse size={20} />, selected: false, preference: '', options: ['Apple Magic Mouse', 'Logitech MX Master 3', 'Razer DeathAdder', 'Logitech Ergo'] },
    { id: 'headset', name: 'Headset', icon: <Headphones size={20} />, selected: false, preference: '', options: ['Sony WH-1000XM5', 'Bose 700', 'AirPods Max', 'Jabra Evolve2 85'] },
  ]);

  /* ---------- Training State ---------- */
  const [trainingModules, setTrainingModules] = useState<TrainingModule[]>([
    { id: 'policies', name: 'Company Policies', icon: <BookOpen size={20} />, description: 'Learn about company guidelines, code of conduct, and workplace policies.', duration: '45 min', completed: false, progress: 0 },
    { id: 'security', name: 'Security Awareness', icon: <Shield size={20} />, description: 'Understand cybersecurity best practices, data handling, and incident reporting.', duration: '30 min', completed: false, progress: 0 },
    { id: 'tools', name: 'Tools Onboarding', icon: <Wrench size={20} />, description: 'Get familiar with development tools, CI/CD pipelines, and internal platforms.', duration: '60 min', completed: false, progress: 0 },
    { id: 'team', name: 'Team Introduction', icon: <Users size={20} />, description: 'Meet your team members, understand team dynamics, and learn collaboration workflows.', duration: '30 min', completed: false, progress: 0 },
  ]);

  /* ---------- Steps Definition ---------- */
  const steps: StepInfo[] = useMemo(() => [
    { id: 0, title: 'Personal Info', icon: <User size={18} />, status: 'completed' as const },
    { id: 1, title: 'Document Upload', icon: <FileText size={18} />, status: 'current' as const },
    { id: 2, title: 'IT Setup', icon: <Monitor size={18} />, status: 'locked' as const },
    { id: 3, title: 'Training', icon: <GraduationCap size={18} />, status: 'locked' as const },
    { id: 4, title: 'Review & Complete', icon: <ClipboardCheck size={18} />, status: 'locked' as const },
  ], []);

  const getStepStatus = useCallback((stepId: number): 'completed' | 'current' | 'locked' => {
    if (stepId < activeStep) return 'completed';
    if (stepId === activeStep) return 'current';
    return 'locked';
  }, [activeStep]);

  const canNavigateToStep = useCallback((stepId: number): boolean => {
    return stepId <= activeStep;
  }, [activeStep]);

  const handleStepClick = useCallback((stepId: number) => {
    if (canNavigateToStep(stepId)) {
      setActiveStep(stepId);
    }
  }, [canNavigateToStep]);

  /* ---------- Completion Percentage ---------- */
  const completionPercentage = useMemo(() => {
    let total = 0;
    // Step 0 (Personal Info) = always completed = 20%
    total += 20;
    // Step 1 (Documents) = partial based on uploads
    total += Math.min(uploadedFiles.filter(f => f.status === 'completed').length * 10, 20);
    // Step 2 (IT Setup) = partial based on selections
    const selectedEquip = equipment.filter(e => e.selected && e.preference).length;
    total += Math.min((selectedEquip / equipment.length) * 20, 20);
    // Step 3 (Training) = partial based on completions
    const completedTraining = trainingModules.filter(t => t.completed).length;
    total += Math.min((completedTraining / trainingModules.length) * 20, 20);
    // Step 4 (Review) = 20% when on step 4
    if (activeStep >= 4) total += 20;
    return Math.round(total);
  }, [uploadedFiles, equipment, trainingModules, activeStep]);

  /* ---------- Handlers ---------- */
  const handlePersonalInfoChange = (field: keyof PersonalInfo, value: string) => {
    setPersonalInfo(prev => ({ ...prev, [field]: value }));
    setPersonalInfoSaved(false);
  };

  const handleSavePersonalInfo = () => {
    setPersonalInfoSaved(true);
    setTimeout(() => setPersonalInfoSaved(false), 3000);
  };

  const simulateUpload = (fileName: string) => {
    const newFile: UploadedFile = {
      id: Date.now().toString(),
      name: fileName,
      size: `${(Math.random() * 5 + 0.5).toFixed(1)} MB`,
      type: 'Document',
      status: 'uploading',
      progress: 0,
    };
    setUploadedFiles(prev => [...prev, newFile]);

    const interval = setInterval(() => {
      setUploadedFiles(prev =>
        prev.map(f => {
          if (f.id === newFile.id) {
            const newProgress = Math.min(f.progress + Math.random() * 30 + 10, 100);
            return {
              ...f,
              progress: newProgress,
              status: newProgress >= 100 ? 'completed' : 'uploading',
            };
          }
          return f;
        })
      );
    }, 500);

    setTimeout(() => {
      clearInterval(interval);
      setUploadedFiles(prev =>
        prev.map(f => f.id === newFile.id ? { ...f, progress: 100, status: 'completed' } : f)
      );
    }, 3000);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      Array.from(files).forEach(file => simulateUpload(file.name));
    }
  };

  const handleUploadClick = () => {
    const sampleNames = ['drivers_license.pdf', 'tax_form_w4.pdf', 'degree_certificate.pdf', 'vaccination_record.pdf'];
    const randomName = sampleNames[Math.floor(Math.random() * sampleNames.length)];
    simulateUpload(randomName);
  };

  const handleRemoveFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleEquipmentToggle = (equipId: string) => {
    setEquipment(prev => prev.map(e =>
      e.id === equipId ? { ...e, selected: !e.selected, preference: !e.selected ? e.options[0] : '' } : e
    ));
  };

  const handleEquipmentPreference = (equipId: string, preference: string) => {
    setEquipment(prev => prev.map(e =>
      e.id === equipId ? { ...e, preference } : e
    ));
  };

  const handleTrainingToggle = (moduleId: string) => {
    setTrainingModules(prev => prev.map(m =>
      m.id === moduleId ? { ...m, completed: !m.completed, progress: !m.completed ? 100 : 0 } : m
    ));
  };

  const handleNextStep = () => {
    if (activeStep < 4) setActiveStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    if (activeStep > 0) setActiveStep(prev => prev - 1);
  };

  /* =============================================
     RENDER
     ============================================= */
  return (
    <div style={styles.layout}>
      {/* ========== SIDEBAR ========== */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarInner}>
          {/* Logo / Brand */}
          <div style={styles.sidebarBrand}>
            <div style={styles.brandIcon}>
              <Sparkles size={22} color="#10b981" />
            </div>
            <div>
              <div style={styles.brandTitle}>Onboard</div>
              <div style={styles.brandSub}>Employee Portal</div>
            </div>
          </div>

          {/* Employee Card */}
          <div style={styles.employeeCard}>
            <div style={styles.avatar}>
              <span style={styles.avatarText}>AJ</span>
            </div>
            <div style={styles.employeeName}>Alex Johnson</div>
            <div style={styles.employeeRole}>Senior Frontend Developer</div>
            <div style={{ ...styles.badge, background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)' }}>
              <Clock size={10} /> Onboarding in Progress
            </div>
          </div>

          {/* Circular Progress */}
          <div style={styles.progressSection}>
            <CircularProgress percentage={completionPercentage} />
            <div style={styles.progressMeta}>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Overall Progress</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f1f5f9' }}>{completionPercentage}% Complete</span>
            </div>
          </div>

          {/* Quick Links */}
          <div style={styles.sidebarSection}>
            <div style={styles.sidebarSectionTitle}>Quick Links</div>
            <SidebarLink icon={<LayoutDashboard size={16} />} label="Dashboard" />
            <SidebarLink icon={<FileText size={16} />} label="My Documents" />
            <SidebarLink icon={<Users size={16} />} label="Team Directory" />
            <SidebarLink icon={<Settings size={16} />} label="Account Settings" />
            <SidebarLink icon={<Bell size={16} />} label="Notifications" badge="3" />
          </div>

          {/* Help */}
          <div style={styles.helpCard}>
            <HelpCircle size={20} color="#14b8a6" />
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f1f5f9' }}>Need Help?</div>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.5 }}>
              Contact HR or your buddy for onboarding assistance.
            </div>
            <div style={styles.helpActions}>
              <button className="btn-ghost" style={{ fontSize: '0.78rem' }}>
                <MessageSquare size={14} /> Chat with HR
              </button>
              <button className="btn-ghost" style={{ fontSize: '0.78rem' }}>
                <FileQuestion size={14} /> FAQs
              </button>
            </div>
          </div>

          {/* Sign Out */}
          <button className="btn-ghost" style={{ width: '100%', justifyContent: 'center', marginTop: 'auto', padding: '10px', color: '#64748b' }}>
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* ========== MAIN CONTENT ========== */}
      <main style={styles.main}>
        {/* Header */}
        <header style={styles.header}>
          <div>
            <div style={styles.welcomeText}>
              Welcome aboard, <span className="text-gradient" style={{ fontWeight: 700 }}>Alex!</span> 🎉
            </div>
            <div style={styles.headerSub}>
              Complete the steps below to finish your onboarding. You're making great progress!
            </div>
          </div>
          <div style={styles.headerRight}>
            <div style={styles.dateCard}>
              <CalendarDays size={16} color="#14b8a6" />
              <div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Start Date</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>June 15, 2026</div>
              </div>
            </div>
          </div>
        </header>

        {/* Stepper */}
        <div style={styles.stepperContainer}>
          <div style={styles.stepper}>
            {steps.map((step, idx) => {
              const status = getStepStatus(step.id);
              const isLast = idx === steps.length - 1;
              return (
                <div key={step.id} style={styles.stepItem}>
                  <div
                    style={{
                      ...styles.stepCircle,
                      ...(status === 'completed' ? styles.stepCompleted : {}),
                      ...(status === 'current' ? styles.stepCurrent : {}),
                      ...(status === 'locked' ? styles.stepLocked : {}),
                      cursor: canNavigateToStep(step.id) ? 'pointer' : 'not-allowed',
                    }}
                    onClick={() => handleStepClick(step.id)}
                  >
                    {status === 'completed' ? <Check size={16} strokeWidth={3} /> : status === 'locked' ? <Lock size={14} /> : step.icon}
                  </div>
                  <div
                    style={{
                      ...styles.stepLabel,
                      color: status === 'current' ? '#34d399' : status === 'completed' ? '#94a3b8' : '#475569',
                      fontWeight: status === 'current' ? 600 : 400,
                      cursor: canNavigateToStep(step.id) ? 'pointer' : 'default',
                    }}
                    onClick={() => handleStepClick(step.id)}
                  >
                    {step.title}
                  </div>
                  {!isLast && (
                    <div style={{
                      ...styles.stepConnector,
                      background: status === 'completed' ? 'linear-gradient(90deg, #10b981, #14b8a6)' : 'rgba(148,163,184,0.15)',
                    }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div style={styles.contentArea} key={activeStep}>
          {activeStep === 0 && (
            <StepPersonalInfo
              info={personalInfo}
              onChange={handlePersonalInfoChange}
              onSave={handleSavePersonalInfo}
              saved={personalInfoSaved}
            />
          )}
          {activeStep === 1 && (
            <StepDocumentUpload
              files={uploadedFiles}
              isDragging={isDragging}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onUploadClick={handleUploadClick}
              onRemoveFile={handleRemoveFile}
            />
          )}
          {activeStep === 2 && (
            <StepITSetup
              equipment={equipment}
              onToggle={handleEquipmentToggle}
              onPreference={handleEquipmentPreference}
            />
          )}
          {activeStep === 3 && (
            <StepTraining
              modules={trainingModules}
              onToggle={handleTrainingToggle}
            />
          )}
          {activeStep === 4 && (
            <StepReview
              personalInfo={personalInfo}
              files={uploadedFiles}
              equipment={equipment}
              trainingModules={trainingModules}
            />
          )}

          {/* Navigation Buttons */}
          <div style={styles.navButtons}>
            {activeStep > 0 && (
              <button className="btn-secondary" onClick={handlePrevStep}>
                Previous Step
              </button>
            )}
            <div style={{ flex: 1 }} />
            {activeStep < 4 ? (
              <button className="btn-primary" onClick={handleNextStep}>
                Continue <ChevronRight size={16} />
              </button>
            ) : (
              <button className="btn-primary" onClick={() => alert('🎉 Onboarding submitted for review! Welcome aboard, Alex!')}>
                <CheckCircle2 size={16} /> Submit for Review
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

/* =============================================
   STEP 0: PERSONAL INFO
   ============================================= */
function StepPersonalInfo({
  info, onChange, onSave, saved,
}: {
  info: PersonalInfo;
  onChange: (field: keyof PersonalInfo, value: string) => void;
  onSave: () => void;
  saved: boolean;
}) {
  return (
    <div className="animate-fade-in-up">
      <div style={styles.stepHeader}>
        <div style={styles.stepIconBig}><User size={22} /></div>
        <div>
          <h2 style={styles.stepTitle}>Personal Information</h2>
          <p style={styles.stepDesc}>Review and update your personal details. All fields have been pre-filled from your application.</p>
        </div>
        {saved && (
          <div className="badge badge-success animate-scale-in" style={{ marginLeft: 'auto' }}>
            <Check size={12} /> Saved
          </div>
        )}
      </div>

      <div className="glass-card" style={styles.formCard}>
        <div style={styles.formGrid}>
          <FormField label="First Name" icon={<User size={14} />}>
            <input className="input-field" value={info.firstName} onChange={e => onChange('firstName', e.target.value)} />
          </FormField>
          <FormField label="Last Name" icon={<User size={14} />}>
            <input className="input-field" value={info.lastName} onChange={e => onChange('lastName', e.target.value)} />
          </FormField>
          <FormField label="Email Address" icon={<Mail size={14} />}>
            <input className="input-field" type="email" value={info.email} onChange={e => onChange('email', e.target.value)} />
          </FormField>
          <FormField label="Phone Number" icon={<Phone size={14} />}>
            <input className="input-field" value={info.phone} onChange={e => onChange('phone', e.target.value)} />
          </FormField>
          <FormField label="Department" icon={<Building2 size={14} />}>
            <input className="input-field" value={info.department} onChange={e => onChange('department', e.target.value)} />
          </FormField>
          <FormField label="Role / Position" icon={<Briefcase size={14} />}>
            <input className="input-field" value={info.role} onChange={e => onChange('role', e.target.value)} />
          </FormField>
          <FormField label="Start Date" icon={<CalendarDays size={14} />}>
            <input className="input-field" type="date" value={info.startDate} onChange={e => onChange('startDate', e.target.value)} />
          </FormField>
          <FormField label="Emergency Contact Name" icon={<Heart size={14} />}>
            <input className="input-field" value={info.emergencyContact} onChange={e => onChange('emergencyContact', e.target.value)} />
          </FormField>
          <FormField label="Emergency Contact Phone" icon={<Phone size={14} />} fullWidth>
            <input className="input-field" value={info.emergencyPhone} onChange={e => onChange('emergencyPhone', e.target.value)} />
          </FormField>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(148,163,184,0.1)' }}>
          <button className="btn-primary" onClick={onSave}>
            <Check size={16} /> Update Information
          </button>
        </div>
      </div>
    </div>
  );
}

/* =============================================
   STEP 1: DOCUMENT UPLOAD
   ============================================= */
function StepDocumentUpload({
  files, isDragging, onDragOver, onDragLeave, onDrop, onUploadClick, onRemoveFile,
}: {
  files: UploadedFile[];
  isDragging: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onUploadClick: () => void;
  onRemoveFile: (id: string) => void;
}) {
  return (
    <div className="animate-fade-in-up">
      <div style={styles.stepHeader}>
        <div style={styles.stepIconBig}><FileText size={22} /></div>
        <div>
          <h2 style={styles.stepTitle}>Document Upload</h2>
          <p style={styles.stepDesc}>Upload your identity documents and required paperwork. Accepted formats: PDF, JPG, PNG (max 10MB each).</p>
        </div>
      </div>

      {/* Required Documents Info */}
      <div className="glass-card" style={{ ...styles.formCard, marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <AlertCircle size={18} color="#f59e0b" />
          <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#fbbf24' }}>Required Documents</span>
        </div>
        <div style={styles.requiredDocsList}>
          {['Government-issued Photo ID', 'Tax Form (W-4 or equivalent)', 'Proof of Address', 'Educational Certificates'].map((doc, i) => (
            <div key={i} style={styles.requiredDocItem}>
              <div style={{
                width: 22, height: 22, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: i === 0 ? 'rgba(16,185,129,0.2)' : 'rgba(148,163,184,0.1)',
                border: `1px solid ${i === 0 ? 'rgba(16,185,129,0.4)' : 'rgba(148,163,184,0.15)'}`,
              }}>
                {i === 0 ? <Check size={12} color="#34d399" /> : <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{i + 1}</span>}
              </div>
              <span style={{ fontSize: '0.85rem', color: i === 0 ? '#94a3b8' : '#f1f5f9', textDecoration: i === 0 ? 'line-through' : 'none' }}>{doc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Drop Zone */}
      <div
        className={`drop-zone ${isDragging ? 'drag-active' : ''}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={onUploadClick}
        style={{ marginBottom: '24px' }}
      >
        <div style={{ marginBottom: '16px' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%', margin: '0 auto 16px',
            background: 'rgba(16,185,129,0.1)', border: '2px solid rgba(16,185,129,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <CloudUpload size={28} color="#10b981" />
          </div>
        </div>
        <div style={{ fontSize: '1rem', fontWeight: 600, color: '#f1f5f9', marginBottom: '6px' }}>
          {isDragging ? 'Drop files here...' : 'Drag & drop files here'}
        </div>
        <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '16px' }}>
          or click to browse from your computer
        </div>
        <button className="btn-secondary" onClick={(e) => { e.stopPropagation(); onUploadClick(); }} style={{ pointerEvents: 'auto' }}>
          <Upload size={16} /> Choose Files
        </button>
      </div>

      {/* Uploaded Files List */}
      {files.length > 0 && (
        <div className="glass-card" style={styles.formCard}>
          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f1f5f9', marginBottom: '16px' }}>
            Uploaded Files ({files.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {files.map(file => (
              <div key={file.id} style={styles.fileItem} className="animate-scale-in">
                <div style={styles.fileIcon}>
                  <FileText size={20} color="#14b8a6" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: 500, color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{file.name}</span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{file.size}</span>
                  </div>
                  {file.status === 'uploading' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div className="progress-bar-bg" style={{ flex: 1 }}>
                        <div className="progress-bar-fill" style={{ width: `${file.progress}%` }} />
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', minWidth: '36px' }}>{Math.round(file.progress)}%</span>
                    </div>
                  ) : (
                    <div className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                      <CheckCircle2 size={10} /> Uploaded Successfully
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {file.status === 'completed' && (
                    <button className="btn-ghost" style={{ padding: '6px' }}>
                      <Eye size={14} />
                    </button>
                  )}
                  <button className="btn-ghost" style={{ padding: '6px', color: '#ef4444' }} onClick={() => onRemoveFile(file.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* =============================================
   STEP 2: IT SETUP
   ============================================= */
function StepITSetup({
  equipment, onToggle, onPreference,
}: {
  equipment: EquipmentItem[];
  onToggle: (id: string) => void;
  onPreference: (id: string, pref: string) => void;
}) {
  const selectedCount = equipment.filter(e => e.selected).length;
  return (
    <div className="animate-fade-in-up">
      <div style={styles.stepHeader}>
        <div style={styles.stepIconBig}><Monitor size={22} /></div>
        <div>
          <h2 style={styles.stepTitle}>IT Setup & Equipment</h2>
          <p style={styles.stepDesc}>Select the equipment you'll need and your preferences. IT will prepare everything before your start date.</p>
        </div>
        <div className="badge badge-info" style={{ marginLeft: 'auto' }}>
          {selectedCount} of {equipment.length} selected
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {equipment.map((item, idx) => (
          <div
            key={item.id}
            className="glass-card"
            style={{
              ...styles.equipmentCard,
              borderColor: item.selected ? 'rgba(16,185,129,0.3)' : 'rgba(148,163,184,0.1)',
              animation: `fadeInUp 0.4s ease ${idx * 0.08}s both`,
            }}
          >
            <div style={styles.equipmentContent}>
              <div
                style={{ ...styles.checkboxOuter, cursor: 'pointer' }}
                onClick={() => onToggle(item.id)}
              >
                <div style={{
                  width: 22, height: 22, borderRadius: 6,
                  border: `2px solid ${item.selected ? '#10b981' : 'rgba(148,163,184,0.3)'}`,
                  background: item.selected ? 'linear-gradient(135deg, #10b981, #14b8a6)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.3s ease',
                }}>
                  {item.selected && <Check size={14} color="#fff" strokeWidth={3} />}
                </div>
              </div>
              <div style={{
                width: 44, height: 44, borderRadius: 10,
                background: item.selected ? 'rgba(16,185,129,0.1)' : 'rgba(148,163,184,0.08)',
                border: `1px solid ${item.selected ? 'rgba(16,185,129,0.2)' : 'rgba(148,163,184,0.1)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: item.selected ? '#10b981' : '#64748b',
                transition: 'all 0.3s ease',
              }}>
                {item.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#f1f5f9' }}>{item.name}</div>
                {item.selected && item.preference && (
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>Selected: {item.preference}</div>
                )}
              </div>
              {item.selected && (
                <div style={{ minWidth: '220px' }}>
                  <select
                    className="select-field"
                    value={item.preference}
                    onChange={(e) => onPreference(item.id, e.target.value)}
                    style={{ fontSize: '0.85rem' }}
                  >
                    <option value="">Select preference...</option>
                    {item.options.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Additional Notes */}
      <div className="glass-card" style={{ ...styles.formCard, marginTop: '20px' }}>
        <label style={{ marginBottom: '8px' }}>Additional Notes or Special Requirements</label>
        <textarea
          className="input-field"
          placeholder="Let IT know about any specific software, accessories, or accommodations you need..."
          style={{ minHeight: '100px', resize: 'vertical', fontFamily: "'Inter', sans-serif" }}
        />
      </div>
    </div>
  );
}

/* =============================================
   STEP 3: TRAINING
   ============================================= */
function StepTraining({
  modules, onToggle,
}: {
  modules: TrainingModule[];
  onToggle: (id: string) => void;
}) {
  const completedCount = modules.filter(m => m.completed).length;
  const totalProgress = modules.length > 0 ? Math.round((completedCount / modules.length) * 100) : 0;

  return (
    <div className="animate-fade-in-up">
      <div style={styles.stepHeader}>
        <div style={styles.stepIconBig}><GraduationCap size={22} /></div>
        <div>
          <h2 style={styles.stepTitle}>Training Modules</h2>
          <p style={styles.stepDesc}>Complete the assigned training modules. Mark each as complete once you've finished reviewing the material.</p>
        </div>
      </div>

      {/* Overall Training Progress */}
      <div className="glass-card" style={{ ...styles.formCard, marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Star size={16} color="#f59e0b" />
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f1f5f9' }}>Training Progress</span>
          </div>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{completedCount} of {modules.length} completed</span>
        </div>
        <div className="progress-bar-bg" style={{ height: '8px' }}>
          <div className="progress-bar-fill" style={{ width: `${totalProgress}%` }} />
        </div>
        <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '8px' }}>
          {totalProgress === 100 ? '🎉 All training modules completed!' : `${totalProgress}% complete — keep going!`}
        </div>
      </div>

      {/* Module Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {modules.map((mod, idx) => (
          <div
            key={mod.id}
            className="glass-card"
            style={{
              ...styles.trainingCard,
              borderColor: mod.completed ? 'rgba(16,185,129,0.3)' : 'rgba(148,163,184,0.1)',
              animation: `fadeInUp 0.4s ease ${idx * 0.08}s both`,
            }}
          >
            <div style={styles.trainingContent}>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: mod.completed ? 'rgba(16,185,129,0.15)' : 'rgba(148,163,184,0.08)',
                border: `1px solid ${mod.completed ? 'rgba(16,185,129,0.25)' : 'rgba(148,163,184,0.1)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: mod.completed ? '#10b981' : '#94a3b8',
                transition: 'all 0.3s ease',
                flexShrink: 0,
              }}>
                {mod.completed ? <CheckCircle2 size={22} /> : mod.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <span style={{
                    fontSize: '0.95rem', fontWeight: 600, color: '#f1f5f9',
                    textDecoration: mod.completed ? 'line-through' : 'none',
                    opacity: mod.completed ? 0.7 : 1,
                  }}>
                    {mod.name}
                  </span>
                  {mod.completed ? (
                    <span className="badge badge-success" style={{ fontSize: '0.68rem' }}>Completed</span>
                  ) : (
                    <span className="badge badge-warning" style={{ fontSize: '0.68rem' }}>Pending</span>
                  )}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: '10px', lineHeight: 1.5 }}>
                  {mod.description}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#64748b' }}>
                    <Clock size={13} /> {mod.duration}
                  </div>
                  <div className="progress-bar-bg" style={{ flex: 1, maxWidth: '200px' }}>
                    <div className="progress-bar-fill" style={{ width: `${mod.progress}%` }} />
                  </div>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>{mod.progress}%</span>
                </div>
              </div>
              <button
                className={mod.completed ? 'btn-secondary' : 'btn-primary'}
                onClick={() => onToggle(mod.id)}
                style={{ flexShrink: 0, fontSize: '0.82rem', padding: '8px 16px' }}
              >
                {mod.completed ? (
                  <><X size={14} /> Undo</>
                ) : (
                  <><Check size={14} /> Mark Complete</>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* =============================================
   STEP 4: REVIEW & COMPLETE
   ============================================= */
function StepReview({
  personalInfo, files, equipment, trainingModules,
}: {
  personalInfo: PersonalInfo;
  files: UploadedFile[];
  equipment: EquipmentItem[];
  trainingModules: TrainingModule[];
}) {
  const selectedEquipment = equipment.filter(e => e.selected);
  const completedTraining = trainingModules.filter(t => t.completed);

  return (
    <div className="animate-fade-in-up">
      <div style={styles.stepHeader}>
        <div style={styles.stepIconBig}><ClipboardCheck size={22} /></div>
        <div>
          <h2 style={styles.stepTitle}>Review & Complete</h2>
          <p style={styles.stepDesc}>Review all your onboarding information below. Once everything looks correct, submit for final review.</p>
        </div>
      </div>

      {/* Personal Info Summary */}
      <div className="glass-card" style={{ ...styles.formCard, marginBottom: '16px' }}>
        <div style={styles.reviewSectionHeader}>
          <User size={18} color="#10b981" />
          <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f1f5f9' }}>Personal Information</span>
          <button className="btn-ghost" style={{ marginLeft: 'auto', fontSize: '0.78rem' }}>
            <ExternalLink size={12} /> Edit
          </button>
        </div>
        <div style={styles.reviewGrid}>
          <ReviewItem label="Full Name" value={`${personalInfo.firstName} ${personalInfo.lastName}`} />
          <ReviewItem label="Email" value={personalInfo.email} />
          <ReviewItem label="Phone" value={personalInfo.phone} />
          <ReviewItem label="Department" value={personalInfo.department} />
          <ReviewItem label="Role" value={personalInfo.role} />
          <ReviewItem label="Start Date" value={personalInfo.startDate} />
          <ReviewItem label="Emergency Contact" value={personalInfo.emergencyContact} />
          <ReviewItem label="Emergency Phone" value={personalInfo.emergencyPhone} />
        </div>
      </div>

      {/* Documents Summary */}
      <div className="glass-card" style={{ ...styles.formCard, marginBottom: '16px' }}>
        <div style={styles.reviewSectionHeader}>
          <FileText size={18} color="#10b981" />
          <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f1f5f9' }}>Documents</span>
          <span className="badge badge-info" style={{ marginLeft: 'auto' }}>{files.filter(f => f.status === 'completed').length} uploaded</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {files.map(f => (
            <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: 'rgba(15,23,42,0.5)', borderRadius: '8px' }}>
              <FileText size={16} color="#14b8a6" />
              <span style={{ fontSize: '0.85rem', color: '#f1f5f9' }}>{f.name}</span>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{f.size}</span>
              <span className={`badge ${f.status === 'completed' ? 'badge-success' : 'badge-warning'}`} style={{ marginLeft: 'auto', fontSize: '0.68rem' }}>
                {f.status === 'completed' ? 'Uploaded' : 'Uploading...'}
              </span>
            </div>
          ))}
          {files.length === 0 && (
            <div style={{ fontSize: '0.85rem', color: '#64748b', padding: '12px', textAlign: 'center' as const }}>No documents uploaded yet.</div>
          )}
        </div>
      </div>

      {/* Equipment Summary */}
      <div className="glass-card" style={{ ...styles.formCard, marginBottom: '16px' }}>
        <div style={styles.reviewSectionHeader}>
          <Monitor size={18} color="#10b981" />
          <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f1f5f9' }}>IT Equipment</span>
          <span className="badge badge-info" style={{ marginLeft: 'auto' }}>{selectedEquipment.length} items</span>
        </div>
        <div style={styles.reviewGrid}>
          {selectedEquipment.map(e => (
            <ReviewItem key={e.id} label={e.name} value={e.preference || 'No preference'} />
          ))}
          {selectedEquipment.length === 0 && (
            <div style={{ fontSize: '0.85rem', color: '#64748b', gridColumn: '1 / -1' }}>No equipment selected.</div>
          )}
        </div>
      </div>

      {/* Training Summary */}
      <div className="glass-card" style={{ ...styles.formCard, marginBottom: '16px' }}>
        <div style={styles.reviewSectionHeader}>
          <GraduationCap size={18} color="#10b981" />
          <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f1f5f9' }}>Training</span>
          <span className="badge badge-info" style={{ marginLeft: 'auto' }}>
            {completedTraining.length} / {trainingModules.length} done
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {trainingModules.map(m => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: 'rgba(15,23,42,0.5)', borderRadius: '8px' }}>
              <div style={{
                width: 20, height: 20, borderRadius: '50%',
                background: m.completed ? 'linear-gradient(135deg, #10b981, #14b8a6)' : 'rgba(148,163,184,0.1)',
                border: `1px solid ${m.completed ? 'transparent' : 'rgba(148,163,184,0.2)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {m.completed && <Check size={12} color="#fff" strokeWidth={3} />}
              </div>
              <span style={{ fontSize: '0.85rem', color: '#f1f5f9', flex: 1 }}>{m.name}</span>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{m.duration}</span>
              <span className={`badge ${m.completed ? 'badge-success' : 'badge-locked'}`} style={{ fontSize: '0.68rem' }}>
                {m.completed ? 'Done' : 'Pending'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Submission Notice */}
      <div className="glass-card" style={{ ...styles.formCard, borderColor: 'rgba(16,185,129,0.25)', background: 'rgba(16,185,129,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Sparkles size={20} color="#10b981" />
          </div>
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f1f5f9', marginBottom: '4px' }}>Ready to Submit?</div>
            <div style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.6 }}>
              Once you submit, your HR team will review your onboarding information. You'll receive an email confirmation,
              and your manager will be notified. You can still make changes until your start date.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =============================================
   HELPER COMPONENTS
   ============================================= */
function FormField({ label, icon, children, fullWidth }: { label: string; icon?: ReactNode; children: ReactNode; fullWidth?: boolean }) {
  return (
    <div style={{ ...(fullWidth ? { gridColumn: '1 / -1' } : {}) }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontSize: '0.82rem', fontWeight: 500, color: '#94a3b8' }}>
        {icon && <span style={{ color: '#10b981' }}>{icon}</span>}
        {label}
      </label>
      {children}
    </div>
  );
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '3px', textTransform: 'uppercase' as const, letterSpacing: '0.04em' }}>{label}</div>
      <div style={{ fontSize: '0.88rem', color: '#f1f5f9', fontWeight: 500 }}>{value}</div>
    </div>
  );
}

function SidebarLink({ icon, label, badge }: { icon: ReactNode; label: string; badge?: string }) {
  return (
    <button className="btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', padding: '8px 12px', fontSize: '0.85rem' }}>
      {icon}
      <span style={{ flex: 1, textAlign: 'left' as const }}>{label}</span>
      {badge && (
        <span style={{
          minWidth: 20, height: 20, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(16,185,129,0.2)', color: '#34d399', fontSize: '0.7rem', fontWeight: 700, padding: '0 6px',
        }}>
          {badge}
        </span>
      )}
    </button>
  );
}

function CircularProgress({ percentage }: { percentage: number }) {
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="circular-progress">
      <svg width="120" height="120">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(148,163,184,0.1)" strokeWidth="8" />
        <circle
          cx="60" cy="60" r={radius} fill="none"
          stroke="url(#progressGradient)" strokeWidth="8"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
      </svg>
      <span className="progress-text">{percentage}%</span>
    </div>
  );
}

/* =============================================
   STYLES
   ============================================= */
const styles: Record<string, CSSProperties> = {
  layout: {
    display: 'flex',
    minHeight: '100vh',
  },

  /* Sidebar */
  sidebar: {
    width: '280px',
    minHeight: '100vh',
    borderRight: '1px solid rgba(148,163,184,0.08)',
    background: 'rgba(10,15,26,0.95)',
    backdropFilter: 'blur(20px)',
    position: 'sticky' as const,
    top: 0,
    flexShrink: 0,
    overflowY: 'auto' as const,
  },
  sidebarInner: {
    display: 'flex',
    flexDirection: 'column' as const,
    padding: '20px 16px',
    height: '100%',
    gap: '20px',
  },
  sidebarBrand: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '4px 4px 16px 4px',
    borderBottom: '1px solid rgba(148,163,184,0.08)',
  },
  brandIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    background: 'rgba(16,185,129,0.1)',
    border: '1px solid rgba(16,185,129,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: '1.1rem',
    fontWeight: 700,
    color: '#f1f5f9',
    letterSpacing: '-0.02em',
  },
  brandSub: {
    fontSize: '0.72rem',
    color: '#64748b',
    marginTop: '-2px',
  },
  employeeCard: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    padding: '20px 12px',
    background: 'rgba(15,23,42,0.5)',
    borderRadius: 14,
    border: '1px solid rgba(148,163,184,0.08)',
    gap: '8px',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #10b981, #0d9488)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '4px',
    boxShadow: '0 0 25px rgba(16,185,129,0.25)',
  },
  avatarText: {
    fontSize: '1.2rem',
    fontWeight: 700,
    color: '#fff',
  },
  employeeName: {
    fontSize: '0.95rem',
    fontWeight: 600,
    color: '#f1f5f9',
  },
  employeeRole: {
    fontSize: '0.78rem',
    color: '#94a3b8',
    marginTop: '-4px',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '3px 10px',
    fontSize: '0.68rem',
    fontWeight: 600,
    borderRadius: 9999,
    marginTop: '4px',
  },
  progressSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '12px',
    padding: '8px 0',
  },
  progressMeta: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '2px',
  },
  sidebarSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2px',
  },
  sidebarSectionTitle: {
    fontSize: '0.72rem',
    fontWeight: 600,
    color: '#475569',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    padding: '4px 12px',
    marginBottom: '4px',
  },
  helpCard: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '8px',
    padding: '20px 16px',
    background: 'rgba(20,184,166,0.05)',
    border: '1px solid rgba(20,184,166,0.1)',
    borderRadius: 14,
    textAlign: 'center' as const,
  },
  helpActions: {
    display: 'flex',
    gap: '4px',
    marginTop: '4px',
  },

  /* Main Content */
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    minHeight: '100vh',
    overflow: 'hidden' as const,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '28px 36px 20px',
    borderBottom: '1px solid rgba(148,163,184,0.08)',
    background: 'rgba(10,15,26,0.5)',
    backdropFilter: 'blur(10px)',
  },
  welcomeText: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#f1f5f9',
    marginBottom: '4px',
    letterSpacing: '-0.02em',
  },
  headerSub: {
    fontSize: '0.88rem',
    color: '#94a3b8',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  dateCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 16px',
    background: 'rgba(15,23,42,0.6)',
    border: '1px solid rgba(148,163,184,0.1)',
    borderRadius: 10,
  },

  /* Stepper */
  stepperContainer: {
    padding: '24px 36px',
    borderBottom: '1px solid rgba(148,163,184,0.08)',
    background: 'rgba(10,15,26,0.3)',
  },
  stepper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    position: 'relative' as const,
    flex: 1,
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '8px',
    transition: 'all 0.3s ease',
    position: 'relative' as const,
    zIndex: 2,
  },
  stepCompleted: {
    background: 'linear-gradient(135deg, #10b981, #14b8a6)',
    color: '#fff',
    boxShadow: '0 0 20px rgba(16,185,129,0.3)',
  },
  stepCurrent: {
    background: 'rgba(16,185,129,0.15)',
    border: '2px solid #10b981',
    color: '#10b981',
    boxShadow: '0 0 25px rgba(16,185,129,0.2)',
  },
  stepLocked: {
    background: 'rgba(148,163,184,0.08)',
    border: '2px solid rgba(148,163,184,0.15)',
    color: '#475569',
  },
  stepLabel: {
    fontSize: '0.78rem',
    textAlign: 'center' as const,
    whiteSpace: 'nowrap' as const,
  },
  stepConnector: {
    position: 'absolute' as const,
    top: '20px',
    left: 'calc(50% + 24px)',
    right: 'calc(-50% + 24px)',
    height: '2px',
    borderRadius: '1px',
    zIndex: 1,
  },

  /* Content Area */
  contentArea: {
    flex: 1,
    padding: '28px 36px',
    overflowY: 'auto' as const,
    animation: 'fadeIn 0.35s ease',
  },
  stepHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    marginBottom: '24px',
  },
  stepIconBig: {
    width: 44,
    height: 44,
    borderRadius: 12,
    background: 'rgba(16,185,129,0.1)',
    border: '1px solid rgba(16,185,129,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#10b981',
    flexShrink: 0,
  },
  stepTitle: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#f1f5f9',
    letterSpacing: '-0.01em',
  },
  stepDesc: {
    fontSize: '0.85rem',
    color: '#94a3b8',
    marginTop: '2px',
  },
  formCard: {
    padding: '24px',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '18px',
  },

  /* Documents */
  requiredDocsList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
  },
  requiredDocItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  fileItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '14px 16px',
    background: 'rgba(15,23,42,0.5)',
    borderRadius: 10,
    border: '1px solid rgba(148,163,184,0.08)',
  },
  fileIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    background: 'rgba(20,184,166,0.1)',
    border: '1px solid rgba(20,184,166,0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  /* Equipment */
  equipmentCard: {
    padding: '16px 20px',
  },
  equipmentContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  checkboxOuter: {
    flexShrink: 0,
  },

  /* Training */
  trainingCard: {
    padding: '20px 24px',
  },
  trainingContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },

  /* Review */
  reviewSectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '1px solid rgba(148,163,184,0.08)',
  },
  reviewGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
  },

  /* Navigation */
  navButtons: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginTop: '32px',
    paddingTop: '24px',
    borderTop: '1px solid rgba(148,163,184,0.08)',
  },
};
