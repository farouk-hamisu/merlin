import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Key, FileText, Settings, ShieldAlert, TrendingUp, 
  Trash2, Search, Plus, Clock, Loader2, Eye 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { adminApi, documentApi } from '../services/api';

export const Admin: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'analytics' | 'users' | 'keys' | 'tests' | 'settings'>('analytics');

  // Loading States
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [loadingTests, setLoadingTests] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(false);

  // Data States
  const [analytics, setAnalytics] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [keys, setKeys] = useState<any[]>([]);
  const [tests, setTests] = useState<any[]>([]);

  // Filters & Search
  const [userSearch, setUserSearch] = useState('');
  const [keySearch, setKeySearch] = useState('');
  const [keyFilter, setKeyFilter] = useState('all');
  const [testSearch, setTestSearch] = useState('');

  // Key Gen Form
  const [keyCount, setKeyCount] = useState(5);
  const [isGeneratingKeys, setIsGeneratingKeys] = useState(false);

  // Scan History Modal
  const [activeTestHistory, setActiveTestHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedTestName, setSelectedTestName] = useState('');

  // Settings form
  const [telegramUsernameInput, setTelegramUsernameInput] = useState('');
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);

  // Security guard
  useEffect(() => {
    if (profile && profile.role !== 'admin') {
      navigate('/dashboard');
    }
  }, [profile, navigate]);

  // Load Data
  const loadAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const data = await adminApi.getAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const data = await adminApi.getUsers(userSearch);
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadKeys = async () => {
    setLoadingKeys(true);
    try {
      const data = await adminApi.getKeys(keySearch, keyFilter);
      setKeys(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingKeys(false);
    }
  };

  const loadTests = async () => {
    setLoadingTests(true);
    try {
      const data = await adminApi.getTests(testSearch);
      setTests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTests(false);
    }
  };

  const loadSettings = async () => {
    setLoadingSettings(true);
    try {
      const data = await adminApi.getSettings();
      setTelegramUsernameInput(data.telegram_username || '@merlin_admin');
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSettings(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'analytics') loadAnalytics();
    if (activeTab === 'users') loadUsers();
    if (activeTab === 'keys') loadKeys();
    if (activeTab === 'tests') loadTests();
    if (activeTab === 'settings') loadSettings();
  }, [activeTab]);

  // Operations: User Management
  const handleToggleUserStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    if (!window.confirm(`Are you sure you want to change user status to ${nextStatus}?`)) return;

    try {
      await adminApi.updateUserStatus(id, nextStatus);
      loadUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update user status');
    }
  };

  const handleResetUserPassword = async (id: string) => {
    const newPassword = window.prompt('Enter new password (min 6 characters):');
    if (!newPassword) return;
    if (newPassword.length < 6) {
      alert('Password must be at least 6 characters.');
      return;
    }

    try {
      await adminApi.resetUserPassword(id, newPassword);
      alert('Password successfully reset.');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to reset password');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('WARNING: Deleting a user deletes all their generated drug tests permanently. Action cannot be undone. Proceed?')) return;

    try {
      await adminApi.deleteUser(id);
      loadUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete user');
    }
  };

  // Operations: Keys Management
  const handleGenerateKeys = async (e: React.FormEvent) => {
    e.preventDefault();
    if (keyCount <= 0 || keyCount > 100) return;

    setIsGeneratingKeys(true);
    try {
      await adminApi.generateKeys(keyCount);
      loadKeys();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to generate keys');
    } finally {
      setIsGeneratingKeys(false);
    }
  };

  const handleDeleteKey = async (id: string) => {
    if (!window.confirm('Delete this activation key? Unused keys will be destroyed; redeemed audits remain affected.')) return;
    try {
      await adminApi.deleteKey(id);
      loadKeys();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete key');
    }
  };

  // Operations: Tests Management
  const handleDeleteTest = async (id: string) => {
    if (!window.confirm('WARNING: Deleting this certificate deletes all verification history logs and storage documents permanently. Proceed?')) return;
    try {
      await adminApi.deleteTest(id);
      loadTests();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete certificate');
    }
  };

  const handleViewTestHistory = async (test: any) => {
    setSelectedTestName(test.name);
    setLoadingHistory(true);
    setHistoryModalOpen(true);
    try {
      const data = await adminApi.getTestHistory(test.id);
      setActiveTestHistory(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Operations: Settings Management
  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!telegramUsernameInput.trim()) return;

    setIsUpdatingSettings(true);
    try {
      await adminApi.updateSettings(telegramUsernameInput.trim());
      alert('Settings updated successfully.');
      loadSettings();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update settings');
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  return (
    <div className="min-h-screen bg-cyber-bg text-cyber-text flex flex-col">
      <nav className="border-b border-cyber-border bg-cyber-surface/90">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-auto py-3 md:py-0 md:h-16 items-center flex-wrap gap-2 w-full">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-6 w-6 md:h-7 md:w-7 text-cyber-primary" />
              <span className="font-extrabold text-base md:text-lg tracking-wider text-white">SYSTEM ADMIN CONSOLE</span>
            </div>
            <div className="flex items-center flex-wrap gap-2 md:gap-4">
              <a href="/dashboard" className="text-[10px] md:text-xs text-cyber-text-muted hover:text-cyber-primary hover:underline font-semibold border border-cyber-border px-2 py-1 rounded bg-cyber-surface/40">
                Dashboard Portal &rarr;
              </a>
              <span className="text-[10px] md:text-xs font-mono text-cyber-primary bg-cyber-primary/5 border border-cyber-primary/20 px-2 py-1 rounded hidden sm:inline">
                ROLE: ADMINISTRATOR
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Panel Layout */}
      <div className="max-w-7xl w-full mx-auto px-4 py-8 flex-grow flex flex-col md:flex-row gap-8">
        
        {/* Left Side Navigation (Tabs) */}
        <aside className="w-full md:w-64 shrink-0 flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 gap-2 md:space-y-2">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`shrink-0 whitespace-nowrap w-auto md:w-full text-left px-4 py-3 rounded font-bold text-sm flex items-center gap-3 transition-colors ${
              activeTab === 'analytics' ? 'bg-cyber-primary text-black' : 'bg-cyber-surface-card hover:bg-cyber-surface-hover text-cyber-text-muted hover:text-white'
            }`}
          >
            <TrendingUp className="h-4.5 w-4.5" /> Analytics Overview
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`shrink-0 whitespace-nowrap w-auto md:w-full text-left px-4 py-3 rounded font-bold text-sm flex items-center gap-3 transition-colors ${
              activeTab === 'users' ? 'bg-cyber-primary text-black' : 'bg-cyber-surface-card hover:bg-cyber-surface-hover text-cyber-text-muted hover:text-white'
            }`}
          >
            <Users className="h-4.5 w-4.5" /> Users Management
          </button>
          <button
            onClick={() => setActiveTab('keys')}
            className={`shrink-0 whitespace-nowrap w-auto md:w-full text-left px-4 py-3 rounded font-bold text-sm flex items-center gap-3 transition-colors ${
              activeTab === 'keys' ? 'bg-cyber-primary text-black' : 'bg-cyber-surface-card hover:bg-cyber-surface-hover text-cyber-text-muted hover:text-white'
            }`}
          >
            <Key className="h-4.5 w-4.5" /> Activation Keys
          </button>
          <button
            onClick={() => setActiveTab('tests')}
            className={`shrink-0 whitespace-nowrap w-auto md:w-full text-left px-4 py-3 rounded font-bold text-sm flex items-center gap-3 transition-colors ${
              activeTab === 'tests' ? 'bg-cyber-primary text-black' : 'bg-cyber-surface-card hover:bg-cyber-surface-hover text-cyber-text-muted hover:text-white'
            }`}
          >
            <FileText className="h-4.5 w-4.5" /> Drug Certificates
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`shrink-0 whitespace-nowrap w-auto md:w-full text-left px-4 py-3 rounded font-bold text-sm flex items-center gap-3 transition-colors ${
              activeTab === 'settings' ? 'bg-cyber-primary text-black' : 'bg-cyber-surface-card hover:bg-cyber-surface-hover text-cyber-text-muted hover:text-white'
            }`}
          >
            <Settings className="h-4.5 w-4.5" /> Platform Settings
          </button>
        </aside>

        {/* Content Box */}
        <main className="flex-grow min-w-0">
          
          {/* TAB 1: ANALYTICS OVERVIEW */}
          {activeTab === 'analytics' && (
            <div className="space-y-8 animate-fadeIn">
              {loadingAnalytics || !analytics ? (
                <div className="text-center py-20">
                  <Loader2 className="h-12 w-12 text-cyber-primary animate-spin mx-auto mb-4" />
                  <span className="text-cyber-text-muted text-sm">Aggregating database statistics...</span>
                </div>
              ) : (
                <>
                  {/* Summary Metric Stats */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="cyber-panel p-5 bg-cyber-surface-card/40">
                      <span className="block text-xs uppercase tracking-wider text-cyber-text-muted font-bold mb-2">Total Users</span>
                      <span className="text-3xl font-black text-white">{analytics.summary.totalUsers}</span>
                      <span className="block text-xs text-cyber-text-muted mt-1.5">{analytics.summary.activeUsers} Active &bull; {analytics.summary.suspendedUsers} Suspended</span>
                    </div>

                    <div className="cyber-panel p-5 bg-cyber-surface-card/40">
                      <span className="block text-xs uppercase tracking-wider text-cyber-text-muted font-bold mb-2">Generated Certificates</span>
                      <span className="text-3xl font-black text-cyber-primary">{analytics.summary.totalTests}</span>
                      <span className="block text-xs text-cyber-text-muted mt-1.5">Successfully compiled</span>
                    </div>

                    <div className="cyber-panel p-5 bg-cyber-surface-card/40">
                      <span className="block text-xs uppercase tracking-wider text-cyber-text-muted font-bold mb-2">Activation Keys</span>
                      <span className="text-3xl font-black text-white">{analytics.summary.totalKeys}</span>
                      <span className="block text-xs text-cyber-text-muted mt-1.5">{analytics.summary.usedKeys} Used &bull; {analytics.summary.remainingKeys} Stocked</span>
                    </div>

                    <div className="cyber-panel p-5 bg-cyber-surface-card/40">
                      <span className="block text-xs uppercase tracking-wider text-cyber-text-muted font-bold mb-2">Verification Scans</span>
                      <span className="text-3xl font-black text-cyber-success">{analytics.summary.totalVerifications} SCANS</span>
                      <span className="block text-xs text-cyber-text-muted mt-1.5">Audit database logging</span>
                    </div>
                  </div>

                  {/* Recent Activity lists */}
                  <div className="grid lg:grid-cols-2 gap-8">
                    
                    {/* Recent Scan History */}
                    <div className="cyber-panel p-6 bg-cyber-surface-card/40 space-y-4">
                      <h3 className="text-sm font-bold text-white uppercase border-b border-cyber-border pb-2 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-cyber-primary" /> Recent Verification Scans
                      </h3>
                      {analytics.recentActivity.recentScans.length === 0 ? (
                        <p className="text-xs text-cyber-text-muted py-6 text-center">No scan logs recorded yet.</p>
                      ) : (
                        <div className="space-y-3">
                          {analytics.recentActivity.recentScans.map((scan: any) => (
                            <div key={scan.id} className="text-xs border-b border-cyber-border/40 pb-2 flex justify-between items-start gap-4">
                              <div>
                                <span className="block font-bold text-white uppercase">Candidate: {scan.drug_tests?.name}</span>
                                <span className="text-cyber-text-muted font-mono">IP: {scan.ip_address || 'Unknown'}</span>
                              </div>
                              <span className="text-cyber-text-muted shrink-0">{new Date(scan.scanned_at).toLocaleDateString()}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Recent Key Redemptions */}
                    <div className="cyber-panel p-6 bg-cyber-surface-card/40 space-y-4">
                      <h3 className="text-sm font-bold text-white uppercase border-b border-cyber-border pb-2 flex items-center gap-2">
                        <Key className="h-4 w-4 text-cyber-primary" /> Recent Key Redemptions
                      </h3>
                      {analytics.recentActivity.recentRedeemedKeys.length === 0 ? (
                        <p className="text-xs text-cyber-text-muted py-6 text-center">No keys activated yet.</p>
                      ) : (
                        <div className="space-y-3">
                          {analytics.recentActivity.recentRedeemedKeys.map((key: any, idx: number) => (
                            <div key={idx} className="text-xs border-b border-cyber-border/40 pb-2 flex justify-between items-start gap-4">
                              <div>
                                <span className="block font-mono text-cyber-primary">{key.key}</span>
                                <span className="text-cyber-text-muted">Used by Profile ID: {key.used_by.substring(0, 8)}...</span>
                              </div>
                              <span className="text-cyber-text-muted shrink-0">{new Date(key.used_at).toLocaleDateString()}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 2: USER MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="cyber-panel p-6 bg-cyber-surface-card/30 space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-cyber-border pb-4">
                <h2 className="text-base font-bold text-white uppercase">User Audit Management</h2>
                <div className="relative w-full sm:w-72">
                  <input
                    type="text"
                    placeholder="Search users by email..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && loadUsers()}
                    className="w-full pl-9 pr-4 py-1.5 text-xs bg-cyber-surface border border-cyber-border"
                  />
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-cyber-text-muted" />
                </div>
              </div>

              {loadingUsers ? (
                <div className="text-center py-12">
                  <Loader2 className="h-10 w-10 text-cyber-primary animate-spin mx-auto mb-3" />
                  <span className="text-xs text-cyber-text-muted">Loading audit roster...</span>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-12 text-cyber-text-muted text-sm">No profiles found matching search query.</div>
              ) : (
                <>
                  {/* Mobile/Tablet Card View */}
                  <div className="space-y-4 md:hidden">
                    {users.map((u) => (
                      <div key={u.id} className="p-4 border border-cyber-border/40 rounded bg-cyber-surface/10 space-y-3 text-xs">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <span className="text-[10px] uppercase text-cyber-text-muted font-mono block font-semibold">Profile ID</span>
                            <span className="font-mono text-cyber-text-muted break-all">{u.id}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${u.role === 'admin' ? 'bg-cyber-primary/10 text-cyber-primary border border-cyber-primary/20' : 'bg-cyber-border text-cyber-text-muted'}`}>
                            {u.role.toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase text-cyber-text-muted font-mono block font-semibold">Security Email</span>
                          <span className="font-bold text-white text-sm break-all">{u.email}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-[10px] uppercase text-cyber-text-muted font-mono block font-semibold">Token Balance</span>
                            <span className="font-bold text-white">{u.generation_balance}</span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase text-cyber-text-muted font-mono block font-semibold">Node Status</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase inline-block ${u.status === 'active' ? 'bg-cyber-success/15 text-cyber-success' : 'bg-cyber-danger/15 text-cyber-danger'}`}>
                              {u.status}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-cyber-border/20">
                          <button
                            onClick={() => handleToggleUserStatus(u.id, u.status)}
                            className={`flex-grow text-center py-2 px-3 rounded border text-[10px] font-semibold cursor-pointer ${
                              u.status === 'active' 
                              ? 'border-cyber-danger/20 text-cyber-danger hover:bg-cyber-danger/5 bg-cyber-danger/5' 
                              : 'border-cyber-success/20 text-cyber-success hover:bg-cyber-success/5 bg-cyber-success/5'
                            }`}
                          >
                            {u.status === 'active' ? 'Suspend' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleResetUserPassword(u.id)}
                            className="flex-grow text-center py-2 px-3 rounded border border-cyber-primary/20 text-cyber-primary hover:bg-cyber-primary/5 bg-cyber-primary/5 text-[10px] font-semibold cursor-pointer"
                          >
                            Reset Pass
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="px-3 py-2 rounded border border-cyber-danger/20 text-cyber-danger hover:bg-cyber-danger/10 bg-cyber-danger/5 cursor-pointer flex items-center justify-center shrink-0"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-cyber-border uppercase text-cyber-text-muted font-bold">
                          <th className="pb-3">Profile ID</th>
                          <th className="pb-3">Security Email</th>
                          <th className="pb-3">Role</th>
                          <th className="pb-3 text-center">Token Balance</th>
                          <th className="pb-3">Node Status</th>
                          <th className="pb-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-cyber-border/40">
                        {users.map((u) => (
                          <tr key={u.id} className="hover:bg-cyber-surface/20">
                            <td className="py-3 font-mono text-cyber-text-muted">{u.id.substring(0, 8)}...</td>
                            <td className="py-3 font-bold text-white">{u.email}</td>
                            <td className="py-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${u.role === 'admin' ? 'bg-cyber-primary/10 text-cyber-primary border border-cyber-primary/20' : 'bg-cyber-border text-cyber-text-muted'}`}>
                                {u.role.toUpperCase()}
                              </span>
                            </td>
                            <td className="py-3 text-center font-bold">{u.generation_balance}</td>
                            <td className="py-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${u.status === 'active' ? 'bg-cyber-success/15 text-cyber-success' : 'bg-cyber-danger/15 text-cyber-danger'}`}>
                                {u.status}
                              </span>
                            </td>
                            <td className="py-3 text-right space-x-2">
                              <button
                                onClick={() => handleToggleUserStatus(u.id, u.status)}
                                className={`px-2 py-1 rounded border text-[10px] font-semibold cursor-pointer ${
                                  u.status === 'active' 
                                  ? 'border-cyber-danger/20 text-cyber-danger hover:bg-cyber-danger/5' 
                                  : 'border-cyber-success/20 text-cyber-success hover:bg-cyber-success/5'
                                }`}
                              >
                                {u.status === 'active' ? 'Suspend' : 'Activate'}
                              </button>
                              <button
                                onClick={() => handleResetUserPassword(u.id)}
                                className="px-2 py-1 rounded border border-cyber-primary/20 text-cyber-primary hover:bg-cyber-primary/5 text-[10px] font-semibold cursor-pointer"
                              >
                                Reset Pass
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u.id)}
                                className="px-2 py-1 rounded border border-cyber-danger/20 text-cyber-danger hover:bg-cyber-danger/10 text-[10px] font-semibold cursor-pointer"
                              >
                                <Trash2 className="h-3 w-3 inline" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 3: ACTIVATION KEYS */}
          {activeTab === 'keys' && (
            <div className="grid lg:grid-cols-3 gap-8 animate-fadeIn">
              
              {/* Generate codes box */}
              <div className="cyber-panel p-6 bg-cyber-surface-card/40 h-fit space-y-4">
                <h3 className="text-sm font-bold text-white uppercase border-b border-cyber-border pb-2">
                  Generate Activation Codes
                </h3>
                <form onSubmit={handleGenerateKeys} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-cyber-text-muted mb-2">
                      Quantity to Compile (Max 100)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={keyCount}
                      onChange={(e) => setKeyCount(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 bg-cyber-surface border border-cyber-border text-center text-sm font-bold"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isGeneratingKeys}
                    className="w-full cyber-button text-xs py-2"
                  >
                    {isGeneratingKeys ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Compiling Tokens...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" /> Generate Codes
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Keys list box */}
              <div className="lg:col-span-2 cyber-panel p-6 bg-cyber-surface-card/30 space-y-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-cyber-border pb-4">
                  <h2 className="text-sm font-bold text-white uppercase">Key Stock Audit</h2>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <select
                      value={keyFilter}
                      onChange={(e) => setKeyFilter(e.target.value)}
                      className="px-2 py-1.5 text-xs bg-cyber-surface border border-cyber-border rounded"
                    >
                      <option value="all">All Keys</option>
                      <option value="unused">Unused Stock</option>
                      <option value="used">Redeemed Stock</option>
                    </select>
                    <div className="relative flex-grow sm:w-48">
                      <input
                        type="text"
                        placeholder="Search key..."
                        value={keySearch}
                        onChange={(e) => setKeySearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && loadKeys()}
                        className="w-full pl-9 pr-4 py-1.5 text-xs bg-cyber-surface border border-cyber-border"
                      />
                      <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-cyber-text-muted" />
                    </div>
                  </div>
                </div>

                {loadingKeys ? (
                  <div className="text-center py-12">
                    <Loader2 className="h-10 w-10 text-cyber-primary animate-spin mx-auto mb-3" />
                    <span className="text-xs text-cyber-text-muted">Loading crypt-keys database...</span>
                  </div>
                ) : keys.length === 0 ? (
                  <div className="text-center py-12 text-cyber-text-muted text-xs">No keys matching criteria.</div>
                ) : (
                  <>
                    {/* Mobile/Tablet Card View */}
                    <div className="space-y-4 md:hidden">
                      {keys.map((k) => (
                        <div key={k.id} className="p-4 border border-cyber-border/40 rounded bg-cyber-surface/10 space-y-3 text-xs font-mono">
                          <div className="flex justify-between items-center gap-4">
                            <span className="font-bold text-white text-sm break-all">{k.key}</span>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase font-sans shrink-0 ${k.is_used ? 'bg-cyber-danger/15 text-cyber-danger' : 'bg-cyber-success/15 text-cyber-success'}`}>
                              {k.is_used ? 'REDEEMED' : 'UNUSEDACTIVE'}
                            </span>
                          </div>
                          {k.is_used && (
                            <div className="space-y-2 font-sans text-cyber-text-muted border-t border-cyber-border/20 pt-2">
                              <div>
                                <span className="text-[9px] uppercase text-cyber-text-muted font-mono block font-semibold">Redeemed By</span>
                                <span className="break-all">{k.used_by_profile?.email || 'System Sync'}</span>
                              </div>
                              <div>
                                <span className="text-[9px] uppercase text-cyber-text-muted font-mono block font-semibold">Redeemed Date</span>
                                <span>{new Date(k.used_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                          )}
                          <div className="flex justify-end pt-2 border-t border-cyber-border/20">
                            <button
                              onClick={() => handleDeleteKey(k.id)}
                              className="text-cyber-danger hover:text-white border border-cyber-danger/20 hover:bg-cyber-danger/10 px-3 py-1.5 rounded transition-colors cursor-pointer font-sans text-xs flex items-center gap-1"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Delete Key
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-cyber-border uppercase text-cyber-text-muted font-bold">
                            <th className="pb-3">Activation Key</th>
                            <th className="pb-3">State</th>
                            <th className="pb-3">Redeemed By</th>
                            <th className="pb-3">Redeemed Date</th>
                            <th className="pb-3 text-right">Delete</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-cyber-border/40">
                          {keys.map((k) => (
                            <tr key={k.id} className="hover:bg-cyber-surface/20 font-mono">
                              <td className="py-2.5 font-bold text-white">{k.key}</td>
                              <td className="py-2.5 font-sans">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${k.is_used ? 'bg-cyber-danger/15 text-cyber-danger' : 'bg-cyber-success/15 text-cyber-success'}`}>
                                  {k.is_used ? 'REDEEMED' : 'UNUSEDACTIVE'}
                                </span>
                              </td>
                              <td className="py-2.5 font-sans text-cyber-text-muted">
                                {k.is_used ? (k.used_by_profile?.email || 'System Sync') : '-'}
                              </td>
                              <td className="py-2.5 text-cyber-text-muted font-sans text-[11px]">
                                {k.is_used ? new Date(k.used_at).toLocaleDateString() : '-'}
                              </td>
                              <td className="py-2.5 text-right font-sans">
                                <button
                                  onClick={() => handleDeleteKey(k.id)}
                                  className="text-cyber-danger hover:text-white hover:bg-cyber-danger/10 px-2 py-1 rounded transition-colors cursor-pointer"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>

            </div>
          )}

          {/* TAB 4: DRUG CERTIFICATES */}
          {activeTab === 'tests' && (
            <div className="cyber-panel p-6 bg-cyber-surface-card/30 space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-cyber-border pb-4">
                <h2 className="text-base font-bold text-white uppercase">Generated Certificate Registry</h2>
                <div className="relative w-full sm:w-72">
                  <input
                    type="text"
                    placeholder="Search candidate name or cert number..."
                    value={testSearch}
                    onChange={(e) => setTestSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && loadTests()}
                    className="w-full pl-9 pr-4 py-1.5 text-xs bg-cyber-surface border border-cyber-border"
                  />
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-cyber-text-muted" />
                </div>
              </div>

              {loadingTests ? (
                <div className="text-center py-12">
                  <Loader2 className="h-10 w-10 text-cyber-primary animate-spin mx-auto mb-3" />
                  <span className="text-xs text-cyber-text-muted">Loading certificate database...</span>
                </div>
              ) : tests.length === 0 ? (
                <div className="text-center py-12 text-cyber-text-muted text-sm">No certificate records found.</div>
              ) : (
                <>
                  {/* Mobile/Tablet Card View */}
                  <div className="space-y-4 md:hidden">
                    {tests.map((t) => (
                      <div key={t.id} className="p-4 border border-cyber-border/40 rounded bg-cyber-surface/10 space-y-3 text-xs">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <span className="text-[10px] uppercase text-cyber-text-muted font-mono block font-semibold">Candidate Full Name</span>
                            <span className="font-bold text-white uppercase text-sm block">{t.name}</span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-[10px] uppercase text-cyber-text-muted font-mono block font-semibold">Downloads</span>
                            <span className="font-bold text-white">{t.download_count}</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-[10px] uppercase text-cyber-text-muted font-mono block font-semibold">Certificate Code</span>
                            <span className="font-mono text-cyber-primary">{t.certificate_number}</span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase text-cyber-text-muted font-mono block font-semibold">Compile Date</span>
                            <span className="text-cyber-text-muted">{new Date(t.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase text-cyber-text-muted font-mono block font-semibold">Generated By (Account)</span>
                          <span className="text-cyber-text-muted break-all">{t.profiles?.email || 'Revoked Node'}</span>
                        </div>
                        <div className="flex gap-2 pt-2 border-t border-cyber-border/20">
                          <button
                            onClick={() => handleViewTestHistory(t)}
                            className="flex-grow text-center py-2 border border-cyber-primary/20 bg-cyber-primary/5 hover:bg-cyber-primary/10 text-cyber-primary rounded font-bold cursor-pointer text-xs"
                          >
                            Scan Logs
                          </button>
                          <a 
                            href={documentApi.getRenderUrl(t.id)} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex-grow text-center py-2 border border-cyber-border bg-cyber-surface hover:text-white rounded inline-flex items-center justify-center gap-1 font-bold text-xs"
                          >
                            <Eye className="h-3 w-3" /> View
                          </a>
                          <button
                            onClick={() => handleDeleteTest(t.id)}
                            className="px-3 py-2 rounded border border-cyber-danger/20 text-cyber-danger hover:bg-cyber-danger/10 bg-cyber-danger/5 cursor-pointer flex items-center justify-center shrink-0"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-cyber-border uppercase text-cyber-text-muted font-bold">
                          <th className="pb-3">Candidate Full Name</th>
                          <th className="pb-3">Certificate Code</th>
                          <th className="pb-3">Generated By (Account)</th>
                          <th className="pb-3 text-center">Downloads</th>
                          <th className="pb-3">Compile Date</th>
                          <th className="pb-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-cyber-border/40">
                        {tests.map((t) => (
                          <tr key={t.id} className="hover:bg-cyber-surface/20">
                            <td className="py-3 font-bold text-white uppercase">{t.name}</td>
                            <td className="py-3 font-mono text-cyber-primary">{t.certificate_number}</td>
                            <td className="py-3 text-cyber-text-muted">{t.profiles?.email || 'Revoked Node'}</td>
                            <td className="py-3 text-center font-bold">{t.download_count}</td>
                            <td className="py-3 text-cyber-text-muted">
                              {new Date(t.created_at).toLocaleDateString()}
                            </td>
                            <td className="py-3 text-right space-x-2">
                              <button
                                onClick={() => handleViewTestHistory(t)}
                                className="px-2.5 py-1 border border-cyber-primary/20 bg-cyber-primary/5 hover:bg-cyber-primary/10 text-cyber-primary rounded font-bold cursor-pointer"
                              >
                                Scan Logs
                              </button>
                              <a 
                                href={documentApi.getRenderUrl(t.id)} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="px-2.5 py-1 border border-cyber-border bg-cyber-surface hover:text-white rounded inline-flex items-center gap-1 font-bold"
                              >
                                <Eye className="h-3 w-3" /> View
                              </a>
                              <button
                                onClick={() => handleDeleteTest(t.id)}
                                className="px-2 py-1 rounded border border-cyber-danger/20 text-cyber-danger hover:bg-cyber-danger/10 cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5 inline" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 5: PLATFORM SETTINGS */}
          {activeTab === 'settings' && (
            <div className="cyber-panel p-6 bg-cyber-surface-card/30 max-w-xl animate-fadeIn">
              <h2 className="text-base font-bold text-white uppercase border-b border-cyber-border pb-3 mb-6">
                Platform Administrative Settings
              </h2>
              
              {loadingSettings ? (
                <div className="text-center py-12">
                  <Loader2 className="h-10 w-10 text-cyber-primary animate-spin mx-auto mb-3" />
                  <span className="text-xs text-cyber-text-muted">Loading settings...</span>
                </div>
              ) : (
                <form onSubmit={handleUpdateSettings} className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-cyber-text-muted mb-2">
                      Telegram Contact Username / Link
                    </label>
                    <input
                      type="text"
                      value={telegramUsernameInput}
                      onChange={(e) => setTelegramUsernameInput(e.target.value)}
                      placeholder="@admin_username"
                      className="w-full px-3 py-2 bg-cyber-surface border border-cyber-border font-mono"
                    />
                    <p className="mt-1.5 text-xs text-cyber-text-muted">
                      This username/link controls the landing page CTA ("Contact Administrator on Telegram"). Include the @ symbol (e.g. @merlin_admin).
                    </p>
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isUpdatingSettings || !telegramUsernameInput.trim()}
                      className="cyber-button px-6"
                    >
                      {isUpdatingSettings ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Updating Node...
                        </>
                      ) : (
                        'Save Config'
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

        </main>
      </div>

      {/* Audit scan history Modal */}
      {historyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="cyber-panel bg-cyber-surface-card max-w-2xl w-full h-[60vh] flex flex-col">
            <div className="px-6 py-4 border-b border-cyber-border bg-cyber-surface flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-white text-base">Verification History Audit</h3>
                <span className="text-xs text-cyber-text-muted uppercase font-semibold">Candidate: {selectedTestName}</span>
              </div>
              <button 
                onClick={() => setHistoryModalOpen(false)}
                className="text-cyber-text-muted hover:text-white border border-cyber-border px-3 py-1.5 rounded text-xs w-full sm:w-auto text-center"
              >
                Close Logs
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {loadingHistory ? (
                <div className="text-center py-12">
                  <Loader2 className="h-8 w-8 text-cyber-primary animate-spin mx-auto mb-3" />
                  <span className="text-xs text-cyber-text-muted">Parsing scan audit logs...</span>
                </div>
              ) : activeTestHistory.length === 0 ? (
                <div className="text-center py-12 text-cyber-text-muted text-xs">
                  This document has not been verified/scanned yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {activeTestHistory.map((log) => (
                    <div key={log.id} className="cyber-panel p-4 bg-cyber-surface/50 text-xs border border-cyber-border/40 font-mono space-y-1.5">
                      <div className="flex justify-between border-b border-cyber-border pb-1">
                        <span className="text-cyber-primary font-bold">SCAN COMPLETED</span>
                        <span className="text-cyber-text-muted">{new Date(log.scanned_at).toLocaleString()}</span>
                      </div>
                      <p><strong className="text-white">IP:</strong> {log.ip_address || 'Proxy hidden'}</p>
                      <p><strong className="text-white">User-Agent:</strong> {log.user_agent || 'Unknown browser'}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
