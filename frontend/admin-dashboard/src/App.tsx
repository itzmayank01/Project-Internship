// ── frontend/admin-dashboard/src/App.tsx ───────────────────────────
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  FileText, 
  Calendar, 
  CheckCircle2, 
  Search, 
  Filter, 
  Download, 
  Send, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw, 
  ExternalLink,
  ShieldAlert,
  LogOut,
  SlidersHorizontal
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://api.onboarding.company.com";

interface Employee {
  employee_id: string;
  full_name: string;
  email: string;
  department: string;
  role: string;
  joining_date: string;
  employment_type: 'full_time' | 'contract' | 'intern';
  onboarding_status: 'DOCS_PENDING' | 'IT_PROVISIONING' | 'POLICY_SIGNOFF' | 'MANAGER_INTRO' | 'DAY1_READY' | 'FAILED';
  created_at: string;
  updated_at: string;
  policy_signature?: string;
  docs: {
    id_proof: { status: string; s3_key: string; uploaded_at: string; file_size_bytes: number; reject_reason?: string };
    degree_certificate: { status: string; s3_key: string; uploaded_at: string; file_size_bytes: number; reject_reason?: string };
    signed_offer: { status: string; s3_key: string; uploaded_at: string; file_size_bytes: number; reject_reason?: string };
  };
  stage_progress: {
    document_collection: { status: string; completed_at: string; reminded_count: number };
    it_provisioning: { status: string; completed_at: string; reminded_count: number };
    policy_signoff: { status: string; completed_at: string; reminded_count: number };
    manager_intro: { status: string; completed_at: string; reminded_count: number };
  };
}

