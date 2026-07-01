import { useState, useEffect } from 'react';

const API_BASE_URL = 'https://banking-system-qdnx.onrender.com';

// ... (ChangePasswordModal component remains the same) ...

function ChangePasswordModal({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess: () => void }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        alert('Password changed successfully!');
        onSuccess();
        onClose();
      } else {
        setError(data.detail || 'Failed to change password');
      }
    } catch (err) {
      setError('Error connecting to server');
    }
    setLoading(false);
  };

  if (!isOpen) return null;
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', maxWidth: '400px', width: '90%' }}>
        <h2>🔑 Change Password</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}><label>Current Password</label><input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required style={{ width: '100%', padding: '8px', marginTop: '4px' }} /></div>
          <div style={{ marginBottom: '15px' }}><label>New Password</label><input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} style={{ width: '100%', padding: '8px', marginTop: '4px' }} /></div>
          <div style={{ marginBottom: '15px' }}><label>Confirm New Password</label><input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required style={{ width: '100%', padding: '8px', marginTop: '4px' }} /></div>
          {error && <p style={{ color: 'red', fontSize: '14px' }}>{error}</p>}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '8px 16px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ padding: '8px 16px', background: '#0056b3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>{loading ? 'Saving...' : 'Change Password'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- LOAN APPLICATION FORM COMPONENT ---
