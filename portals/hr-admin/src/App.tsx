import { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  FileText,
  Settings,
  Search,
  Bell,
  ChevronUp,
  ChevronDown,
  TrendingUp,
  UserPlus,
  Clock,
  CheckCircle2,
  FileCheck,
  Filter,
  MoreHorizontal,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Award,
  Shield,
  Globe,
  Palette,
  BellRing,
  Lock,
  Database,
  Download,
  X,
  Check,
  FileSpreadsheet,
  File,
  Image,
  Building2,
  Briefcase,
  GraduationCap,
  Monitor,
} from 'lucide-react';
import './index.css';

/* ============================================================
   TYPE DEFINITIONS
   ============================================================ */

type PageId = 'dashboard' | 'employees' | 'onboarding' | 'documents' | 'settings';

interface NavItem {
  id: PageId;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

interface Employee {
  id: number;
  name: string;
  email: string;
  department: string;
  role: string;
  status: 'active' | 'on-leave' | 'probation';
  location: string;
  phone: string;
  startDate: string;
  avatar: string;
}

interface OnboardingEntry {
  id: number;
  name: string;
  department: string;
  role: string;
  stage: string;
  status: 'complete' | 'in-progress' | 'pending';
  startDate: string;
  avatar: string;
}

interface KanbanCard {
  id: number;
  name: string;
  role: string;
  department: string;
  date: string;
  avatar: string;
}

interface DocumentItem {
  id: number;
  title: string;
  employee: string;
  type: 'pdf' | 'doc' | 'spreadsheet' | 'image';
  size: string;
  submittedDate: string;
  category: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface PipelineStage {
  label: string;
  count: number;
  total: number;
}

/* ============================================================
   MOCK DATA
   ============================================================ */

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { id: 'employees', label: 'Employees', icon: <Users size={20} />, badge: 847 },
  { id: 'onboarding', label: 'Onboarding', icon: <ClipboardList size={20} />, badge: 23 },
  { id: 'documents', label: 'Documents', icon: <FileText size={20} />, badge: 12 },
  { id: 'settings', label: 'Settings', icon: <Settings size={20} /> },
];

const recentOnboardings: OnboardingEntry[] = [
  { id: 1, name: 'Sarah Chen', department: 'Engineering', role: 'Senior Frontend Developer', stage: 'IT Setup', status: 'in-progress', startDate: '2026-05-20', avatar: 'SC' },
  { id: 2, name: 'Marcus Johnson', department: 'Marketing', role: 'Content Strategist', stage: 'Training', status: 'in-progress', startDate: '2026-05-18', avatar: 'MJ' },
  { id: 3, name: 'Priya Patel', department: 'Design', role: 'UX Researcher', stage: 'Document Collection', status: 'pending', startDate: '2026-05-22', avatar: 'PP' },
  { id: 4, name: 'James Wilson', department: 'Sales', role: 'Account Executive', stage: 'Complete', status: 'complete', startDate: '2026-05-10', avatar: 'JW' },
  { id: 5, name: 'Emily Rodriguez', department: 'HR', role: 'Talent Acquisition Spec.', stage: 'Training', status: 'in-progress', startDate: '2026-05-15', avatar: 'ER' },
  { id: 6, name: 'David Kim', department: 'Engineering', role: 'Backend Engineer', stage: 'IT Setup', status: 'pending', startDate: '2026-05-24', avatar: 'DK' },
];

const pipelineStages: PipelineStage[] = [
  { label: 'Document Collection', count: 8, total: 23 },
  { label: 'IT Setup', count: 6, total: 23 },
  { label: 'Training', count: 5, total: 23 },
  { label: 'Complete', count: 4, total: 23 },
];

const allEmployees: Employee[] = [
  { id: 1, name: 'Alice Morgan', email: 'alice.morgan@company.com', department: 'Engineering', role: 'Staff Engineer', status: 'active', location: 'San Francisco', phone: '+1 415-555-0101', startDate: '2022-03-15', avatar: 'AM' },
  { id: 2, name: 'Brian Foster', email: 'brian.foster@company.com', department: 'Marketing', role: 'Marketing Director', status: 'active', location: 'New York', phone: '+1 212-555-0102', startDate: '2021-06-01', avatar: 'BF' },
  { id: 3, name: 'Carmen Diaz', email: 'carmen.diaz@company.com', department: 'Design', role: 'Lead Designer', status: 'on-leave', location: 'Austin', phone: '+1 512-555-0103', startDate: '2023-01-10', avatar: 'CD' },
  { id: 4, name: 'Derek Chang', email: 'derek.chang@company.com', department: 'Engineering', role: 'DevOps Engineer', status: 'active', location: 'Seattle', phone: '+1 206-555-0104', startDate: '2022-09-20', avatar: 'DC' },
  { id: 5, name: 'Elena Vasquez', email: 'elena.vasquez@company.com', department: 'Sales', role: 'VP of Sales', status: 'active', location: 'Chicago', phone: '+1 312-555-0105', startDate: '2020-11-15', avatar: 'EV' },
  { id: 6, name: 'Finn O\'Brien', email: 'finn.obrien@company.com', department: 'HR', role: 'HR Manager', status: 'active', location: 'Boston', phone: '+1 617-555-0106', startDate: '2021-04-22', avatar: 'FO' },
  { id: 7, name: 'Grace Liu', email: 'grace.liu@company.com', department: 'Engineering', role: 'Frontend Developer', status: 'probation', location: 'San Francisco', phone: '+1 415-555-0107', startDate: '2026-04-01', avatar: 'GL' },
  { id: 8, name: 'Henry Park', email: 'henry.park@company.com', department: 'Finance', role: 'Financial Analyst', status: 'active', location: 'New York', phone: '+1 212-555-0108', startDate: '2023-07-12', avatar: 'HP' },
  { id: 9, name: 'Irene Nakamura', email: 'irene.nakamura@company.com', department: 'Design', role: 'UI Designer', status: 'active', location: 'Portland', phone: '+1 503-555-0109', startDate: '2022-12-05', avatar: 'IN' },
  { id: 10, name: 'Jason Lee', email: 'jason.lee@company.com', department: 'Engineering', role: 'QA Lead', status: 'active', location: 'Denver', phone: '+1 720-555-0110', startDate: '2021-08-30', avatar: 'JL' },
  { id: 11, name: 'Kate Sullivan', email: 'kate.sullivan@company.com', department: 'Marketing', role: 'Growth Manager', status: 'on-leave', location: 'Miami', phone: '+1 305-555-0111', startDate: '2023-02-14', avatar: 'KS' },
  { id: 12, name: 'Liam Bennett', email: 'liam.bennett@company.com', department: 'Sales', role: 'Sales Engineer', status: 'active', location: 'Dallas', phone: '+1 214-555-0112', startDate: '2022-05-18', avatar: 'LB' },
];

const kanbanData: Record<string, KanbanCard[]> = {
  'Document Collection': [
    { id: 1, name: 'Priya Patel', role: 'UX Researcher', department: 'Design', date: 'May 22', avatar: 'PP' },
    { id: 2, name: 'Olivia Brown', role: 'Data Analyst', department: 'Analytics', date: 'May 23', avatar: 'OB' },
    { id: 3, name: 'Ryan Cooper', role: 'Product Manager', department: 'Product', date: 'May 24', avatar: 'RC' },
  ],
  'IT Setup': [
    { id: 4, name: 'Sarah Chen', role: 'Sr. Frontend Dev', department: 'Engineering', date: 'May 20', avatar: 'SC' },
    { id: 5, name: 'David Kim', role: 'Backend Engineer', department: 'Engineering', date: 'May 24', avatar: 'DK' },
    { id: 6, name: 'Nadia Ali', role: 'Security Analyst', department: 'IT Security', date: 'May 21', avatar: 'NA' },
  ],
  'Training': [
    { id: 7, name: 'Marcus Johnson', role: 'Content Strategist', department: 'Marketing', date: 'May 18', avatar: 'MJ' },
    { id: 8, name: 'Emily Rodriguez', role: 'Talent Acq. Spec.', department: 'HR', date: 'May 15', avatar: 'ER' },
  ],
  'Complete': [
    { id: 9, name: 'James Wilson', role: 'Account Executive', department: 'Sales', date: 'May 10', avatar: 'JW' },
    { id: 10, name: 'Aisha Bello', role: 'Legal Counsel', department: 'Legal', date: 'May 8', avatar: 'AB' },
  ],
};

const pendingDocuments: DocumentItem[] = [
  { id: 1, title: 'Employment Contract - Sarah Chen', employee: 'Sarah Chen', type: 'pdf', size: '2.4 MB', submittedDate: '2026-05-22', category: 'Contract', status: 'pending' },
  { id: 2, title: 'Tax Form W-4 - Marcus Johnson', employee: 'Marcus Johnson', type: 'pdf', size: '1.1 MB', submittedDate: '2026-05-21', category: 'Tax', status: 'pending' },
  { id: 3, title: 'Education Certificates - Priya Patel', employee: 'Priya Patel', type: 'image', size: '5.8 MB', submittedDate: '2026-05-23', category: 'Certificate', status: 'pending' },
  { id: 4, title: 'Background Check Report', employee: 'David Kim', type: 'doc', size: '890 KB', submittedDate: '2026-05-20', category: 'Background Check', status: 'pending' },
  { id: 5, title: 'Salary Agreement - Emily Rodriguez', employee: 'Emily Rodriguez', type: 'spreadsheet', size: '340 KB', submittedDate: '2026-05-19', category: 'Compensation', status: 'pending' },
  { id: 6, title: 'NDA - James Wilson', employee: 'James Wilson', type: 'pdf', size: '1.7 MB', submittedDate: '2026-05-18', category: 'Legal', status: 'pending' },
  { id: 7, title: 'I-9 Verification - Nadia Ali', employee: 'Nadia Ali', type: 'pdf', size: '2.1 MB', submittedDate: '2026-05-22', category: 'Legal', status: 'pending' },
  { id: 8, title: 'Benefits Enrollment - Olivia Brown', employee: 'Olivia Brown', type: 'doc', size: '560 KB', submittedDate: '2026-05-23', category: 'Benefits', status: 'pending' },
  { id: 9, title: 'Direct Deposit Form - Ryan Cooper', employee: 'Ryan Cooper', type: 'pdf', size: '410 KB', submittedDate: '2026-05-24', category: 'Banking', status: 'pending' },
  { id: 10, title: 'Equipment Request - Sarah Chen', employee: 'Sarah Chen', type: 'spreadsheet', size: '280 KB', submittedDate: '2026-05-21', category: 'IT', status: 'pending' },
  { id: 11, title: 'Training Completion Cert - Marcus Johnson', employee: 'Marcus Johnson', type: 'image', size: '3.2 MB', submittedDate: '2026-05-24', category: 'Training', status: 'pending' },
  { id: 12, title: 'Emergency Contact Form - Priya Patel', employee: 'Priya Patel', type: 'doc', size: '190 KB', submittedDate: '2026-05-23', category: 'Personal', status: 'pending' },
];

/* ============================================================
   HELPER FUNCTIONS
   ============================================================ */

function statusBadgeColor(status: string): string {
  switch (status) {
    case 'complete':
    case 'active':
    case 'approved':
      return 'green';
    case 'in-progress':
    case 'on-leave':
    case 'probation':
      return 'yellow';
    case 'pending':
    case 'rejected':
      return 'red';
    default:
      return 'blue';
  }
}

function formatStatusLabel(status: string): string {
  return status.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function docTypeIcon(type: string) {
  switch (type) {
    case 'pdf': return <FileText size={20} />;
    case 'doc': return <File size={20} />;
    case 'spreadsheet': return <FileSpreadsheet size={20} />;
    case 'image': return <Image size={20} />;
    default: return <File size={20} />;
  }
}

function getKanbanColumnIcon(column: string) {
  switch (column) {
    case 'Document Collection': return <FileCheck size={16} />;
    case 'IT Setup': return <Monitor size={16} />;
    case 'Training': return <GraduationCap size={16} />;
    case 'Complete': return <CheckCircle2 size={16} />;
    default: return <ClipboardList size={16} />;
  }
}

/* ============================================================
   SIDEBAR COMPONENT
   ============================================================ */

function Sidebar({ activePage, onNavigate }: { activePage: PageId; onNavigate: (id: PageId) => void }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Building2 size={22} />
          </div>
          <div>
            <h1>HR Portal</h1>
            <p>Admin Console</p>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Main Menu</div>
        {navItems.map((item) => (
          <div
            key={item.id}
            className={`nav-item ${activePage === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            <span className="nav-item-icon">{item.icon}</span>
            <span>{item.label}</span>
            {item.badge !== undefined && <span className="nav-badge">{item.badge}</span>}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">AR</div>
          <div className="sidebar-user-info">
            <h4>Amanda Ross</h4>
            <p>HR Director</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

/* ============================================================
   HEADER COMPONENT
   ============================================================ */

const pageHeaders: Record<PageId, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Welcome back, Amanda. Here\'s your HR overview.' },
  employees: { title: 'Employees', subtitle: 'Manage your organization\'s workforce.' },
  onboarding: { title: 'Onboarding', subtitle: 'Track new employee onboarding progress.' },
  documents: { title: 'Documents', subtitle: 'Review and approve pending documents.' },
  settings: { title: 'Settings', subtitle: 'Configure your HR portal preferences.' },
};

function Header({ activePage }: { activePage: PageId }) {
  const header = pageHeaders[activePage];
  return (
    <header className="header">
      <div className="header-left">
        <h2>{header.title}</h2>
        <p>{header.subtitle}</p>
      </div>
      <div className="header-actions">
        <div className="search-box">
          <Search size={16} />
          <input type="text" placeholder="Search anything..." />
        </div>
        <button className="header-btn" title="Notifications">
          <Bell size={20} />
          <span className="notification-dot" />
        </button>
      </div>
    </header>
  );
}

/* ============================================================
   DASHBOARD VIEW
   ============================================================ */

function DashboardView() {
  return (
    <div className="page-transition">
      {/* Metric Cards */}
      <div className="metrics-grid">
        <div className="glass-card metric-card">
          <div className="metric-icon indigo"><Users size={22} /></div>
          <div className="metric-value">847</div>
          <div className="metric-label">Total Employees</div>
          <div className="metric-change up"><ChevronUp size={14} /> 3.2%</div>
        </div>
        <div className="glass-card metric-card">
          <div className="metric-icon green"><UserPlus size={22} /></div>
          <div className="metric-value">23</div>
          <div className="metric-label">Active Onboardings</div>
          <div className="metric-change up"><ChevronUp size={14} /> 12%</div>
        </div>
        <div className="glass-card metric-card">
          <div className="metric-icon yellow"><Clock size={22} /></div>
          <div className="metric-value">12</div>
          <div className="metric-label">Pending Documents</div>
          <div className="metric-change down"><ChevronDown size={14} /> 5%</div>
        </div>
        <div className="glass-card metric-card">
          <div className="metric-icon violet"><TrendingUp size={22} /></div>
          <div className="metric-value">94%</div>
          <div className="metric-label">Completion Rate</div>
          <div className="metric-change up"><ChevronUp size={14} /> 2.1%</div>
        </div>
      </div>

      {/* Recent Onboardings Table + Pipeline Chart */}
      <div className="section-grid">
        {/* Recent Onboardings Table */}
        <div className="glass-card">
          <div className="card-header">
            <div>
              <h3>Recent Onboardings</h3>
              <p>Latest employee onboarding activity</p>
            </div>
            <span className="card-header-action">View All</span>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Stage</th>
                  <th>Status</th>
                  <th>Start Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOnboardings.map((entry) => (
                  <tr key={entry.id}>
                    <td>
                      <div className="employee-cell">
                        <div className="employee-avatar">{entry.avatar}</div>
                        <div className="employee-cell-info">
                          <h4>{entry.name}</h4>
                          <p>{entry.role}</p>
                        </div>
                      </div>
                    </td>
                    <td>{entry.department}</td>
                    <td>{entry.stage}</td>
                    <td>
                      <span className={`badge ${statusBadgeColor(entry.status)}`}>
                        <span className="badge-dot" />
                        {formatStatusLabel(entry.status)}
                      </span>
                    </td>
                    <td>{entry.startDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pipeline Chart */}
        <div className="glass-card">
          <div className="card-header">
            <div>
              <h3>Onboarding Pipeline</h3>
              <p>Current stage distribution</p>
            </div>
            <span className="card-header-action">Details</span>
          </div>
          <div className="bar-chart">
            {pipelineStages.map((stage) => {
              const pct = Math.round((stage.count / stage.total) * 100);
              return (
                <div className="bar-row" key={stage.label}>
                  <span className="bar-label">{stage.label}</span>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${pct}%` }}>
                      {stage.count}
                    </div>
                  </div>
                  <span className="bar-value">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   EMPLOYEES VIEW
   ============================================================ */

function EmployeesView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const departments = [...new Set(allEmployees.map((e) => e.department))];

  const filtered = allEmployees.filter((emp) => {
    const matchSearch =
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchDept = filterDept === 'all' || emp.department === filterDept;
    const matchStatus = filterStatus === 'all' || emp.status === filterStatus;
    return matchSearch && matchDept && matchStatus;
  });

  return (
    <div className="page-transition">
      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search employees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} style={{ display: 'flex', color: 'var(--slate-500)' }}>
              <X size={14} />
            </button>
          )}
        </div>

        <div className="filter-chip active" style={{ cursor: 'default' }}>
          <Filter size={14} />
          Filters
        </div>

        {/* Department filter chips */}
        <button
          className={`filter-chip ${filterDept === 'all' ? 'active' : ''}`}
          onClick={() => setFilterDept('all')}
        >
          All Depts
        </button>
        {departments.map((dept) => (
          <button
            key={dept}
            className={`filter-chip ${filterDept === dept ? 'active' : ''}`}
            onClick={() => setFilterDept(dept)}
          >
            {dept}
          </button>
        ))}

        {/* Status filter */}
        <button
          className={`filter-chip ${filterStatus === 'all' ? 'active' : ''}`}
          onClick={() => setFilterStatus('all')}
        >
          All Status
        </button>
        <button
          className={`filter-chip ${filterStatus === 'active' ? 'active' : ''}`}
          onClick={() => setFilterStatus('active')}
        >
          Active
        </button>
        <button
          className={`filter-chip ${filterStatus === 'on-leave' ? 'active' : ''}`}
          onClick={() => setFilterStatus('on-leave')}
        >
          On Leave
        </button>
        <button
          className={`filter-chip ${filterStatus === 'probation' ? 'active' : ''}`}
          onClick={() => setFilterStatus('probation')}
        >
          Probation
        </button>
      </div>

      {/* Employees Table */}
      <div className="glass-card">
        <div className="card-header">
          <div>
            <h3>All Employees</h3>
            <p>{filtered.length} of {allEmployees.length} employees shown</p>
          </div>
          <button className="btn btn-primary">
            <UserPlus size={16} />
            Add Employee
          </button>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Role</th>
                <th>Status</th>
                <th>Location</th>
                <th>Phone</th>
                <th>Start Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp) => (
                <tr key={emp.id}>
                  <td>
                    <div className="employee-cell">
                      <div className="employee-avatar">{emp.avatar}</div>
                      <div className="employee-cell-info">
                        <h4>{emp.name}</h4>
                        <p>{emp.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="badge indigo">
                      <Briefcase size={12} />
                      {emp.department}
                    </span>
                  </td>
                  <td>{emp.role}</td>
                  <td>
                    <span className={`badge ${statusBadgeColor(emp.status)}`}>
                      <span className="badge-dot" />
                      {formatStatusLabel(emp.status)}
                    </span>
                  </td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <MapPin size={13} style={{ color: 'var(--slate-500)' }} />
                      {emp.location}
                    </span>
                  </td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <Phone size={13} style={{ color: 'var(--slate-500)' }} />
                      {emp.phone}
                    </span>
                  </td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <Calendar size={13} style={{ color: 'var(--slate-500)' }} />
                      {emp.startDate}
                    </span>
                  </td>
                  <td>
                    <button className="header-btn" title="More options">
                      <MoreHorizontal size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8}>
                    <div className="empty-state">
                      <Search size={40} />
                      <h3>No employees found</h3>
                      <p>Try adjusting your search or filter criteria.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   ONBOARDING VIEW
   ============================================================ */

function OnboardingView() {
  const columns = Object.keys(kanbanData);

  return (
    <div className="page-transition">
      {/* Header actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div className="search-box" style={{ minWidth: 260 }}>
            <Search size={16} />
            <input type="text" placeholder="Search onboarding..." />
          </div>
          <div className="filter-chip active" style={{ cursor: 'default' }}>
            <ClipboardList size={14} />
            23 Active
          </div>
        </div>
        <button className="btn btn-primary">
          <UserPlus size={16} />
          Start Onboarding
        </button>
      </div>

      {/* Kanban Board */}
      <div className="kanban-board">
        {columns.map((col) => {
          const cards = kanbanData[col];
          return (
            <div className="kanban-column" key={col}>
              <div className="kanban-column-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {getKanbanColumnIcon(col)}
                  <h4>{col}</h4>
                </div>
                <span className="kanban-count">{cards.length}</span>
              </div>
              <div className="kanban-cards">
                {cards.map((card) => (
                  <div className="kanban-card" key={card.id}>
                    <div className="kanban-card-name">{card.name}</div>
                    <div className="kanban-card-role">{card.role}</div>
                    <span className="badge indigo" style={{ marginBottom: 10, fontSize: 11 }}>
                      <Briefcase size={11} />
                      {card.department}
                    </span>
                    <div className="kanban-card-footer">
                      <span className="kanban-card-date">
                        <Calendar size={12} style={{ display: 'inline', verticalAlign: -2, marginRight: 4 }} />
                        {card.date}
                      </span>
                      <div className="kanban-card-avatar">{card.avatar}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
   DOCUMENTS VIEW
   ============================================================ */

function DocumentsView() {
  const [docs, setDocs] = useState<DocumentItem[]>(pendingDocuments);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const categories = [...new Set(pendingDocuments.map((d) => d.category))];

  const handleApprove = (id: number) => {
    setDocs((prev) => prev.map((d) => (d.id === id ? { ...d, status: 'approved' as const } : d)));
  };

  const handleReject = (id: number) => {
    setDocs((prev) => prev.map((d) => (d.id === id ? { ...d, status: 'rejected' as const } : d)));
  };

  const filtered = docs.filter((d) => filterCategory === 'all' || d.category === filterCategory);

  const pendingCount = docs.filter((d) => d.status === 'pending').length;
  const approvedCount = docs.filter((d) => d.status === 'approved').length;
  const rejectedCount = docs.filter((d) => d.status === 'rejected').length;

  return (
    <div className="page-transition">
      {/* Summary metrics */}
      <div className="metrics-grid" style={{ marginBottom: 20 }}>
        <div className="glass-card metric-card">
          <div className="metric-icon yellow"><Clock size={22} /></div>
          <div className="metric-value">{pendingCount}</div>
          <div className="metric-label">Pending Review</div>
        </div>
        <div className="glass-card metric-card">
          <div className="metric-icon green"><CheckCircle2 size={22} /></div>
          <div className="metric-value">{approvedCount}</div>
          <div className="metric-label">Approved</div>
        </div>
        <div className="glass-card metric-card">
          <div className="metric-icon" style={{ background: 'var(--red-900)', color: 'var(--red-400)' }}><X size={22} /></div>
          <div className="metric-value">{rejectedCount}</div>
          <div className="metric-label">Rejected</div>
        </div>
        <div className="glass-card metric-card">
          <div className="metric-icon indigo"><FileText size={22} /></div>
          <div className="metric-value">{docs.length}</div>
          <div className="metric-label">Total Documents</div>
        </div>
      </div>

      {/* Category filter */}
      <div className="filter-bar">
        <button
          className={`filter-chip ${filterCategory === 'all' ? 'active' : ''}`}
          onClick={() => setFilterCategory('all')}
        >
          All Categories
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            className={`filter-chip ${filterCategory === cat ? 'active' : ''}`}
            onClick={() => setFilterCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Document list */}
      <div className="glass-card">
        <div className="card-header">
          <div>
            <h3>Document Approvals</h3>
            <p>{filtered.length} documents displayed</p>
          </div>
          <button className="btn btn-ghost">
            <Download size={16} />
            Export
          </button>
        </div>
        <div className="doc-list">
          {filtered.map((doc) => (
            <div className="doc-item" key={doc.id}>
              <div className={`doc-icon ${doc.type}`}>
                {docTypeIcon(doc.type)}
              </div>
              <div className="doc-info">
                <h4>{doc.title}</h4>
                <p>
                  {doc.employee} · {doc.category} · {doc.size} · Submitted {doc.submittedDate}
                </p>
              </div>
              <div style={{ marginRight: 8 }}>
                {doc.status === 'pending' && (
                  <span className="badge yellow">
                    <span className="badge-dot" />
                    Pending
                  </span>
                )}
                {doc.status === 'approved' && (
                  <span className="badge green">
                    <span className="badge-dot" />
                    Approved
                  </span>
                )}
                {doc.status === 'rejected' && (
                  <span className="badge red">
                    <span className="badge-dot" />
                    Rejected
                  </span>
                )}
              </div>
              <div className="doc-actions">
                {doc.status === 'pending' && (
                  <>
                    <button className="btn btn-success" onClick={() => handleApprove(doc.id)}>
                      <Check size={14} />
                      Approve
                    </button>
                    <button className="btn btn-danger" onClick={() => handleReject(doc.id)}>
                      <X size={14} />
                      Reject
                    </button>
                  </>
                )}
                {doc.status !== 'pending' && (
                  <button className="btn btn-ghost" style={{ fontSize: 12 }}>
                    <MoreHorizontal size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   SETTINGS VIEW
   ============================================================ */

function SettingsView() {
  const [settingsTab, setSettingsTab] = useState('general');
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(false);
  const [autoApprove, setAutoApprove] = useState(false);
  const [twoFactor, setTwoFactor] = useState(true);

  const settingsNavItems = [
    { id: 'general', label: 'General', icon: <Globe size={18} /> },
    { id: 'notifications', label: 'Notifications', icon: <BellRing size={18} /> },
    { id: 'security', label: 'Security', icon: <Lock size={18} /> },
    { id: 'appearance', label: 'Appearance', icon: <Palette size={18} /> },
    { id: 'data', label: 'Data & Privacy', icon: <Database size={18} /> },
  ];

  return (
    <div className="page-transition">
      <div className="settings-layout">
        {/* Settings Nav */}
        <div className="settings-nav">
          {settingsNavItems.map((item) => (
            <div
              key={item.id}
              className={`settings-nav-item ${settingsTab === item.id ? 'active' : ''}`}
              onClick={() => setSettingsTab(item.id)}
            >
              {item.icon}
              <span>{item.label}</span>
            </div>
          ))}
        </div>

        {/* Settings Content */}
        <div className="settings-content">
          {settingsTab === 'general' && (
            <div className="animate-fade-in">
              <div className="settings-section">
                <h3>Organization Profile</h3>
                <p>Manage your company information and preferences.</p>
                <div className="glass-card">
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Company Name</label>
                      <input className="form-input" type="text" defaultValue="Acme Corporation" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Industry</label>
                      <select className="form-select" defaultValue="technology">
                        <option value="technology">Technology</option>
                        <option value="finance">Finance</option>
                        <option value="healthcare">Healthcare</option>
                        <option value="education">Education</option>
                        <option value="manufacturing">Manufacturing</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Admin Email</label>
                      <input className="form-input" type="email" defaultValue="admin@acmecorp.com" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Phone</label>
                      <input className="form-input" type="tel" defaultValue="+1 (555) 000-1234" />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Address</label>
                    <input className="form-input" type="text" defaultValue="123 Innovation Drive, San Francisco, CA 94105" />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Timezone</label>
                      <select className="form-select" defaultValue="pst">
                        <option value="pst">Pacific Time (PT)</option>
                        <option value="mst">Mountain Time (MT)</option>
                        <option value="cst">Central Time (CT)</option>
                        <option value="est">Eastern Time (ET)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Date Format</label>
                      <select className="form-select" defaultValue="yyyy-mm-dd">
                        <option value="yyyy-mm-dd">YYYY-MM-DD</option>
                        <option value="mm-dd-yyyy">MM/DD/YYYY</option>
                        <option value="dd-mm-yyyy">DD/MM/YYYY</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ paddingTop: 8, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button className="btn btn-ghost">Cancel</button>
                    <button className="btn btn-primary">Save Changes</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {settingsTab === 'notifications' && (
            <div className="animate-fade-in">
              <div className="settings-section">
                <h3>Notification Preferences</h3>
                <p>Choose how you want to receive notifications.</p>
                <div className="glass-card">
                  <div className="toggle-wrapper">
                    <div className="toggle-info">
                      <h4>Email Notifications</h4>
                      <p>Receive important updates via email</p>
                    </div>
                    <div
                      className={`toggle ${emailNotifs ? 'active' : ''}`}
                      onClick={() => setEmailNotifs(!emailNotifs)}
                    />
                  </div>
                  <div className="toggle-wrapper">
                    <div className="toggle-info">
                      <h4>Push Notifications</h4>
                      <p>Get instant browser push notifications</p>
                    </div>
                    <div
                      className={`toggle ${pushNotifs ? 'active' : ''}`}
                      onClick={() => setPushNotifs(!pushNotifs)}
                    />
                  </div>
                  <div className="toggle-wrapper">
                    <div className="toggle-info">
                      <h4>Weekly Digest Report</h4>
                      <p>Receive a summary report every Monday</p>
                    </div>
                    <div
                      className={`toggle ${weeklyReport ? 'active' : ''}`}
                      onClick={() => setWeeklyReport(!weeklyReport)}
                    />
                  </div>
                  <div className="toggle-wrapper">
                    <div className="toggle-info">
                      <h4>Auto-approve Documents</h4>
                      <p>Automatically approve documents from verified employees</p>
                    </div>
                    <div
                      className={`toggle ${autoApprove ? 'active' : ''}`}
                      onClick={() => setAutoApprove(!autoApprove)}
                    />
                  </div>
                </div>
              </div>

              <div className="settings-section">
                <h3>Alert Channels</h3>
                <p>Configure which events trigger notifications.</p>
                <div className="glass-card">
                  <div className="toggle-wrapper">
                    <div className="toggle-info">
                      <h4>New Employee Added</h4>
                      <p>Alert when a new employee joins the organization</p>
                    </div>
                    <div className="toggle active" />
                  </div>
                  <div className="toggle-wrapper">
                    <div className="toggle-info">
                      <h4>Document Submitted</h4>
                      <p>Alert when an employee submits a new document</p>
                    </div>
                    <div className="toggle active" />
                  </div>
                  <div className="toggle-wrapper">
                    <div className="toggle-info">
                      <h4>Onboarding Completed</h4>
                      <p>Alert when an employee finishes all onboarding stages</p>
                    </div>
                    <div className="toggle active" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {settingsTab === 'security' && (
            <div className="animate-fade-in">
              <div className="settings-section">
                <h3>Security Settings</h3>
                <p>Manage authentication and access controls.</p>
                <div className="glass-card">
                  <div className="toggle-wrapper">
                    <div className="toggle-info">
                      <h4>Two-Factor Authentication</h4>
                      <p>Require 2FA for all admin accounts</p>
                    </div>
                    <div
                      className={`toggle ${twoFactor ? 'active' : ''}`}
                      onClick={() => setTwoFactor(!twoFactor)}
                    />
                  </div>
                  <div className="toggle-wrapper">
                    <div className="toggle-info">
                      <h4>Session Timeout</h4>
                      <p>Auto-logout after inactivity</p>
                    </div>
                    <select className="form-select" style={{ width: 160 }} defaultValue="30">
                      <option value="15">15 minutes</option>
                      <option value="30">30 minutes</option>
                      <option value="60">1 hour</option>
                      <option value="120">2 hours</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="settings-section">
                <h3>Password Policy</h3>
                <p>Set password requirements for all users.</p>
                <div className="glass-card">
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Minimum Length</label>
                      <input className="form-input" type="number" defaultValue="12" min="8" max="32" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Password Expiry (days)</label>
                      <input className="form-input" type="number" defaultValue="90" min="30" max="365" />
                    </div>
                  </div>
                  <div className="toggle-wrapper">
                    <div className="toggle-info">
                      <h4>Require Special Characters</h4>
                      <p>Passwords must include at least one special character</p>
                    </div>
                    <div className="toggle active" />
                  </div>
                  <div className="toggle-wrapper">
                    <div className="toggle-info">
                      <h4>Require Mixed Case</h4>
                      <p>Passwords must include uppercase and lowercase letters</p>
                    </div>
                    <div className="toggle active" />
                  </div>
                  <div style={{ paddingTop: 12, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button className="btn btn-ghost">Reset to Defaults</button>
                    <button className="btn btn-primary">
                      <Shield size={16} />
                      Update Policy
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {settingsTab === 'appearance' && (
            <div className="animate-fade-in">
              <div className="settings-section">
                <h3>Appearance</h3>
                <p>Customize the look and feel of your HR Portal.</p>
                <div className="glass-card">
                  <div className="form-group">
                    <label className="form-label">Theme</label>
                    <select className="form-select" defaultValue="dark">
                      <option value="dark">Dark (Default)</option>
                      <option value="light">Light</option>
                      <option value="system">System Preference</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Accent Color</label>
                    <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                      {['#6366f1', '#8b5cf6', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444'].map((color) => (
                        <div
                          key={color}
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: color,
                            cursor: 'pointer',
                            border: color === '#6366f1' ? '2px solid white' : '2px solid transparent',
                            transition: 'transform 150ms ease',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.15)')}
                          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Font Size</label>
                    <select className="form-select" defaultValue="medium">
                      <option value="small">Small</option>
                      <option value="medium">Medium (Default)</option>
                      <option value="large">Large</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Sidebar Position</label>
                    <select className="form-select" defaultValue="left">
                      <option value="left">Left (Default)</option>
                      <option value="right">Right</option>
                    </select>
                  </div>
                  <div style={{ paddingTop: 8, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button className="btn btn-ghost">Reset</button>
                    <button className="btn btn-primary">
                      <Palette size={16} />
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {settingsTab === 'data' && (
            <div className="animate-fade-in">
              <div className="settings-section">
                <h3>Data & Privacy</h3>
                <p>Manage data retention and privacy settings.</p>
                <div className="glass-card">
                  <div className="form-group">
                    <label className="form-label">Data Retention Period</label>
                    <select className="form-select" defaultValue="3years">
                      <option value="1year">1 Year</option>
                      <option value="2years">2 Years</option>
                      <option value="3years">3 Years (Default)</option>
                      <option value="5years">5 Years</option>
                      <option value="indefinite">Indefinite</option>
                    </select>
                  </div>
                  <div className="toggle-wrapper">
                    <div className="toggle-info">
                      <h4>Anonymize Departed Employee Data</h4>
                      <p>Automatically anonymize PII 90 days after departure</p>
                    </div>
                    <div className="toggle active" />
                  </div>
                  <div className="toggle-wrapper">
                    <div className="toggle-info">
                      <h4>Audit Logging</h4>
                      <p>Log all admin actions for compliance</p>
                    </div>
                    <div className="toggle active" />
                  </div>
                  <div className="toggle-wrapper">
                    <div className="toggle-info">
                      <h4>GDPR Compliance Mode</h4>
                      <p>Enable enhanced data protection features</p>
                    </div>
                    <div className="toggle active" />
                  </div>
                </div>
              </div>

              <div className="settings-section">
                <h3>Export & Backup</h3>
                <p>Download or backup your organization data.</p>
                <div className="glass-card" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <button className="btn btn-ghost">
                    <Download size={16} />
                    Export Employees (CSV)
                  </button>
                  <button className="btn btn-ghost">
                    <Download size={16} />
                    Export Documents
                  </button>
                  <button className="btn btn-ghost">
                    <Database size={16} />
                    Full Backup
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   MAIN APP COMPONENT
   ============================================================ */

export default function App() {
  const [activePage, setActivePage] = useState<PageId>('dashboard');

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <DashboardView />;
      case 'employees':
        return <EmployeesView />;
      case 'onboarding':
        return <OnboardingView />;
      case 'documents':
        return <DocumentsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="app-layout">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <div className="main-area">
        <Header activePage={activePage} />
        <main className="content" key={activePage}>
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
