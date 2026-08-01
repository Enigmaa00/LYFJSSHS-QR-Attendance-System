import React, { useState, useEffect, useMemo } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import axios from 'axios';
import { 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  MessageSquare, 
  CalendarCheck, 
  BarChart2, 
  UserPlus, 
  Settings as SettingsIcon, 
  LogOut, 
  CheckCircle2, 
  QrCode, 
  Trash2,
  ScanLine,
  Plus,
  Send,
  Save,
  Lock,
  Mail,
  User,
  Clock,
  PieChart as PieChartIcon
} from 'lucide-react';

const API_BASE = 'https://lyfjsshs-qr-attendance-system.onrender.com';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState('admin@school.edu');
  const [authMode, setAuthMode] = useState('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  const [activeTab, setActiveTab] = useState('Dashboard');
  const [logs, setLogs] = useState([]);
  const [students, setStudents] = useState([]);
  const [parents, setParents] = useState([]);
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [settings, setSettings] = useState({ school_name: '', academic_year: '', auto_sms_notify: true });
  const [attendanceRatio, setAttendanceRatio] = useState({
    total_entries: 0,
    total_exits: 0,
    currently_on_campus: 0,
    on_campus_percentage: 0,
    departed_percentage: 0
  });

  const [studentIdInput, setStudentIdInput] = useState('SY01-1116');
  const [activeQrCode, setActiveQrCode] = useState('SY01-1116');
  const [scanResult, setScanResult] = useState(null);

  const [newStudent, setNewStudent] = useState({ qrcode: '', name: '', grade: '', parent: '' });
  const [newParent, setNewParent] = useState({ parent_name: '', student_name: '', contact: '', email: '' });
  const [newMessage, setNewMessage] = useState({ recipient: '', message: '' });

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await axios.post(`${API_BASE}/auth/login`, {
        email: loginEmail,
        password: loginPassword
      });
      if (res.data.success) {
        setCurrentUserEmail(res.data.email);
        setIsAuthenticated(true);
      }
    } catch (err) {
      if (loginEmail === 'admin@school.edu' && loginPassword === 'admin123') {
        setCurrentUserEmail(loginEmail);
        setIsAuthenticated(true);
      } else {
        setAuthError('Invalid credentials. Use admin@school.edu / admin123');
      }
    }
  };

  const api = axios.create({
  baseURL: 'https://lyfjsshs-qr-attendance-system.onrender.com', // Replace with your actual Render URL
  headers: {
    'Content-Type': 'application/json',
  },
});


  const handleSignup = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    try {
      const res = await axios.post(`${API_BASE}/auth/signup`, {
        name: signupName,
        email: signupEmail,
        password: signupPassword
      });
      if (res.data.success) {
        setAuthSuccess('Account created successfully! Please sign in.');
        setAuthMode('login');
        setLoginEmail(signupEmail);
        setSignupName('');
        setSignupEmail('');
        setSignupPassword('');
      }
    } catch (err) {
      setAuthError(err.response?.data?.detail || 'Failed to register account.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  const fetchAllData = async () => {
    if (!isAuthenticated) return;
    try {
      const [lRes, sRes, pRes, mRes, memRes, setRes, ratioRes] = await Promise.all([
        axios.get(`${API_BASE}/attendance/logs`),
        axios.get(`${API_BASE}/students`),
        axios.get(`${API_BASE}/parents`),
        axios.get(`${API_BASE}/messages`),
        axios.get(`${API_BASE}/members`),
        axios.get(`${API_BASE}/settings`),
        axios.get(`${API_BASE}/attendance/ratio`),
      ]);
      setLogs(lRes.data);
      setStudents(sRes.data);
      setParents(pRes.data);
      setMessages(mRes.data);
      setMembers(memRes.data);
      setSettings(setRes.data);
      setAttendanceRatio(ratioRes.data);
    } catch (err) {
      console.warn("Backend API offline.");
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [isAuthenticated]);

  const processScan = async (code) => {
    if (!code) return;
    try {
      const res = await axios.post(`${API_BASE}/attendance/scan`, { qrcode: code });
      setScanResult(`Logged: ${res.data.qrcode} (${res.data.departure_status !== '--' ? 'Exit' : 'Entry'})`);
      fetchAllData();
    } catch (err) {
      setScanResult(`Logged: ${code}`);
    }
  };

  const handleClearLogs = async () => {
    try {
      await axios.delete(`${API_BASE}/attendance/logs/clear`);
      setLogs([]);
      setScanResult(null);
      fetchAllData();
    } catch (err) {
      setLogs([]);
      setScanResult(null);
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    await axios.post(`${API_BASE}/students`, newStudent);
    setNewStudent({ qrcode: '', name: '', grade: '', parent: '' });
    fetchAllData();
  };

  const handleAddParent = async (e) => {
    e.preventDefault();
    await axios.post(`${API_BASE}/parents`, newParent);
    setNewParent({ parent_name: '', student_name: '', contact: '', email: '' });
    fetchAllData();
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    await axios.post(`${API_BASE}/messages`, newMessage);
    setNewMessage({ recipient: '', message: '' });
    fetchAllData();
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    await axios.put(`${API_BASE}/settings`, settings);
    alert("Settings updated successfully!");
  };

  const graphPoints = useMemo(() => {
    if (logs.length === 0) return "0,110 80,110 160,110 240,110 320,110 400,110 480,110";
    const counts = [0, 0, 0, 0, 0, 0, 0];
    logs.forEach(log => {
      const day = new Date(log.log_date).getDay();
      const adjustedDay = day === 0 ? 6 : day - 1;
      counts[adjustedDay] += 1;
    });
    const maxCount = Math.max(...counts, 1);
    return counts.map((cnt, i) => `${i * 80},${110 - (cnt / maxCount) * 80}`).join(' ');
  }, [logs]);

  const pieChartSlice = useMemo(() => {
    const total = attendanceRatio.total_entries;
    if (total === 0) return { dashArray: "0 100", offset: 0 };
    const onCampusPct = attendanceRatio.on_campus_percentage;
    return {
      dashArray: `${onCampusPct} ${100 - onCampusPct}`,
      offset: 25
    };
  }, [attendanceRatio]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#ecf0f1] flex items-center justify-center font-sans p-4">
        <div className="bg-white border border-slate-300 shadow-md w-full max-w-md p-6">
          <div className="text-center mb-6 flex flex-col items-center">
            <img 
              src="/lyfsouth-modified.jpg" 
              alt="School Logo" 
              className="w-16 h-16 rounded-full object-cover mb-2 border border-slate-200" 
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <h2 className="text-base font-bold text-slate-800 uppercase">
              {authMode === 'login' ? 'LYFJSSHS Admin Portal Login' : 'Create Administrator Account'}
            </h2>
          </div>

          {authError && <div className="mb-4 bg-red-100 border border-red-400 text-red-700 p-2 text-xs">{authError}</div>}
          {authSuccess && <div className="mb-4 bg-emerald-100 border border-emerald-400 text-emerald-800 p-2 text-xs">{authSuccess}</div>}

          {authMode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-700">Email Address</label>
                <div className="relative">
                  <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="admin@school.edu" className="w-full pl-8 pr-3 py-2 border border-slate-300 focus:outline-none focus:border-[#27ae60]" required />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-700">Password</label>
                <div className="relative">
                  <input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="••••••••" className="w-full pl-8 pr-3 py-2 border border-slate-300 focus:outline-none focus:border-[#27ae60]" required />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
              </div>
              <button type="submit" className="w-full bg-[#27ae60] hover:bg-[#219150] text-white font-bold py-2 uppercase tracking-wider transition-colors">Sign In</button>
              <div className="text-center pt-2">
                <button type="button" onClick={() => { setAuthMode('signup'); setAuthError(''); setAuthSuccess(''); }} className="text-xs text-[#2980b9] hover:underline font-semibold">Don't have an account? Sign up</button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-700">Full Name</label>
                <div className="relative">
                  <input type="text" value={signupName} onChange={e => setSignupName(e.target.value)} placeholder="Admin Name" className="w-full pl-8 pr-3 py-2 border border-slate-300 focus:outline-none focus:border-[#27ae60]" required />
                  <User className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-700">Email Address</label>
                <div className="relative">
                  <input type="email" value={signupEmail} onChange={e => setSignupEmail(e.target.value)} placeholder="admin@school.edu" className="w-full pl-8 pr-3 py-2 border border-slate-300 focus:outline-none focus:border-[#27ae60]" required />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-700">Password</label>
                <div className="relative">
                  <input type="password" value={signupPassword} onChange={e => setSignupPassword(e.target.value)} placeholder="••••••••" className="w-full pl-8 pr-3 py-2 border border-slate-300 focus:outline-none focus:border-[#27ae60]" required />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
              </div>
              <button type="submit" className="w-full bg-[#2980b9] hover:bg-[#2471a3] text-white font-bold py-2 uppercase tracking-wider transition-colors">Create Account</button>
              <div className="text-center pt-2">
                <button type="button" onClick={() => { setAuthMode('login'); setAuthError(''); setAuthSuccess(''); }} className="text-xs text-slate-600 hover:underline font-semibold">Already have an account? Sign in</button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#ecf0f1] font-sans text-slate-800 flex flex-col">
      <header className="h-10 bg-[#27ae60] text-white px-4 flex items-center justify-between text-xs font-bold shrink-0">
        <div className="flex items-center gap-2">
          <img src="/lyfsouth-modified.jpg" alt="Logo" className="w-6 h-6 rounded-full object-cover border border-white/40" onError={(e) => { e.target.style.display = 'none'; }} />
          <span>Admin Dashboard - {settings.school_name || "Luis Y. Ferrer South Senior High School"}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-emerald-100">{currentUserEmail}</span>
          <button onClick={handleLogout} className="hover:text-emerald-200" title="Logout"><LogOut className="w-4 h-4" /></button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-52 bg-[#2c3e50] text-slate-300 flex flex-col shrink-0">
          <div className="p-3 border-b border-slate-700/60 flex items-center gap-3 bg-[#243342]">
            <img src="/lyfsouth-modified.jpg" alt="Profile Logo" className="w-9 h-9 rounded-full object-cover border border-slate-600" onError={(e) => { e.target.style.display = 'none'; }} />
            <div className="overflow-hidden">
              <h2 className="text-xs font-bold text-white truncate capitalize">{currentUserEmail.split('@')[0]}</h2>
              <p className="text-[10px] text-slate-400">Administrator</p>
            </div>
          </div>
          <nav className="flex-1 p-2 space-y-1 text-xs font-medium">
            {[
              { name: 'Dashboard', icon: LayoutDashboard },
              { name: 'Student', icon: Users },
              { name: 'Parents', icon: UserCheck },
              { name: 'Messages', icon: MessageSquare },
              { name: 'Attendance', icon: CalendarCheck },
              { name: 'Reports', icon: BarChart2 },
              { name: 'Member', icon: UserPlus },
              { name: 'Settings', icon: SettingsIcon },
            ].map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.name;
              return (
                <button
                  key={item.name}
                  onClick={() => setActiveTab(item.name)}
                  className={`w-full flex items-center gap-3 px-3 py-2 ${isActive ? 'bg-[#34495e] text-white font-bold border-l-4 border-[#27ae60]' : 'hover:bg-[#34495e]'}`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#27ae60]' : ''}`} />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 p-4 overflow-y-auto space-y-4">
          {activeTab === 'Dashboard' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border border-slate-300 p-3 shadow-sm flex flex-col items-center justify-between">
                  <div className="w-full flex items-center gap-2 border-b pb-2 mb-2">
                    <QrCode className="w-4 h-4 text-[#27ae60]" />
                    <span className="text-xs font-bold text-slate-700 uppercase">Student QR Generator</span>
                  </div>
                  <div className="bg-slate-50 p-2 border border-slate-200 my-1">
                    <QRCodeCanvas value={activeQrCode} size={100} />
                  </div>
                  <div className="w-full flex gap-2 mt-2">
                    <input 
                      type="text" 
                      value={studentIdInput} 
                      onChange={(e) => { setStudentIdInput(e.target.value); setActiveQrCode(e.target.value); }}
                      className="flex-1 px-2 py-1 border border-slate-300 text-xs font-mono"
                    />
                    <button onClick={() => processScan(activeQrCode)} className="px-3 py-1 bg-[#27ae60] text-white text-xs font-bold flex items-center gap-1">
                      <ScanLine className="w-3.5 h-3.5" /> Scan
                    </button>
                  </div>
                </div>

                {/* Live Attendance Ticker / Scrolling Log Card */}
                <div className="md:col-span-2 bg-white border border-slate-300 p-3 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase">
                      <Clock className="w-4 h-4 text-[#2980b9]" /> Live Attendance Ticker
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">Auto-scrolls on new log</span>
                  </div>

                  {scanResult && (
                    <div className="bg-emerald-100 text-emerald-900 p-2 text-xs flex items-center gap-2 my-2 animate-pulse">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      {scanResult}
                    </div>
                  )}

                  <div className="my-2 h-36 overflow-y-auto border border-slate-200 bg-slate-50 flex flex-col-reverse p-2 space-y-reverse space-y-1">
                    {logs.length === 0 ? (
                      <div className="text-xs text-slate-400 py-8 text-center m-auto">
                        Scan or process a student QR code to view live activity logs here.
                      </div>
                    ) : (
                      logs.slice().reverse().map((log, index) => (
                        <div 
                          key={log.id || index} 
                          className="bg-white border border-slate-200 p-2 text-xs flex items-center justify-between shadow-xs transition-all duration-300"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-[#27ae60]">{log.qrcode}</span>
                            <span className="text-slate-500 text-[10px]">({log.log_date})</span>
                          </div>
                          <div className="flex items-center gap-3 font-mono text-[11px]">
                            <span>In: <strong className="text-slate-700">{log.arrival_time}</strong></span>
                            <span>Out: <strong className={log.departure_time !== '--' ? 'text-blue-600' : 'text-slate-400'}>{log.departure_time}</strong></span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="flex justify-end pt-2 border-t">
                    <button 
                      onClick={handleClearLogs} 
                      className="text-xs text-red-600 flex items-center gap-1 font-semibold hover:underline"
                    >
                      <Trash2 className="w-3 h-3" /> Clear Records
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 bg-white border border-slate-300 p-3 shadow-sm">
                  <div className="flex items-center justify-between border-b pb-2 mb-3">
                    <h3 className="text-xs font-bold text-slate-700 uppercase">Weekly Attendance Activity</h3>
                  </div>
                  <div className="h-40 w-full relative pt-2">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 480 120">
                      <polygon points={`0,110 ${graphPoints} 480,110`} fill="rgba(39, 174, 96, 0.15)" />
                      <polyline fill="none" stroke="#27ae60" strokeWidth="3" points={graphPoints} />
                    </svg>
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-2 pt-1 border-t">
                      <span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span><span>SUN</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-300 p-3 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                      <PieChartIcon className="w-3.5 h-3.5 text-[#27ae60]" /> Campus Logs Ratio
                    </h3>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center my-3">
                    <div className="relative w-28 h-28">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 32 32">
                        <circle cx="16" cy="16" r="14.5" fill="transparent" stroke="#2980b9" strokeWidth="3" />
                        <circle cx="16" cy="16" r="14.5" fill="transparent" stroke="#27ae60" strokeWidth="3" strokeDasharray={pieChartSlice.dashArray} strokeDashoffset={pieChartSlice.offset} />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="text-sm font-bold font-mono text-slate-800">{attendanceRatio.on_campus_percentage}%</span>
                        <span className="text-[9px] text-slate-500 uppercase tracking-tight">On Campus</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 text-[11px] border-t pt-2 font-semibold text-center">
                    <div className="text-emerald-600 flex flex-col">
                      <span>On-Campus</span>
                      <span className="font-mono">{attendanceRatio.currently_on_campus} ({attendanceRatio.on_campus_percentage}%)</span>
                    </div>
                    <div className="text-blue-600 flex flex-col border-l border-slate-200">
                      <span>Departed</span>
                      <span className="font-mono">{attendanceRatio.total_exits} ({attendanceRatio.departed_percentage}%)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Student' && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-300 p-3 shadow-sm">
                <h3 className="text-xs font-bold uppercase mb-2">Register New Student</h3>
                <form onSubmit={handleAddStudent} className="grid grid-cols-1 md:grid-cols-4 gap-2">
                  <input type="text" placeholder="QR Code" value={newStudent.qrcode} onChange={e => setNewStudent({...newStudent, qrcode: e.target.value})} className="px-2 py-1 border text-xs" required />
                  <input type="text" placeholder="Student Name" value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})} className="px-2 py-1 border text-xs" required />
                  <input type="text" placeholder="Grade & Section" value={newStudent.grade} onChange={e => setNewStudent({...newStudent, grade: e.target.value})} className="px-2 py-1 border text-xs" required />
                  <button type="submit" className="bg-[#27ae60] text-white text-xs font-bold py-1 flex items-center justify-center gap-1"><Plus className="w-3.5 h-3.5"/> Add Student</button>
                </form>
              </div>

              <div className="bg-white border border-slate-300 shadow-sm">
                <div className="px-3 py-2 bg-slate-100 border-b flex justify-between items-center">
                  <span className="font-bold text-xs uppercase">Enrolled Students Directory</span>
                  <button onClick={() => axios.delete(`${API_BASE}/students/clear`).then(fetchAllData)} className="text-xs text-red-600 flex items-center gap-1 font-semibold hover:underline">
                    <Trash2 className="w-3 h-3" /> Clear Directory
                  </button>
                </div>
                <table className="w-full text-left text-xs">
                  <thead><tr className="bg-slate-100 border-b font-bold"><th className="p-2">QR Code</th><th className="p-2">Name</th><th className="p-2">Grade/Section</th></tr></thead>
                  <tbody>
                    {students.length === 0 ? (
                      <tr><td colSpan="3" className="p-4 text-center text-slate-400">No students enrolled.</td></tr>
                    ) : (
                      students.map(s => (
                        <tr key={s.id} className="border-b hover:bg-slate-50"><td className="p-2 font-mono">{s.qrcode}</td><td className="p-2">{s.name}</td><td className="p-2">{s.grade}</td></tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'Parents' && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-300 p-3 shadow-sm">
                <h3 className="text-xs font-bold uppercase mb-2">Link Parent/Guardian</h3>
                <form onSubmit={handleAddParent} className="grid grid-cols-1 md:grid-cols-4 gap-2">
                  <input type="text" placeholder="Parent Name" value={newParent.parent_name} onChange={e => setNewParent({...newParent, parent_name: e.target.value})} className="px-2 py-1 border text-xs" required />
                  <input type="text" placeholder="Student Name" value={newParent.student_name} onChange={e => setNewParent({...newParent, student_name: e.target.value})} className="px-2 py-1 border text-xs" required />
                  <input type="text" placeholder="Contact Number" value={newParent.contact} onChange={e => setNewParent({...newParent, contact: e.target.value})} className="px-2 py-1 border text-xs" required />
                  <button type="submit" className="bg-[#27ae60] text-white text-xs font-bold py-1 flex items-center justify-center gap-1"><Plus className="w-3.5 h-3.5"/> Add Parent</button>
                </form>
              </div>

              <div className="bg-white border border-slate-300 shadow-sm">
                <div className="px-3 py-2 bg-slate-100 border-b flex justify-between items-center">
                  <span className="font-bold text-xs uppercase">Parents Directory</span>
                  <button onClick={() => axios.delete(`${API_BASE}/parents/clear`).then(fetchAllData)} className="text-xs text-red-600 flex items-center gap-1 font-semibold hover:underline">
                    <Trash2 className="w-3 h-3" /> Clear Directory
                  </button>
                </div>
                <table className="w-full text-left text-xs">
                  <thead><tr className="bg-slate-100 border-b font-bold"><th className="p-2">Parent Name</th><th className="p-2">Student</th><th className="p-2">Contact</th></tr></thead>
                  <tbody>
                    {parents.length === 0 ? (
                      <tr><td colSpan="3" className="p-4 text-center text-slate-400">No parents linked.</td></tr>
                    ) : (
                      parents.map(p => (
                        <tr key={p.id} className="border-b hover:bg-slate-50"><td className="p-2">{p.parent_name}</td><td className="p-2">{p.student_name}</td><td className="p-2 font-mono">{p.contact}</td></tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'Messages' && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-300 p-3 shadow-sm">
                <h3 className="text-xs font-bold uppercase mb-2">Send SMS / Notification to Parent</h3>
                <form onSubmit={handleSendMessage} className="space-y-2">
                  <input type="text" placeholder="Recipient Parent Name" value={newMessage.recipient} onChange={e => setNewMessage({...newMessage, recipient: e.target.value})} className="w-full px-2 py-1 border text-xs" required />
                  <textarea placeholder="Type notification message..." value={newMessage.message} onChange={e => setNewMessage({...newMessage, message: e.target.value})} className="w-full px-2 py-1 border text-xs" rows="2" required></textarea>
                  <button type="submit" className="bg-[#2980b9] text-white text-xs font-bold px-4 py-1.5 flex items-center gap-1"><Send className="w-3.5 h-3.5"/> Send Notification</button>
                </form>
              </div>

              <div className="bg-white border border-slate-300 shadow-sm">
                <div className="px-3 py-2 bg-slate-100 border-b font-bold text-xs uppercase">Notification Logs</div>
                <table className="w-full text-left text-xs">
                  <thead><tr className="bg-slate-100 border-b font-bold"><th className="p-2">Date</th><th className="p-2">Recipient</th><th className="p-2">Message</th></tr></thead>
                  <tbody>
                    {messages.length === 0 ? (
                      <tr><td colSpan="3" className="p-4 text-center text-slate-400">No notification logs.</td></tr>
                    ) : (
                      messages.map(m => (
                        <tr key={m.id} className="border-b hover:bg-slate-50"><td className="p-2 font-mono">{m.date}</td><td className="p-2">{m.recipient}</td><td className="p-2">{m.message}</td></tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'Attendance' && (
            <div className="bg-white border border-slate-300 shadow-sm overflow-hidden">
              <div className="px-3 py-2 bg-slate-100 border-b font-bold text-xs uppercase flex justify-between items-center">
                <span>Complete Attendance Master Log</span>
                <button onClick={handleClearLogs} className="text-xs text-red-600 flex items-center gap-1 font-semibold hover:underline">
                  <Trash2 className="w-3 h-3" /> Clear Records
                </button>
              </div>
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b font-bold">
                    <th className="p-2 border-r">QRCODE</th><th className="p-2 border-r">DATE</th><th className="p-2 border-r">ARRIVAL</th><th className="p-2 border-r">STATUS</th><th className="p-2 border-r">DEPARTURE</th><th className="p-2">STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 ? <tr><td colSpan="6" className="p-4 text-center text-slate-400">No attendance records found.</td></tr> :
                    logs.map(log => (
                      <tr key={log.id} className="border-b hover:bg-slate-50">
                        <td className="p-2 border-r font-mono">{log.qrcode}</td>
                        <td className="p-2 border-r">{log.log_date}</td>
                        <td className="p-2 border-r">{log.arrival_time}</td>
                        <td className="p-2 border-r">{log.arrival_status}</td>
                        <td className="p-2 border-r">{log.departure_time}</td>
                        <td className="p-2">{log.departure_status}</td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'Reports' && (
            <div className="bg-white border border-slate-300 p-4 shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase border-b pb-2">System Analytics & Reports</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-50 p-3 border text-center">
                  <p className="text-lg font-bold font-mono">{students.length}</p>
                  <span className="text-[10px] text-slate-500 uppercase">Total Students</span>
                </div>
                <div className="bg-slate-50 p-3 border text-center">
                  <p className="text-lg font-bold font-mono">{attendanceRatio.total_entries}</p>
                  <span className="text-[10px] text-slate-500 uppercase">Total Log Entries</span>
                </div>
                <div className="bg-slate-50 p-3 border text-center">
                  <p className="text-lg font-bold font-mono">{attendanceRatio.on_campus_percentage}%</p>
                  <span className="text-[10px] text-slate-500 uppercase">Campus Presence Rate</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Member' && (
            <div className="bg-white border border-slate-300 shadow-sm">
              <div className="px-3 py-2 bg-slate-100 border-b font-bold text-xs uppercase">Administrator Members</div>
              <table className="w-full text-left text-xs">
                <thead><tr className="bg-slate-100 border-b font-bold"><th className="p-2">Name</th><th className="p-2">Email</th><th className="p-2">Role</th></tr></thead>
                <tbody>
                  {members.map(mem => (
                    <tr key={mem.id} className="border-b"><td className="p-2">{mem.name}</td><td className="p-2">{mem.email}</td><td className="p-2 font-semibold text-emerald-600">{mem.role}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'Settings' && (
            <div className="bg-white border border-slate-300 p-4 shadow-sm max-w-lg">
              <h3 className="text-xs font-bold uppercase border-b pb-2 mb-3">System Configuration</h3>
              <form onSubmit={handleSaveSettings} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold mb-1">School Name</label>
                  <input type="text" value={settings.school_name} onChange={e => setSettings({...settings, school_name: e.target.value})} className="w-full px-2 py-1 border" required />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Academic Year</label>
                  <input type="text" value={settings.academic_year} onChange={e => setSettings({...settings, academic_year: e.target.value})} className="w-full px-2 py-1 border" required />
                </div>
                <button type="submit" className="bg-[#27ae60] text-white font-bold px-4 py-1.5 flex items-center gap-1"><Save className="w-3.5 h-3.5"/> Save Configuration</button>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default api;