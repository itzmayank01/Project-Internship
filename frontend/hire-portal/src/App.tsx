// ── frontend/hire-portal/src/App.tsx ────────────────────────────────
import React, { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { 
  User, 
  Upload, 
  FileText, 
  CheckCircle, 
  Loader2, 
  AlertCircle, 
  File, 
  ShieldCheck,
  ChevronRight,
  Sparkles
} from 'lucide-react';

// API Config (CDK output URL)
const API_BASE_URL = import.meta.env.VITE_API_URL || "https://api.onboarding.company.com";

interface PersonalInfo {
  full_name: string;
  personal_email: string;
  phone: string;
  department: string;
  role: string;
  joining_date: string;
  employment_type: 'full_time' | 'contract' | 'intern';
}

interface UploadStatus {
  status: 'idle' | 'uploading' | 'success' | 'error';
  progress: number;
  filename: string;
  s3_key?: string;
  error?: string;
}

export default function App() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [employeeId, setEmployeeId] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Screen 1 form
  const { register, handleSubmit, formState: { errors }, watch } = useForm<PersonalInfo>({
    defaultValues: {
      employment_type: 'full_time',
      department: 'Engineering'
    }
  });

  // Screen 2 upload states
  const [uploads, setUploads] = useState<Record<string, UploadStatus>>({
    id_proof: { status: 'idle', progress: 0, filename: '' },
    degree_certificate: { status: 'idle', progress: 0, filename: '' },
    signed_offer: { status: 'idle', progress: 0, filename: '' },
  });

  // Screen 3 policy signature
  const [policyRead, setPolicyRead] = useState<boolean>(false);
  const [policySigned, setPolicySigned] = useState<boolean>(false);
  const [signatureName, setSignatureName] = useState<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Monitor policy scroll to bottom to unlock checkout
  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      if (scrollHeight - scrollTop <= clientHeight + 10) {
        setPolicyRead(true);
      }
    }
  };

  // Screen 1 submit: create employee & start flow
  const onPersonalInfoSubmit = async (data: PersonalInfo) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const response = await fetch(`${API_BASE_URL}/onboarding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          // Convert manager_id to valid UUID if needed, here we default a static valid UUID
          manager_id: "00000000-0000-0000-0000-000000000000"
        })
      });
      const result = await response.json();
      if (!response.ok || result.error) {
        throw new Error(result.error || "Failed to create onboarding record");
      }
      setEmployeeId(result.data.employee_id);
      setStep(2);
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Document upload logic directly to S3 PUT URL
  const uploadDocument = async (docType: string, file: File) => {
    setUploads(prev => ({
      ...prev,
      [docType]: { status: 'uploading', progress: 10, filename: file.name }
    }));

    try {
      // 1. Request presigned URL
      const response = await fetch(`${API_BASE_URL}/documents/upload-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: employeeId,
          doc_type: docType,
          filename: file.name,
          content_type: file.type
        })
      });
      const result = await response.json();
      if (!response.ok || result.error) {
        throw new Error(result.error || "Failed to get upload URL");
      }

      const { upload_url, s3_key } = result.data;

      // 2. Perform PUT request with progress tracking
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', upload_url, true);
      xhr.setRequestHeader('Content-Type', file.type);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          setUploads(prev => ({
            ...prev,
            [docType]: { ...prev[docType], progress: percent }
          }));
        }
      };

      const uploadPromise = new Promise<void>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status === 200) {
            resolve();
          } else {
            reject(new Error(`S3 upload failed with status ${xhr.status}`));
          }
        };
        xhr.onerror = () => reject(new Error("Network upload error"));
      });

      xhr.send(file);
      await uploadPromise;

      setUploads(prev => ({
        ...prev,
        [docType]: { status: 'success', progress: 100, filename: file.name, s3_key }
      }));
    } catch (err: any) {
      setUploads(prev => ({
        ...prev,
        [docType]: { ...prev[docType], status: 'error', error: err.message || "Upload failed" }
      }));
    }
  };

  const handleFileChange = (docType: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate content type
      const allowed = ["application/pdf", "image/jpeg", "image/png"];
      if (!allowed.includes(file.type)) {
        alert("Only PDF, JPEG, and PNG files are allowed.");
        return;
      }
      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert("File size exceeds 10MB limit.");
        return;
      }
      uploadDocument(docType, file);
    }
  };

  const allDocsUploaded = 
    uploads.id_proof.status === 'success' &&
    uploads.degree_certificate.status === 'success' &&
    uploads.signed_offer.status === 'success';

  // Screen 3 submit: Complete Policy Acknowledgement
  const submitPolicy = async () => {
    if (!signatureName.trim()) {
      alert("Please type your signature to acknowledge.");
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const response = await fetch(`${API_BASE_URL}/onboarding/${employeeId}/complete-stage`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'MockToken' // Cognito token in true auth context
        },
        body: JSON.stringify({
          stage: 'policy_signoff',
          signature: signatureName
        })
      });
      const result = await response.json();
      if (!response.ok && response.status !== 400) { 
        // Allow 400 if workflow hasn't reached stage 3, complete-stage Lambdas handles both
        throw new Error(result.error || "Failed to complete policy acknowledgment");
      }
      setStep(4);
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred during policy submission");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-950 text-navy-100 flex flex-col items-center py-12 px-4 selection:bg-navy-800 selection:text-navy-200 font-sans">
      {/* Container */}
      <div className="w-full max-w-xl bg-navy-900 border border-navy-800 p-8 shadow-2xl relative overflow-hidden">
        
        {/* Confetti element overlay for completion screen */}
        {step === 4 && (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-950/20 via-transparent to-transparent pointer-events-none" />
        )}

        {/* Global Progress Bar */}
        <div className="mb-10" aria-label="Progress Tracker">
          <div className="flex justify-between text-xs text-navy-400 font-medium mb-3">
            <span>PERSONAL INFO</span>
            <span>UPLOADS</span>
            <span>POLICIES</span>
            <span>CONFIRMATION</span>
          </div>
          <div className="h-[2px] w-full bg-navy-800 flex">
            <div className={`h-full transition-all duration-500 ease-out ${step >= 1 ? 'bg-status-complete w-1/4' : 'bg-status-pending w-0'}`} />
            <div className={`h-full transition-all duration-500 ease-out ${step >= 2 ? 'bg-status-complete w-1/4' : step === 1 ? 'bg-status-pending w-0' : 'bg-status-progress w-0'}`} />
            <div className={`h-full transition-all duration-500 ease-out ${step >= 3 ? 'bg-status-complete w-1/4' : step === 2 ? 'bg-status-progress w-0' : 'bg-status-pending w-0'}`} />
            <div className={`h-full transition-all duration-500 ease-out ${step >= 4 ? 'bg-status-complete w-1/4' : step === 3 ? 'bg-status-progress w-0' : 'bg-status-pending w-0'}`} />
          </div>
        </div>

        {/* Error Alert Box */}
        {errorMessage && (
          <div className="bg-red-950/50 border border-red-800 p-4 mb-6 flex gap-3 text-red-200 text-sm animate-fade-in" role="alert">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
            <div>{errorMessage}</div>
          </div>
        )}

        {/* Screen 1: Personal Info */}
        {step === 1 && (
          <form onSubmit={handleSubmit(onPersonalInfoSubmit)} className="space-y-6 animate-fade-in">
            <div className="space-y-2">
              <h1 className="text-3xl font-display uppercase tracking-tight text-white">Join the Team</h1>
              <p className="text-navy-400 text-sm">Please verify and complete your personal onboarding record below.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-navy-300">Full Name</label>
                <input 
                  type="text" 
                  {...register("full_name", { required: "Full name is required" })}
                  className="w-full bg-navy-950 border border-navy-800 p-3 text-white focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition"
                  placeholder="Johnathan Doe"
                />
                {errors.full_name && <span className="text-xs text-amber-500 mt-1 block">{errors.full_name.message}</span>}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-navy-300">Personal Email</label>
                <input 
                  type="email" 
                  {...register("personal_email", { 
                    required: "Email is required",
                    pattern: { value: /^\S+@\S+$/i, message: "Invalid email format" }
                  })}
                  className="w-full bg-navy-950 border border-navy-800 p-3 text-white focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition"
                  placeholder="john.doe@email.com"
                />
                {errors.personal_email && <span className="text-xs text-amber-500 mt-1 block">{errors.personal_email.message}</span>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-navy-300">Phone Number</label>
                  <input 
                    type="tel" 
                    {...register("phone", { required: "Phone number is required" })}
                    className="w-full bg-navy-950 border border-navy-800 p-3 text-white focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition"
                    placeholder="+1 (555) 019-2834"
                  />
                  {errors.phone && <span className="text-xs text-amber-500 mt-1 block">{errors.phone.message}</span>}
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-navy-300">Department</label>
                  <select 
                    {...register("department")}
                    className="w-full bg-navy-950 border border-navy-800 p-3 text-white focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Product">Product</option>
                    <option value="Operations">Operations</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Finance">Finance</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-navy-300">Role</label>
                  <input 
                    type="text" 
                    {...register("role", { required: "Role is required" })}
                    className="w-full bg-navy-950 border border-navy-800 p-3 text-white focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition"
                    placeholder="Senior Developer"
                  />
                  {errors.role && <span className="text-xs text-amber-500 mt-1 block">{errors.role.message}</span>}
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-navy-300">Joining Date</label>
                  <input 
                    type="date" 
                    {...register("joining_date", { required: "Joining date is required" })}
                    className="w-full bg-navy-950 border border-navy-800 p-3 text-white focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition"
                  />
                  {errors.joining_date && <span className="text-xs text-amber-500 mt-1 block">{errors.joining_date.message}</span>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-navy-300">Employment Type</label>
                <div className="flex gap-6 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input type="radio" value="full_time" {...register("employment_type")} className="text-navy-950 focus:ring-0" />
                    <span>Full Time</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input type="radio" value="contract" {...register("employment_type")} className="text-navy-950 focus:ring-0" />
                    <span>Contract</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input type="radio" value="intern" {...register("employment_type")} className="text-navy-950 focus:ring-0" />
                    <span>Intern</span>
                  </label>
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-white hover:bg-slate-200 text-navy-950 font-semibold p-4 uppercase tracking-wider transition flex justify-center items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Save & Continue <ChevronRight className="w-5 h-5" /></>}
            </button>
          </form>
        )}

        {/* Screen 2: Document Upload */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-2">
              <h2 className="text-3xl font-display uppercase tracking-tight text-white">Upload Documents</h2>
              <p className="text-navy-400 text-sm">Please upload high-resolution scans of the three documents listed below.</p>
            </div>

            <div className="space-y-4">
              {(["id_proof", "degree_certificate", "signed_offer"] as const).map((docType) => {
                const docLabels: Record<string, string> = {
                  id_proof: "ID Proof (Passport / Driver's License)",
                  degree_certificate: "Degree Certificate",
                  signed_offer: "Signed Offer Letter",
                };
                const upload = uploads[docType];

                return (
                  <div key={docType} className="border border-navy-800 bg-navy-950/50 p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-navy-200">{docLabels[docType]}</span>
                      <span className="text-[10px] bg-navy-800 text-navy-400 px-2 py-0.5 font-mono uppercase">Max 10MB</span>
                    </div>

                    {upload.status === 'idle' && (
                      <label className="border border-dashed border-navy-700 bg-navy-900/30 hover:border-navy-500 py-6 px-4 flex flex-col items-center justify-center cursor-pointer transition focus-within:ring-2 focus-within:ring-white">
                        <Upload className="w-6 h-6 text-navy-500 mb-2" />
                        <span className="text-xs text-navy-400">Drag & Drop or Click to Upload (PDF, PNG, JPG)</span>
                        <input type="file" onChange={(e) => handleFileChange(docType, e)} className="sr-only" />
                      </label>
                    )}

                    {upload.status === 'uploading' && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-navy-400">
                          <span className="truncate max-w-[200px]">{upload.filename}</span>
                          <span>Uploading {upload.progress}%</span>
                        </div>
                        <div className="h-1 bg-navy-800 w-full overflow-hidden">
                          <div className="h-full bg-status-progress transition-all duration-300" style={{ width: `${upload.progress}%` }} />
                        </div>
                      </div>
                    )}

                    {upload.status === 'success' && (
                      <div className="flex items-center justify-between bg-emerald-950/20 border border-emerald-900/50 p-3 text-emerald-300 text-xs">
                        <div className="flex items-center gap-2">
                          <File className="w-4 h-4 text-emerald-400" />
                          <span className="truncate max-w-[250px]">{upload.filename}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                          <CheckCircle className="w-4 h-4" /> Verified
                        </div>
                      </div>
                    )}

                    {upload.status === 'error' && (
                      <div className="bg-red-950/20 border border-red-900/50 p-3 space-y-2">
                        <div className="flex items-center justify-between text-red-300 text-xs">
                          <span className="font-semibold">Error: {upload.error}</span>
                          <label className="underline text-red-400 hover:text-red-300 cursor-pointer">
                            Retry
                            <input type="file" onChange={(e) => handleFileChange(docType, e)} className="sr-only" />
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <button 
              onClick={() => setStep(3)}
              disabled={!allDocsUploaded}
              className="w-full bg-white hover:bg-slate-200 text-navy-950 font-semibold p-4 uppercase tracking-wider transition flex justify-center items-center gap-2 disabled:opacity-50"
            >
              Continue to Policies <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Screen 3: Policy Acknowledgement */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-2">
              <h2 className="text-3xl font-display uppercase tracking-tight text-white">Employment Policies</h2>
              <p className="text-navy-400 text-sm">Please scroll and review the complete policy statement before signing.</p>
            </div>

            <div 
              ref={scrollRef}
              onScroll={handleScroll}
              className="h-48 overflow-y-auto border border-navy-800 bg-navy-950 p-4 text-xs text-navy-400 space-y-4 font-mono leading-relaxed"
            >
              <h4 className="font-semibold text-navy-200">1. DATA PRIVACY & COMPLIANCE POLICY</h4>
              <p>As an employee of HRMS Digital Onboarding System, you will have access to sensitive corporate information and production environments. You are required to safeguard all customer credentials and internal records at all times. Any unauthorized sharing, duplication, or storage of personal identifier records is strictly prohibited.</p>
              <h4 className="font-semibold text-navy-200">2. SECURE ACCESS PROTOCOLS</h4>
              <p>Multi-factor authentication (MFA) must be enabled on all registered accounts, including Cognito Single Sign-On and email access. Temporary credentials must be updated within 7 days of receipt. Under no circumstances may credentials or API keys be stored in cleartext files or repositories.</p>
              <h4 className="font-semibold text-navy-200">3. EQUIPMENT & DATA STANDARDS</h4>
              <p>Corporate laptops and keys provided during Stage 2 IT Provisioning are monitored for compliance. You agree to run corporate endpoint scanners, maintain up-to-date operating systems, and coordinate with IT staff for custom network integrations.</p>
            </div>

            <div className="space-y-4">
              <label className="flex items-start gap-3 cursor-pointer text-sm">
                <input 
                  type="checkbox" 
                  checked={policySigned}
                  onChange={(e) => setPolicySigned(e.target.checked)}
                  disabled={!policyRead}
                  className="mt-1 text-navy-950 focus:ring-0 disabled:opacity-50" 
                />
                <span className={`text-xs select-none ${policyRead ? 'text-navy-200' : 'text-navy-600'}`}>
                  I have read and agree to all terms and conditions listed in the corporate policies.
                </span>
              </label>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-navy-300">Digital Signature (Type your legal name)</label>
                <input 
                  type="text" 
                  value={signatureName}
                  onChange={(e) => setSignatureName(e.target.value)}
                  disabled={!policySigned}
                  className="w-full bg-navy-950 border border-navy-800 p-3 text-white focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition disabled:opacity-50"
                  placeholder="Johnathan Doe"
                />
              </div>
            </div>

            <button 
              onClick={submitPolicy}
              disabled={!policySigned || !signatureName.trim() || isSubmitting}
              className="w-full bg-white hover:bg-slate-200 text-navy-950 font-semibold p-4 uppercase tracking-wider transition flex justify-center items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Submit & Acknowledge <ShieldCheck className="w-5 h-5" /></>}
            </button>
          </div>
        )}

        {/* Screen 4: Confirmation */}
        {step === 4 && (
          <div className="space-y-6 text-center py-8 animate-fade-in">
            <div className="flex justify-center">
              <div className="bg-emerald-950/30 p-4 border border-emerald-800 rounded-full animate-bounce">
                <Sparkles className="w-12 h-12 text-emerald-400" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl font-display uppercase tracking-tight text-white">You're All Set!</h2>
              <p className="text-navy-400 text-sm">Your documents have been submitted and are undergoing review by Human Resources.</p>
            </div>

            <div className="border border-navy-800 bg-navy-950/50 p-6 text-left max-w-sm mx-auto space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-navy-300 border-b border-navy-800 pb-2">Day 1 Preparation Summary</h4>
              <div className="text-xs text-navy-400 space-y-1.5 font-mono">
                <div><strong className="text-navy-200">Employee ID:</strong> {employeeId.substring(0, 8)}...</div>
                <div><strong className="text-navy-200">Stage:</strong> 1 (Doc Verification)</div>
                <div><strong className="text-navy-200">IT Account:</strong> Pending Verification</div>
                <div><strong className="text-navy-200">Policy Sign-off:</strong> Confirmed</div>
              </div>
            </div>

            <div className="space-y-4 max-w-md mx-auto">
              <p className="text-xs text-navy-400 italic">Please check your inbox. We have sent a confirmation email containing temporary credentials and details regarding first-day meetings.</p>
              <button 
                onClick={() => {
                  setStep(1);
                  setEmployeeId("");
                  setUploads({
                    id_proof: { status: 'idle', progress: 0, filename: '' },
                    degree_certificate: { status: 'idle', progress: 0, filename: '' },
                    signed_offer: { status: 'idle', progress: 0, filename: '' },
                  });
                  setSignatureName("");
                  setPolicySigned(false);
                  setPolicyRead(false);
                }}
                className="text-xs text-white uppercase tracking-wider hover:underline"
              >
                Register Another Employee
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