function LoanApplicationForm({ onSuccess, clients }: { onSuccess: () => void; clients: any[] }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    client_id: '',
    principal: 5000000,
    annual_interest_rate: 12,
    tenure_months: 12,
    guarantor_name: '',
    guarantor_phone: '',
    guarantor_email: '',
    guarantor_relationship: '',
    employment_status: 'Employed',
    monthly_income: 2500000,
    existing_debts: 200000,
    credit_score: 720,
    collateral_type: 'Land Title',
    collateral_value: 20000000,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.client_id) { alert('Please select a client'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/admin/loans/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        alert(`✅ Loan application submitted! Loan ID: ${data.loan_id}\nMonthly EMI: UGX ${data.monthly_emi}`);
        onSuccess();
      } else {
        alert('Failed to submit loan: ' + (data.detail || 'Unknown error'));
      }
    } catch (err) { alert('Error submitting loan'); }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} style={{ background: '#f8f9fa', padding: '25px', borderRadius: '8px', marginTop: '20px' }}>
      {/* Select Client */}
      <div style={{ marginBottom: '20px', background: '#e9ecef', padding: '15px', borderRadius: '8px' }}>
        <h3 style={{ margin: '0 0 15px 0' }}>👤 Select Client</h3>
        <div>
          <label style={{ fontWeight: 'bold', fontSize: '14px' }}>Client *</label>
          <select value={formData.client_id} onChange={(e) => setFormData({...formData, client_id: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ced4da', marginTop: '4px' }} required>
            <option value="">Select a client...</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.first_name} {c.last_name} - {c.id_number}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Loan Terms */}
      <div style={{ background: '#fff3cd', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 15px 0' }}>💰 Loan Terms</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
          <div><label style={{ fontWeight: 'bold', fontSize: '14px' }}>Principal (UGX) *</label><input type="number" value={formData.principal} onChange={(e) => setFormData({...formData, principal: parseFloat(e.target.value)})} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ced4da', marginTop: '4px' }} required /></div>
          <div><label style={{ fontWeight: 'bold', fontSize: '14px' }}>Annual Rate (%) *</label><input type="number" step="0.01" value={formData.annual_interest_rate} onChange={(e) => setFormData({...formData, annual_interest_rate: parseFloat(e.target.value)})} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ced4da', marginTop: '4px' }} required /></div>
          <div><label style={{ fontWeight: 'bold', fontSize: '14px' }}>Tenure (Months) *</label><input type="number" value={formData.tenure_months} onChange={(e) => setFormData({...formData, tenure_months: parseInt(e.target.value)})} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ced4da', marginTop: '4px' }} required /></div>
        </div>
      </div>

      {/* Guarantor */}
      <div style={{ background: '#cfe2ff', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 15px 0' }}>👥 Guarantor</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div><label style={{ fontWeight: 'bold', fontSize: '14px' }}>Full Name</label><input value={formData.guarantor_name} onChange={(e) => setFormData({...formData, guarantor_name: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ced4da', marginTop: '4px' }} /></div>
          <div><label style={{ fontWeight: 'bold', fontSize: '14px' }}>Phone</label><input value={formData.guarantor_phone} onChange={(e) => setFormData({...formData, guarantor_phone: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ced4da', marginTop: '4px' }} /></div>
          <div><label style={{ fontWeight: 'bold', fontSize: '14px' }}>Email</label><input value={formData.guarantor_email} onChange={(e) => setFormData({...formData, guarantor_email: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ced4da', marginTop: '4px' }} /></div>
          <div><label style={{ fontWeight: 'bold', fontSize: '14px' }}>Relationship</label><input value={formData.guarantor_relationship} onChange={(e) => setFormData({...formData, guarantor_relationship: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ced4da', marginTop: '4px' }} /></div>
        </div>
      </div>

      {/* Financials */}
      <div style={{ background: '#d4edda', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 15px 0' }}>📊 Financial & Employment</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
          <div><label style={{ fontWeight: 'bold', fontSize: '14px' }}>Employment Status</label><select value={formData.employment_status} onChange={(e) => setFormData({...formData, employment_status: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ced4da', marginTop: '4px' }}><option>Employed</option><option>Self-Employed</option><option>Unemployed</option><option>Retired</option></select></div>
          <div><label style={{ fontWeight: 'bold', fontSize: '14px' }}>Monthly Income (UGX)</label><input type="number" value={formData.monthly_income} onChange={(e) => setFormData({...formData, monthly_income: parseFloat(e.target.value)})} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ced4da', marginTop: '4px' }} /></div>
          <div><label style={{ fontWeight: 'bold', fontSize: '14px' }}>Existing Debts (UGX/month)</label><input type="number" value={formData.existing_debts} onChange={(e) => setFormData({...formData, existing_debts: parseFloat(e.target.value)})} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ced4da', marginTop: '4px' }} /></div>
          <div><label style={{ fontWeight: 'bold', fontSize: '14px' }}>Credit Score</label><input type="number" value={formData.credit_score} onChange={(e) => setFormData({...formData, credit_score: parseInt(e.target.value)})} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ced4da', marginTop: '4px' }} /></div>
          <div><label style={{ fontWeight: 'bold', fontSize: '14px' }}>Collateral Type</label><input value={formData.collateral_type} onChange={(e) => setFormData({...formData, collateral_type: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ced4da', marginTop: '4px' }} /></div>
          <div><label style={{ fontWeight: 'bold', fontSize: '14px' }}>Collateral Value (UGX)</label><input type="number" value={formData.collateral_value} onChange={(e) => setFormData({...formData, collateral_value: parseFloat(e.target.value)})} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ced4da', marginTop: '4px' }} /></div>
        </div>
      </div>

      <button type="submit" disabled={loading} style={{ padding: '12px 40px', background: '#0056b3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '18px', width: '100%' }}>
        {loading ? 'Submitting...' : '✅ Submit Loan Application'}
      </button>
    </form>
  );
}

function App() {
  const [view, setView] = useState<'login' | 'admin'>('login');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [showLoanForm, setShowLoanForm] = useState(false);
  const [showClientForm, setShowClientForm] = useState(false);

  const [clientForm, setClientForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    id_number: '',
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/me`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        setView('admin');
        fetchAdminData();
        fetchClients();
        fetchLoans();
      } else {
        localStorage.removeItem('token');
        setView('login');
      }
    } catch { setView('login'); }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.access_token);
        await fetchUser();
      } else {
        alert('Login failed: ' + (data.detail || 'Unknown error'));
      }
    } catch (err) { alert('Error connecting to server'); }
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setView('login');
  };

  const fetchAdminData = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/admin/dashboard`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDashboardStats(data);
      }
    } catch (err) { console.error(err); }
  };

  const fetchClients = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/admin/clients`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setClients(data);
      }
    } catch (err) { console.error(err); }
  };

  const fetchLoans = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/admin/loans`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLoans(data);
      }
    } catch (err) { console.error(err); }
  };

  const updateLoanStatus = async (loanId: number, status: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/admin/loans/${loanId}/status?status=${status}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        alert('Status updated!');
        fetchLoans();
        fetchAdminData();
      } else { alert('Failed to update'); }
    } catch (err) { alert('Error'); }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/admin/clients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(clientForm)
      });
      if (res.ok) {
        alert('✅ Client created successfully!');
        setShowClientForm(false);
        setClientForm({ first_name: '', last_name: '', email: '', phone: '', address: '', id_number: '' });
        fetchClients();
        fetchAdminData();
      } else {
        const data = await res.json();
        alert('Failed to create client: ' + (data.detail || 'Unknown error'));
      }
    } catch (err) { alert('Error creating client'); }
    setLoading(false);
  };

  // --- RENDER: LOGIN ---
  if (view === 'login') {
    return (
      <div style={{ maxWidth: '400px', margin: '80px auto', padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
        <h1>🏦 Loan Management System</h1>
        <form onSubmit={handleLogin}>
          <input type="text" placeholder="Username" value={loginForm.username} onChange={e => setLoginForm({...loginForm, username: e.target.value})} style={{ width: '100%', padding: '8px', margin: '5px 0' }} required />
          <input type="password" placeholder="Password" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} style={{ width: '100%', padding: '8px', margin: '5px 0' }} required />
          <button type="submit" disabled={loading} style={{ width: '100%', padding: '10px', background: '#0056b3', color: 'white', border: 'none', borderRadius: '4px' }}>Login</button>
        </form>
        <p style={{ textAlign: 'center', fontSize: '12px', color: 'gray', marginTop: '10px' }}>Default Admin: admin / admin123</p>
      </div>
    );
  }

  // --- RENDER: ADMIN DASHBOARD ---
  if (view === 'admin') {
    return (
      <div style={{ maxWidth: '1200px', margin: '20px auto', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #dc3545', paddingBottom: '10px' }}>
          <h1>🔐 Admin Panel - {user?.full_name}</h1>
          <div>
            <button onClick={() => setShowChangePassword(true)} style={{ marginRight: '10px', padding: '8px 16px', background: '#6f42c1', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>🔑 Change Password</button>
            <button onClick={handleLogout} style={{ padding: '8px 16px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>🚪 Logout</button>
          </div>
        </div>

        {/* --- BUTTONS --- */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
          <button onClick={() => { setShowClientForm(!showClientForm); setShowLoanForm(false); }} style={{ padding: '8px 16px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>➕ New Client</button>
          <button onClick={() => { setShowLoanForm(!showLoanForm); setShowClientForm(false); }} style={{ padding: '8px 16px', background: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>📝 New Loan Application</button>
          <button onClick={fetchAdminData} style={{ padding: '8px 16px', background: '#ffc107', color: 'black', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>🔄 Refresh</button>
          <button onClick={fetchClients} style={{ padding: '8px 16px', background: '#6f42c1', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>👥 View Clients</button>
          <button onClick={fetchLoans} style={{ padding: '8px 16px', background: '#fd7e14', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>📋 View Loans</button>
        </div>

        {/* --- STATS --- */}
        {dashboardStats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '15px', marginBottom: '20px' }}>
            <div style={{ background: '#e3f2fd', padding: '15px', borderRadius: '8px', textAlign: 'center' }}><strong>Clients</strong><br />{dashboardStats.total_clients || 0}</div>
            <div style={{ background: '#e3f2fd', padding: '15px', borderRadius: '8px', textAlign: 'center' }}><strong>Total Loans</strong><br />{dashboardStats.total_loans || 0}</div>
            <div style={{ background: '#fff3cd', padding: '15px', borderRadius: '8px', textAlign: 'center' }}><strong>Pending</strong><br />{dashboardStats.pending || 0}</div>
            <div style={{ background: '#d4edda', padding: '15px', borderRadius: '8px', textAlign: 'center' }}><strong>Approved</strong><br />{dashboardStats.approved || 0}</div>
            <div style={{ background: '#f8d7da', padding: '15px', borderRadius: '8px', textAlign: 'center' }}><strong>Rejected</strong><br />{dashboardStats.rejected || 0}</div>
            <div style={{ background: '#cfe2ff', padding: '15px', borderRadius: '8px', textAlign: 'center' }}><strong>Disbursed</strong><br />{dashboardStats.disbursed || 0}</div>
          </div>
        )}

        {/* --- NEW CLIENT FORM --- */}
        {showClientForm && (
          <form onSubmit={handleCreateClient} style={{ background: '#f8f9fa', padding: '25px', borderRadius: '8px', marginBottom: '20px' }}>
            <h3>➕ New Client</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
              <div><label>First Name *</label><input value={clientForm.first_name} onChange={(e) => setClientForm({...clientForm, first_name: e.target.value})} style={{ width: '100%', padding: '8px' }} required /></div>
              <div><label>Last Name *</label><input value={clientForm.last_name} onChange={(e) => setClientForm({...clientForm, last_name: e.target.value})} style={{ width: '100%', padding: '8px' }} required /></div>
              <div><label>Email *</label><input type="email" value={clientForm.email} onChange={(e) => setClientForm({...clientForm, email: e.target.value})} style={{ width: '100%', padding: '8px' }} required /></div>
              <div><label>Phone *</label><input value={clientForm.phone} onChange={(e) => setClientForm({...clientForm, phone: e.target.value})} style={{ width: '100%', padding: '8px' }} required /></div>
              <div><label>Address</label><input value={clientForm.address} onChange={(e) => setClientForm({...clientForm, address: e.target.value})} style={{ width: '100%', padding: '8px' }} /></div>
              <div><label>ID Number *</label><input value={clientForm.id_number} onChange={(e) => setClientForm({...clientForm, id_number: e.target.value})} style={{ width: '100%', padding: '8px' }} required /></div>
            </div>
            <button type="submit" disabled={loading} style={{ marginTop: '15px', padding: '8px 16px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>{loading ? 'Creating...' : '✅ Create Client'}</button>
          </form>
        )}

        {/* --- LOAN APPLICATION FORM --- */}
        {showLoanForm && (
          <LoanApplicationForm onSuccess={() => { setShowLoanForm(false); fetchLoans(); fetchAdminData(); }} clients={clients} />
        )}

        {/* --- CLIENTS TABLE --- */}
        {clients.length > 0 && !showClientForm && !showLoanForm && (
          <div style={{ marginTop: '20px' }}>
            <h2>👥 All Clients</h2>
            <div style={{ overflowX: 'auto', maxHeight: '400px', overflowY: 'scroll' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead style={{ position: 'sticky', top: 0, background: '#333', color: 'white' }}>
                  <tr><th>ID</th><th>Name</th><th>Email</th><th>Phone</th><th>ID Number</th><th>Created</th></tr>
                </thead>
                <tbody>
                  {clients.map((c) => (
                    <tr key={c.id} style={{ borderBottom: '1px solid #ddd' }}>
                      <td>#{c.id}</td>
                      <td>{c.first_name} {c.last_name}</td>
                      <td>{c.email}</td>
                      <td>{c.phone}</td>
                      <td>{c.id_number}</td>
                      <td>{new Date(c.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- LOANS TABLE --- */}
        {loans.length > 0 && !showClientForm && !showLoanForm && (
          <div style={{ marginTop: '30px' }}>
            <h2>📋 All Loan Applications</h2>
            <div style={{ overflowX: 'auto', maxHeight: '600px', overflowY: 'scroll' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead style={{ position: 'sticky', top: 0, background: '#333', color: 'white' }}>
                  <tr><th>ID</th><th>Client</th><th>Principal (UGX)</th><th>EMI (UGX)</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {loans.map((loan) => (
                    <tr key={loan.id} style={{ borderBottom: '1px solid #ddd' }}>
                      <td>#{loan.id}</td>
                      <td>{loan.client_name || 'Unknown'}</td>
                      <td>{loan.principal ? loan.principal.toLocaleString() : 0}</td>
                      <td>{loan.monthly_emi ? loan.monthly_emi.toLocaleString() : 0}</td>
                      <td>
                        <span style={{ 
                          background: loan.status === 'approved' ? '#d4edda' : 
                                     loan.status === 'pending' ? '#fff3cd' : 
                                     loan.status === 'disbursed' ? '#cfe2ff' : '#f8d7da', 
                          padding: '3px 8px', borderRadius: '4px' 
                        }}>
                          {loan.status || 'Unknown'}
                        </span>
                      </td>
                      <td>
                        {loan.status === 'pending' && (
                          <>
                            <button onClick={() => updateLoanStatus(loan.id, 'approved')} style={{ marginRight: '5px', padding: '4px 8px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Approve</button>
                            <button onClick={() => updateLoanStatus(loan.id, 'rejected')} style={{ padding: '4px 8px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Reject</button>
                          </>
                        )}
                        {loan.status === 'approved' && (
                          <button onClick={() => updateLoanStatus(loan.id, 'disbursed')} style={{ padding: '4px 8px', background: '#0d6efd', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Disburse</button>
                        )}
                        {loan.status !== 'pending' && loan.status !== 'approved' && loan.status !== 'disbursed' && (
                          <span style={{ fontStyle: 'italic' }}>✓ Done</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- CHANGE PASSWORD MODAL --- */}
        <ChangePasswordModal isOpen={showChangePassword} onClose={() => setShowChangePassword(false)} onSuccess={() => {}} />
      </div>
    );
  }

  return <div>Loading...</div>;
}

export default App;