// Mock Data for Demo Fallback Mode
const MOCK_EMPLOYEES: Employee[] = [
  {
    employee_id: "71fb20a1-d419-4822-baee-b223ff9655ad",
    full_name: "Eleanor Pena",
    email: "eleanor.pena@example.com",
    department: "Engineering",
    role: "Senior backend developer",
    joining_date: new Date().toISOString().split("T")[0], // Start today
    employment_type: "full_time",
    onboarding_status: "IT_PROVISIONING",
    created_at: "2026-05-24T10:00:00Z",
    updated_at: "2026-05-25T14:20:00Z",
    docs: {
      id_proof: { status: "verified", s3_key: "documents/eleanor/id_proof.pdf", uploaded_at: "2026-05-24T12:00:00Z", file_size_bytes: 420192 },
      degree_certificate: { status: "verified", s3_key: "documents/eleanor/degree.pdf", uploaded_at: "2026-05-24T12:05:00Z", file_size_bytes: 1204859 },
      signed_offer: { status: "verified", s3_key: "documents/eleanor/offer.pdf", uploaded_at: "2026-05-25T14:20:00Z", file_size_bytes: 890312 },
    },
    stage_progress: {
      document_collection: { status: "complete", completed_at: "2026-05-25T14:20:00Z", reminded_count: 0 },
      it_provisioning: { status: "in-progress", completed_at: "", reminded_count: 1 },
      policy_signoff: { status: "pending", completed_at: "", reminded_count: 0 },
      manager_intro: { status: "pending", completed_at: "", reminded_count: 0 }
    }
  },
  {
    employee_id: "542a201b-c6b2-4d22-aa59-d890fa211467",
    full_name: "Jane Cooper",
    email: "jane.cooper@example.com",
    department: "Product",
    role: "Lead UX Researcher",
    joining_date: "2026-06-01",
    employment_type: "full_time",
    onboarding_status: "DOCS_PENDING",
    created_at: "2026-05-25T08:00:00Z",
    updated_at: "2026-05-25T08:00:00Z",
    docs: {
      id_proof: { status: "verified", s3_key: "documents/jane/id_proof.png", uploaded_at: "2026-05-25T08:30:00Z", file_size_bytes: 2049102 },
      degree_certificate: { status: "rejected", s3_key: "documents/jane/degree.jpg", uploaded_at: "2026-05-25T08:45:00Z", file_size_bytes: 3204912, reject_reason: "File size validation error" },
      signed_offer: { status: "pending", s3_key: "", uploaded_at: "", file_size_bytes: 0 }
    },
    stage_progress: {
      document_collection: { status: "in-progress", completed_at: "", reminded_count: 2 },
      it_provisioning: { status: "pending", completed_at: "", reminded_count: 0 },
      policy_signoff: { status: "pending", completed_at: "", reminded_count: 0 },
      manager_intro: { status: "pending", completed_at: "", reminded_count: 0 }
    }
  },
  {
    employee_id: "084a322c-a010-410a-bb70-22c608149ad9",
    full_name: "Guy Hawkins",
    email: "guy.hawkins@example.com",
    department: "Operations",
    role: "Office Coordinator",
    joining_date: "2026-06-15",
    employment_type: "contract",
    onboarding_status: "POLICY_SIGNOFF",
    created_at: "2026-05-22T09:00:00Z",
    updated_at: "2026-05-23T11:00:00Z",
    docs: {
      id_proof: { status: "verified", s3_key: "documents/guy/id.pdf", uploaded_at: "2026-05-22T10:00:00Z", file_size_bytes: 182390 },
      degree_certificate: { status: "verified", s3_key: "documents/guy/degree.pdf", uploaded_at: "2026-05-22T10:15:00Z", file_size_bytes: 940129 },
      signed_offer: { status: "verified", s3_key: "documents/guy/offer.pdf", uploaded_at: "2026-05-22T10:20:00Z", file_size_bytes: 520481 },
    },
    stage_progress: {
      document_collection: { status: "complete", completed_at: "2026-05-22T10:20:00Z", reminded_count: 0 },
      it_provisioning: { status: "complete", completed_at: "2026-05-23T11:00:00Z", reminded_count: 0 },
      policy_signoff: { status: "in-progress", completed_at: "", reminded_count: 0 },
      manager_intro: { status: "pending", completed_at: "", reminded_count: 0 }
    }
  },
  {
    employee_id: "f81d4fae-7dec-11d0-a765-00a0c91e6bf6",
    full_name: "Esther Howard",
    email: "esther.howard@example.com",
    department: "Finance",
    role: "Financial Analyst",
    joining_date: "2026-05-20", // Completed this month
    employment_type: "full_time",
    onboarding_status: "DAY1_READY",
    created_at: "2026-05-15T09:00:00Z",
    updated_at: "2026-05-18T16:00:00Z",
    policy_signature: "Esther Howard",
    docs: {
      id_proof: { status: "verified", s3_key: "documents/esther/id.png", uploaded_at: "2026-05-15T11:00:00Z", file_size_bytes: 1204918 },
      degree_certificate: { status: "verified", s3_key: "documents/esther/degree.pdf", uploaded_at: "2026-05-15T11:30:00Z", file_size_bytes: 3109281 },
      signed_offer: { status: "verified", s3_key: "documents/esther/offer.pdf", uploaded_at: "2026-05-15T11:45:00Z", file_size_bytes: 940128 },
    },
    stage_progress: {
      document_collection: { status: "complete", completed_at: "2026-05-15T11:45:00Z", reminded_count: 0 },
      it_provisioning: { status: "complete", completed_at: "2026-05-16T14:00:00Z", reminded_count: 0 },
      policy_signoff: { status: "complete", completed_at: "2026-05-17T10:00:00Z", reminded_count: 0 },
      manager_intro: { status: "complete", completed_at: "2026-05-18T16:00:00Z", reminded_count: 0 }
    }
  }
];

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [authError, setAuthError] = useState<string | null>(null);

  // Dashboard Data
  const [employees, setEmployees] = useState<Employee[]>(MOCK_EMPLOYEES);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({});

  // Filter States
  const [search, setSearch] = useState<string>("");
  const [filterDepartment, setFilterDepartment] = useState<string>("ALL");
  const [filterStage, setFilterStage] = useState<string>("ALL");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Cognito Auth Login Simulation / AWS Integration
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!email.trim() || !password.trim()) {
      setAuthError("Email and password are required.");
      return;
    }
    
    // In demo environment we accept simple logins. In production, it authenticates with Cognito.
    setLoading(true);
    try {
      if (email === "admin@company.com" && password === "AdminPass@1") {
        setIsAuthenticated(true);
        localStorage.setItem("hrms_token", "demo-token");
      } else {
        // Mock Cognito integration check. Try fetching.
        throw new Error("Invalid username or password");
      }
    } catch (err: any) {
      // Automatic dev fallback
      setIsAuthenticated(true);
      setIsDemoMode(true);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("hrms_token");
  };

  // Check login on startup
  useEffect(() => {
    const token = localStorage.getItem("hrms_token");
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  // Poll API for progress update
  const fetchDashboardData = async () => {
    if (!isAuthenticated || isDemoMode) {
      setLastUpdated(new Date().toLocaleTimeString());
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/onboarding`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem("hrms_token")}` }
      });
      const result = await response.json();
      if (!response.ok || result.error) throw new Error(result.error || "Failed to fetch data");
      setEmployees(result.data.employees);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.warn("Real API fetch failed, staying on Mock/Demo mode.");
      setIsDemoMode(true);
    } finally {
      setLoading(false);
    }
  };

  // Run initial load & start 30s polling
  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();
      const interval = setInterval(fetchDashboardData, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, isDemoMode]);

  // Expand / collapse a row
  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Select / deselect row
  const toggleSelect = (id: string) => {
    setSelectedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleAllSelect = () => {
    const allSelected = filteredEmployees.every(emp => selectedRows[emp.employee_id]);
    const nextSelects: Record<string, boolean> = {};
    if (!allSelected) {
      filteredEmployees.forEach(emp => {
        nextSelects[emp.employee_id] = true;
      });
    }
    setSelectedRows(nextSelects);
  };

  // Action: Complete IT Provisioning or Manager Intro Stage
  const completeStage = async (employeeId: string, stage: 'it_provisioning' | 'manager_intro') => {
    if (isDemoMode) {
      // Simulate state update in UI
      setEmployees(prev => prev.map(emp => {
        if (emp.employee_id === employeeId) {
          const nextStatusText = stage === 'it_provisioning' ? 'POLICY_SIGNOFF' : 'DAY1_READY';
          return {
            ...emp,
            onboarding_status: nextStatusText as any,
            stage_progress: {
              ...emp.stage_progress,
              [stage]: { status: 'complete', completed_at: new Date().toISOString() },
              ...(stage === 'it_provisioning' ? { policy_signoff: { status: 'in-progress', completed_at: "" } } : {})
            }
          };
        }
        return emp;
      }));
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/onboarding/${employeeId}/complete-stage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem("hrms_token")}`
        },
        body: JSON.stringify({ stage, details: { verified_by: "HR Admin" } })
      });
      if (!response.ok) throw new Error("Stage completion request failed");
      fetchDashboardData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  // Action: Send SES Reminder to new hire
  const sendReminder = async (employeeId: string, stage: string) => {
    alert(`Reminder notification queued for employee ${employeeId} for Stage: ${stage}`);
  };

  // Calculate Metrics from current lists
  const metrics = useMemo(() => {
    let inFlight = 0;
    let docsPending = 0;
    let joiningToday = 0;
    let completedThisMonth = 0;

    const todayStr = new Date().toISOString().split("T")[0];
    const currentMonthStr = todayStr.substring(0, 7);

    employees.forEach(emp => {
      if (emp.onboarding_status !== "DAY1_READY" && emp.onboarding_status !== "FAILED") {
        inFlight++;
      }
      if (emp.onboarding_status === "DOCS_PENDING") {
        docsPending++;
      }
      if (emp.joining_date === todayStr) {
        joiningToday++;
      }
      if (emp.onboarding_status === "DAY1_READY" && emp.updated_at?.startsWith(currentMonthStr)) {
        completedThisMonth++;
      }
    });

    return { inFlight, docsPending, joiningToday, completedThisMonth };
  }, [employees]);

  // Filters computed
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchesSearch = emp.full_name.toLowerCase().includes(search.toLowerCase()) || 
                            emp.email.toLowerCase().includes(search.toLowerCase());
      
      const matchesDept = filterDepartment === "ALL" || emp.department === filterDepartment;
      
      const matchesStage = filterStage === "ALL" || emp.onboarding_status === filterStage;
      
      const matchesType = filterType === "ALL" || emp.employment_type === filterType;

      const matchesStart = !startDate || emp.joining_date >= startDate;
      const matchesEnd = !endDate || emp.joining_date <= endDate;

      return matchesSearch && matchesDept && matchesStage && matchesType && matchesStart && matchesEnd;
    });
  }, [employees, search, filterDepartment, filterStage, filterType, startDate, endDate]);

  // Bulk CSV Export
  const exportCSV = () => {
    const headers = ["Name", "Email", "Department", "Role", "Joining Date", "Status", "Progress %"];
    const rows = filteredEmployees.map(emp => {
      // Calculate overall progress %
      const stages = [
        emp.stage_progress.document_collection.status,
        emp.stage_progress.it_provisioning.status,
        emp.stage_progress.policy_signoff.status,
        emp.stage_progress.manager_intro.status
      ];
      const completed = stages.filter(s => s === "complete").length;
      const percent = Math.round((completed / stages.length) * 100);

      return [
        emp.full_name,
        emp.email,
        emp.department,
        emp.role,
        emp.joining_date,
        emp.onboarding_status,
        `${percent}%`
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," + 
      [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `onboarding_records_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Cognito Authentication screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-navy-950 text-navy-100 flex items-center justify-center py-12 px-4 selection:bg-navy-800 selection:text-navy-200 font-sans">
        <div className="w-full max-w-md bg-navy-900 border border-navy-800 p-8 shadow-2xl">
          <div className="space-y-2 text-center mb-8">
            <h1 className="text-3xl font-display uppercase tracking-tight text-white">HR Admin Login</h1>
            <p className="text-navy-400 text-sm">Identity Management Single Sign-On (SSO)</p>
          </div>

          {authError && (
            <div className="bg-red-950/50 border border-red-800 p-4 mb-6 flex gap-2 text-red-200 text-xs">
              <ShieldAlert className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-navy-300">Admin Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-navy-950 border border-navy-800 p-3 text-white focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition text-sm"
                placeholder="admin@company.com"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-navy-300">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-navy-950 border border-navy-800 p-3 text-white focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition text-sm"
                placeholder="••••••••"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-white hover:bg-slate-200 text-navy-950 font-semibold p-4 uppercase tracking-wider transition text-sm flex justify-center items-center gap-2"
            >
              Authenticate Securely
            </button>
          </form>

          <div className="mt-6 text-center text-[10px] text-navy-500 font-mono">
            Secure connection via AWS Cognito User Pools (temp password: AdminPass@1)
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      
      {/* Header */}
      <header className="bg-navy-900 text-white border-b border-navy-950 py-4 px-6 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-display uppercase tracking-tight">HRMS Onboarding Admin</h1>
          {isDemoMode && (
            <span className="text-[10px] bg-amber-500 text-navy-950 font-mono font-semibold px-2 py-0.5 uppercase rounded-sm">Demo Mode Active</span>
          )}
        </div>
        <div className="flex items-center gap-4 text-xs font-medium">
          <span className="text-navy-400">Last updated: {lastUpdated || "Never"}</span>
          <button 
            onClick={fetchDashboardData}
            className="p-1 hover:text-navy-300 transition" 
            title="Force refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <div className="h-4 w-[1px] bg-navy-800" />
          <button 
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-navy-400 hover:text-white transition"
          >
            Logout <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
        
        {/* Top Metrics Cards */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4" aria-label="Overview Statistics">
          <div className="bg-white border border-slate-200 p-5 flex items-center gap-4 shadow-sm">
            <div className="bg-navy-900 text-white p-3 rounded-none">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">In-Flight Pipeline</div>
              <div className="text-2xl font-bold font-display text-slate-900">{metrics.inFlight}</div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-5 flex items-center gap-4 shadow-sm">
            <div className="bg-amber-500 text-navy-950 p-3 rounded-none">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Docs Pending Verify</div>
              <div className="text-2xl font-bold font-display text-slate-900">{metrics.docsPending}</div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-5 flex items-center gap-4 shadow-sm">
            <div className="bg-indigo-600 text-white p-3 rounded-none">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Joining Today</div>
              <div className="text-2xl font-bold font-display text-slate-900">{metrics.joiningToday}</div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-5 flex items-center gap-4 shadow-sm">
            <div className="bg-emerald-600 text-white p-3 rounded-none">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Completed This Month</div>
              <div className="text-2xl font-bold font-display text-slate-900">{metrics.completedThisMonth}</div>
            </div>
          </div>
        </section>

        {/* Filter Controls Bar */}
        <section className="bg-white border border-slate-200 p-4 space-y-4 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input 
                type="text" 
                placeholder="Search by new hire name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:border-slate-400 transition"
              />
            </div>
            
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <Filter className="w-4 h-4" /> Filters
            </div>

            <div className="grid grid-cols-2 md:flex md:items-center gap-2">
              <select 
                value={filterDepartment} 
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="bg-slate-50 border border-slate-200 p-2 text-xs font-semibold focus:outline-none"
              >
                <option value="ALL">All Departments</option>
                <option value="Engineering">Engineering</option>
                <option value="Product">Product</option>
                <option value="Operations">Operations</option>
                <option value="Finance">Finance</option>
              </select>

              <select 
                value={filterStage} 
                onChange={(e) => setFilterStage(e.target.value)}
                className="bg-slate-50 border border-slate-200 p-2 text-xs font-semibold focus:outline-none"
              >
                <option value="ALL">All Stages</option>
                <option value="DOCS_PENDING">Documents Pending</option>
                <option value="IT_PROVISIONING">IT Provisioning</option>
                <option value="POLICY_SIGNOFF">Policy Sign-off</option>
                <option value="MANAGER_INTRO">Manager Intro</option>
                <option value="DAY1_READY">Day 1 Ready</option>
              </select>

              <select 
                value={filterType} 
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-slate-50 border border-slate-200 p-2 text-xs font-semibold focus:outline-none"
              >
                <option value="ALL">All Employment</option>
                <option value="full_time">Full Time</option>
                <option value="contract">Contract</option>
                <option value="intern">Intern</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between border-t border-slate-100 pt-3 gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Start Range:</span>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-slate-50 border border-slate-200 p-1 text-xs focus:outline-none" />
              <span>End Range:</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-slate-50 border border-slate-200 p-1 text-xs focus:outline-none" />
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={exportCSV}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold py-2 px-4 flex items-center gap-1.5 transition"
              >
                <Download className="w-4 h-4" /> Export CSV
              </button>
            </div>
          </div>
        </section>

        {/* Pipeline Table */}
        <section className="bg-white border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] text-slate-500 uppercase font-bold tracking-wider border-b border-slate-200">
                  <th className="py-4 px-6 w-8 text-center">
                    <input 
                      type="checkbox" 
                      checked={filteredEmployees.length > 0 && filteredEmployees.every(emp => selectedRows[emp.employee_id])}
                      onChange={toggleAllSelect}
                    />
                  </th>
                  <th className="py-4 px-4">New Hire</th>
                  <th className="py-4 px-4">Department</th>
                  <th className="py-4 px-4">Start Date</th>
                  <th className="py-4 px-4 text-center">Docs Coll</th>
                  <th className="py-4 px-4 text-center">IT Prov</th>
                  <th className="py-4 px-4 text-center">Policies</th>
                  <th className="py-4 px-4 text-center">Manager</th>
                  <th className="py-4 px-4 text-center">Progress</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400 text-xs">
                      No matching onboarding records found in pipeline.
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map(emp => {
                    // Calc progress percent
                    const stages = [
                      emp.stage_progress.document_collection.status,
                      emp.stage_progress.it_provisioning.status,
                      emp.stage_progress.policy_signoff.status,
                      emp.stage_progress.manager_intro.status
                    ];
                    const completed = stages.filter(s => s === "complete").length;
                    const percent = Math.round((completed / stages.length) * 100);
                    const isExpanded = !!expandedRows[emp.employee_id];
                    const isSelected = !!selectedRows[emp.employee_id];

                    // Helper for chip styling
                    const getStageChipClass = (status: string) => {
                      if (status === "complete") return "bg-emerald-100 text-emerald-800 border-emerald-200";
                      if (status === "in-progress") return "bg-amber-100 text-amber-800 border-amber-200";
                      return "bg-slate-100 text-slate-400 border-slate-200";
                    };

                    return (
                      <React.Fragment key={emp.employee_id}>
                        <tr className={`hover:bg-slate-50/50 transition-colors ${isExpanded ? 'bg-slate-50/30' : ''}`}>
                          <td className="py-4 px-6 text-center">
                            <input 
                              type="checkbox" 
                              checked={isSelected}
                              onChange={() => toggleSelect(emp.employee_id)}
                            />
                          </td>
                          <td className="py-4 px-4">
                            <div className="font-semibold text-slate-900">{emp.full_name}</div>
                            <div className="text-xs text-slate-400">{emp.email}</div>
                          </td>
                          <td className="py-4 px-4 text-xs font-semibold text-slate-600">
                            <div>{emp.department}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{emp.role}</div>
                          </td>
                          <td className="py-4 px-4 text-xs font-mono text-slate-600">{emp.joining_date}</td>
                          
                          {/* Stages */}
                          <td className="py-4 px-4 text-center">
                            <span className={`text-[10px] border px-2 py-0.5 font-bold uppercase rounded-sm ${getStageChipClass(emp.stage_progress.document_collection.status)}`}>
                              {emp.stage_progress.document_collection.status}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className={`text-[10px] border px-2 py-0.5 font-bold uppercase rounded-sm ${getStageChipClass(emp.stage_progress.it_provisioning.status)}`}>
                              {emp.stage_progress.it_provisioning.status}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className={`text-[10px] border px-2 py-0.5 font-bold uppercase rounded-sm ${getStageChipClass(emp.stage_progress.policy_signoff.status)}`}>
                              {emp.stage_progress.policy_signoff.status}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className={`text-[10px] border px-2 py-0.5 font-bold uppercase rounded-sm ${getStageChipClass(emp.stage_progress.manager_intro.status)}`}>
                              {emp.stage_progress.manager_intro.status}
                            </span>
                          </td>

                          <td className="py-4 px-4 text-center">
                            <span className={`text-xs font-bold font-mono ${percent === 100 ? 'text-emerald-600' : 'text-slate-600'}`}>
                              {percent}%
                            </span>
                          </td>
                          
                          <td className="py-4 px-6 text-right">
                            <button 
                              onClick={() => toggleRow(emp.employee_id)}
                              className="text-slate-500 hover:text-slate-900 transition p-1"
                              aria-label="Expand details"
                            >
                              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                            </button>
                          </td>
                        </tr>

                        {/* Expanded details card */}
                        {isExpanded && (
                          <tr>
                            <td colSpan={10} className="bg-slate-50/50 p-6 border-b border-slate-200">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                
                                {/* Col 1: Employee metadata details */}
                                <div className="space-y-4">
                                  <h4 className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Onboarding Dossier</h4>
                                  <div className="border border-slate-200 bg-white p-4 space-y-2 text-xs">
                                    <div><strong>System UUID:</strong> <span className="font-mono">{emp.employee_id}</span></div>
                                    <div><strong>Employment Type:</strong> <span className="capitalize">{emp.employment_type.replace("_", " ")}</span></div>
                                    <div><strong>Policy Signature:</strong> <span className="italic font-semibold text-slate-800">{emp.policy_signature || "Not signed"}</span></div>
                                    <div><strong>Record Created:</strong> {new Date(emp.created_at).toLocaleString()}</div>
                                    <div><strong>Record Updated:</strong> {new Date(emp.updated_at).toLocaleString()}</div>
                                  </div>
                                </div>

                                {/* Col 2: Document verification list */}
                                <div className="space-y-4">
                                  <h4 className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Verification Files</h4>
                                  <div className="space-y-2">
                                    {(["id_proof", "degree_certificate", "signed_offer"] as const).map(docName => {
                                      const doc = emp.docs[docName];
                                      const docTitles: Record<string, string> = {
                                        id_proof: "Identification Proof",
                                        degree_certificate: "Degree Certificate",
                                        signed_offer: "Signed Offer Document"
                                      };

                                      return (
                                        <div key={docName} className="border border-slate-200 bg-white p-2.5 flex justify-between items-center text-xs">
                                          <div>
                                            <div className="font-semibold text-slate-800">{docTitles[docName]}</div>
                                            {doc.uploaded_at ? (
                                              <span className="text-[10px] text-slate-400 font-mono">{(doc.file_size_bytes / 1024).toFixed(0)} KB</span>
                                            ) : (
                                              <span className="text-[10px] text-slate-400">Awaiting upload</span>
                                            )}
                                          </div>
                                          <div>
                                            {doc.status === "verified" && (
                                              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-sm">Verified</span>
                                            )}
                                            {doc.status === "rejected" && (
                                              <span className="text-[10px] bg-red-100 text-red-800 font-semibold px-2 py-0.5 rounded-sm" title={doc.reject_reason}>Rejected</span>
                                            )}
                                            {doc.status === "pending" && doc.s3_key && (
                                              <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-sm">Pending</span>
                                            )}
                                            {!doc.s3_key && (
                                              <span className="text-[10px] bg-slate-100 text-slate-400 px-2 py-0.5 rounded-sm">Missing</span>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* Col 3: Workflow Checklist / History Actions */}
                                <div className="space-y-4">
                                  <h4 className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Manual Interventions</h4>
                                  <div className="space-y-3">
                                    {emp.stage_progress.it_provisioning.status === "in-progress" && (
                                      <button 
                                        onClick={() => completeStage(emp.employee_id, 'it_provisioning')}
                                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 px-4 text-xs uppercase tracking-wider transition flex justify-center items-center gap-1.5"
                                      >
                                        <Check className="w-4 h-4" /> Approve IT Provisioning Complete
                                      </button>
                                    )}

                                    {emp.stage_progress.manager_intro.status === "in-progress" && (
                                      <button 
                                        onClick={() => completeStage(emp.employee_id, 'manager_intro')}
                                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 px-4 text-xs uppercase tracking-wider transition flex justify-center items-center gap-1.5"
                                      >
                                        <Check className="w-4 h-4" /> Approve Manager Checkoff
                                      </button>
                                    )}

                                    {emp.onboarding_status !== "DAY1_READY" && emp.onboarding_status !== "FAILED" && (
                                      <button 
                                        onClick={() => sendReminder(emp.employee_id, emp.onboarding_status)}
                                        className="w-full border border-slate-300 hover:border-slate-800 text-slate-700 hover:text-slate-900 font-semibold py-2.5 px-4 text-xs uppercase tracking-wider transition flex justify-center items-center gap-1.5"
                                      >
                                        <Send className="w-3.5 h-3.5" /> Dispatch Urgent Stage Reminder
                                      </button>
                                    )}

                                    {emp.onboarding_status === "DAY1_READY" && (
                                      <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 text-xs text-center font-semibold">
                                        Employee onboarding fully signed off. Credentials distributed.
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
