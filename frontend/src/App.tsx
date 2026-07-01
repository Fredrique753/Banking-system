import { useState, useEffect } from 'react';

// --- USE THIS FOR PRODUCTION (RENDER) ---
const API_BASE_URL = 'https://banking-system-qdnx.onrender.com';

// --- UNCOMMENT THIS FOR LOCAL DEVELOPMENT ---
// const API_BASE_URL = 'http://localhost:8000';

// --- CHANGE PASSWORD MODAL COMPONENT ---
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
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword
        })
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
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '8px',
        maxWidth: '400px',
        width: '90%',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
      }}>
        <h2>🔑 Change Password</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label>Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '8px', marginTop: '4px' }}
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label>New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              style={{ width: '100%', padding: '8px', marginTop: '4px' }}
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label>Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '8px', marginTop: '4px' }}
            />
          </div>
          {error && <p style={{ color: 'red', fontSize: '14px' }}>{error}</p>}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: '8px 16px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{ padding: '8px 16px', background: '#0056b3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              {loading ? 'Saving...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function App() {
  const [view, setView] = useState<'login' | 'register' | 'borrower' | 'admin'>('login');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ username: '', email: '', password: '', full_name: '' });

  const [formData, setFormData] = useState({
    customer_name: 'John Doe',
    customer_email: 'john@example.com',
    customer_phone: '+256700000000',
    next_of_kin_name: 'Jane Doe',
    next_of_kin_relationship: 'Spouse',
    next_of_kin_phone: '+256700000001',
    principal: 5000000,
    annual_interest_rate: 12,
    tenure_months: 12,
    employment_status: 'Employed',
    monthly_income: 2500000,
    existing_debts: 200000,
    credit_score: 720,
    collateral_type: 'Land Title',
    collateral_value: 20000000,
  });
  const [guarantors, setGuarantors] = useState<any[]>([
    { id: Date.now(), name: 'Mike Smith', email: 'mike@example.com', phone: '+256712345678', relationship: 'Friend', employment_status: 'Employed', monthly_income: 3000000 }
  ]);
  const [result, setResult] = useState<any>(null);
  const [myLoans, setMyLoans] = useState<any[]>([]);
  const [savedLoanId, setSavedLoanId] = useState<number | null>(null);
  const [adminLoans, setAdminLoans] = useState<any[]>([]);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  
  // --- STATE FOR CHANGE PASSWORD MODAL ---
  const [showChangePassword, setShowChangePassword] = useState(false);

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
        setView(data.role === 'admin' ? 'admin' : 'borrower');
        if (data.role === 'admin') fetchAdminData();
        else fetchMyLoans();
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
    } catch (err) {
      alert('Error connecting to server');
    }
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerForm)
      });
      if (res.ok) {
        alert('Registration successful! Please log in.');
        setView('login');
      } else {
        alert('Registration failed');
      }
    } catch (err) {
      alert('Error connecting to server');
    }
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setView('login');
  };

  const fetchMyLoans = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/loans`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMyLoans(data);
      }
    } catch (err) { console.error(err); }
  };

  const handleLoanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const payload = { ...formData, guarantors: guarantors.map(g => ({ ...g, monthly_income: parseFloat(g.monthly_income) || 0 })) };
      const res = await fetch(`${API_BASE_URL}/api/v1/apply-loan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        setSavedLoanId(data.loan_id);
        await fetchMyLoans();
        const calcRes = await fetch(`${API_BASE_URL}/api/v1/calculate-loan`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ principal: payload.principal, annual_interest_rate: payload.annual_interest_rate, tenure_months: payload.tenure_months })
        });
        const calcData = await calcRes.json();
        setResult(calcData);
      } else { alert('Submission failed'); }
    } catch (err) { alert('Error submitting loan'); }
    setLoading(false);
  };

  const downloadPDF = async (loanId: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/loans/${loanId}/pdf`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `loan_${loanId}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else { alert('Failed to download PDF'); }
    } catch (err) { alert('Error downloading PDF'); }
  };

  const fetchAdminData = async () => {
    try {
      const statsRes = await fetch(`${API_BASE_URL}/api/v1/admin/dashboard`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (statsRes.ok) {
        const stats = await statsRes.json();
        setDashboardStats(stats);
      }
      const loansRes = await fetch(`${API_BASE_URL}/api/v1/admin/loans`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (loansRes.ok) {
        const loans = await loansRes.json();
        setAdminLoans(loans);
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
        await fetchAdminData();
      } else { alert('Failed to update'); }
    } catch (err) { alert('Error'); }
  };

  // --- RENDER: LOGIN ---
  if (view === 'login') {
    return (
      <div style={{ maxWidth: '400px', margin: '80px auto', padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
        <h1>🏦 Login</h1>
        <form onSubmit={handleLogin}>
          <input type="text" placeholder="Username" value={loginForm.username} onChange={e => setLoginForm({...loginForm, username: e.target.value})} style={{ width: '100%', padding: '8px', margin: '5px 0' }} required />
          <input type="password" placeholder="Password" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} style={{ width: '100%', padding: '8px', margin: '5px 0' }} required />
          <button type="submit" disabled={loading} style={{ width: '100%', padding: '10px', background: '#0056b3', color: 'white', border: 'none', borderRadius: '4px' }}>Login</button>
        </form>
        <p style={{ marginTop: '10px', textAlign: 'center' }}>Don't have an account? <button onClick={() => setView('register')} style={{ background: 'none', border: 'none', color: '#0056b3', cursor: 'pointer' }}>Register</button></p>
        <p style={{ textAlign: 'center', fontSize: '12px', color: 'gray' }}>Default Admin: admin / admin123</p>
      </div>
    );
  }

  if (view === 'register') {
    return (
      <div style={{ maxWidth: '400px', margin: '80px auto', padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
        <h1>📝 Register</h1>
        <form onSubmit={handleRegister}>
          <input type="text" placeholder="Full Name" value={registerForm.full_name} onChange={e => setRegisterForm({...registerForm, full_name: e.target.value})} style={{ width: '100%', padding: '8px', margin: '5px 0' }} />
          <input type="text" placeholder="Username" value={registerForm.username} onChange={e => setRegisterForm({...registerForm, username: e.target.value})} style={{ width: '100%', padding: '8px', margin: '5px 0' }} required />
          <input type="email" placeholder="Email" value={registerForm.email} onChange={e => setRegisterForm({...registerForm, email: e.target.value})} style={{ width: '100%', padding: '8px', margin: '5px 0' }} required />
          <input type="password" placeholder="Password" value={registerForm.password} onChange={e => setRegisterForm({...registerForm, password: e.target.value})} style={{ width: '100%', padding: '8px', margin: '5px 0' }} required />
          <button type="submit" disabled={loading} style={{ width: '100%', padding: '10px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px' }}>Register</button>
        </form>
        <p style={{ marginTop: '10px', textAlign: 'center' }}>Already registered? <button onClick={() => setView('login')} style={{ background: 'none', border: 'none', color: '#0056b3', cursor: 'pointer' }}>Login</button></p>
      </div>
    );
  }

  // --- BORROWER DASHBOARD (ORGANIZED FORM) ---
  if (view === 'borrower') {
    return (
      <div style={{ maxWidth: '1100px', margin: '20px auto', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #0056b3', paddingBottom: '10px' }}>
          <h1>🏦 Welcome, {user?.full_name || user?.username}</h1>
          <div>
            <button onClick={() => { setView('borrower'); setResult(null); setSavedLoanId(null); }} style={{ marginRight: '10px', padding: '8px 16px', background: '#0056b3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>New Loan</button>
            <button onClick={fetchMyLoans} style={{ marginRight: '10px', padding: '8px 16px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>My Loans</button>
            <button onClick={() => setShowChangePassword(true)} style={{ marginRight: '10px', padding: '8px 16px', background: '#6f42c1', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>🔑 Change Password</button>
            <button onClick={handleLogout} style={{ padding: '8px 16px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Logout</button>
          </div>
        </div>

        {!result && !savedLoanId && (
          <form onSubmit={handleLoanSubmit} style={{ background: '#f8f9fa', padding: '25px', borderRadius: '8px', marginTop: '20px' }}>
            
            {/* --- SECTION 1: CUSTOMER & NEXT OF KIN --- */}
            <div style={{ background: '#e9ecef', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
              <h3 style={{ margin: '0 0 15px 0' }}>👤 Customer & Next of Kin</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ fontWeight: 'bold', fontSize: '14px' }}>Full Name *</label>
                  <input name="customer_name" placeholder="Full Name" value={formData.customer_name} onChange={e => setFormData({...formData, customer_name: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ced4da', marginTop: '4px' }} required />
                </div>
                <div>
                  <label style={{ fontWeight: 'bold', fontSize: '14px' }}>Email *</label>
                  <input name="customer_email" placeholder="Email" value={formData.customer_email} onChange={e => setFormData({...formData, customer_email: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ced4da', marginTop: '4px' }} required />
                </div>
                <div>
                  <label style={{ fontWeight: 'bold', fontSize: '14px' }}>Phone *</label>
                  <input name="customer_phone" placeholder="Phone" value={formData.customer_phone} onChange={e => setFormData({...formData, customer_phone: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ced4da', marginTop: '4px' }} required />
                </div>
                <div>
                  <label style={{ fontWeight: 'bold', fontSize: '14px' }}>Next of Kin Name</label>
                  <input name="next_of_kin_name" placeholder="Next of Kin Name" value={formData.next_of_kin_name} onChange={e => setFormData({...formData, next_of_kin_name: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ced4da', marginTop: '4px' }} />
                </div>
                <div>
                  <label style={{ fontWeight: 'bold', fontSize: '14px' }}>Relationship</label>
                  <input name="next_of_kin_relationship" placeholder="Relationship" value={formData.next_of_kin_relationship} onChange={e => setFormData({...formData, next_of_kin_relationship: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ced4da', marginTop: '4px' }} />
                </div>
                <div>
                  <label style={{ fontWeight: 'bold', fontSize: '14px' }}>Next of Kin Phone</label>
                  <input name="next_of_kin_phone" placeholder="Next of Kin Phone" value={formData.next_of_kin_phone} onChange={e => setFormData({...formData, next_of_kin_phone: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ced4da', marginTop: '4px' }} />
                </div>
              </div>
            </div>

            {/* --- SECTION 2: LOAN DETERMINANTS --- */}
            <div style={{ background: '#d4edda', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
              <h3 style={{ margin: '0 0 15px 0' }}>📊 Loan Determinants</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ fontWeight: 'bold', fontSize: '14px' }}>Employment Status</label>
                  <select name="employment_status" value={formData.employment_status} onChange={e => setFormData({...formData, employment_status: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ced4da', marginTop: '4px' }}>
                    <option>Employed</option>
                    <option>Self-Employed</option>
                    <option>Unemployed</option>
                    <option>Retired</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontWeight: 'bold', fontSize: '14px' }}>Monthly Income (UGX)</label>
                  <input name="monthly_income" type="number" placeholder="Monthly Income (UGX)" value={formData.monthly_income} onChange={e => setFormData({...formData, monthly_income: parseFloat(e.target.value)})} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ced4da', marginTop: '4px' }} />
                </div>
                <div>
                  <label style={{ fontWeight: 'bold', fontSize: '14px' }}>Existing Debts (UGX/month)</label>
                  <input name="existing_debts" type="number" placeholder="Existing Debts (UGX/month)" value={formData.existing_debts} onChange={e => setFormData({...formData, existing_debts: parseFloat(e.target.value)})} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ced4da', marginTop: '4px' }} />
                </div>
                <div>
                  <label style={{ fontWeight: 'bold', fontSize: '14px' }}>Credit Score</label>
                  <input name="credit_score" type="number" placeholder="Credit Score" value={formData.credit_score} onChange={e => setFormData({...formData, credit_score: parseInt(e.target.value)})} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ced4da', marginTop: '4px' }} />
                </div>
                <div>
                  <label style={{ fontWeight: 'bold', fontSize: '14px' }}>Collateral Type</label>
                  <input name="collateral_type" placeholder="Collateral Type" value={formData.collateral_type} onChange={e => setFormData({...formData, collateral_type: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ced4da', marginTop: '4px' }} />
                </div>
                <div>
                  <label style={{ fontWeight: 'bold', fontSize: '14px' }}>Collateral Value (UGX)</label>
                  <input name="collateral_value" type="number" placeholder="Collateral Value (UGX)" value={formData.collateral_value} onChange={e => setFormData({...formData, collateral_value: parseFloat(e.target.value)})} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ced4da', marginTop: '4px' }} />
                </div>
              </div>
            </div>

            {/* --- SECTION 3: LOAN TERMS --- */}
            <div style={{ background: '#fff3cd', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
              <h3 style={{ margin: '0 0 15px 0' }}>💰 Loan Terms</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ fontWeight: 'bold', fontSize: '14px' }}>Principal (UGX) *</label>
                  <input name="principal" type="number" placeholder="Principal (UGX)" value={formData.principal} onChange={e => setFormData({...formData, principal: parseFloat(e.target.value)})} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ced4da', marginTop: '4px' }} required />
                </div>
                <div>
                  <label style={{ fontWeight: 'bold', fontSize: '14px' }}>Annual Rate (%) *</label>
                  <input name="annual_interest_rate" type="number" step="0.01" placeholder="Annual Rate (%)" value={formData.annual_interest_rate} onChange={e => setFormData({...formData, annual_interest_rate: parseFloat(e.target.value)})} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ced4da', marginTop: '4px' }} required />
                </div>
                <div>
                  <label style={{ fontWeight: 'bold', fontSize: '14px' }}>Tenure (Months) *</label>
                  <input name="tenure_months" type="number" placeholder="Tenure (Months)" value={formData.tenure_months} onChange={e => setFormData({...formData, tenure_months: parseInt(e.target.value)})} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ced4da', marginTop: '4px' }} required />
                </div>
              </div>
            </div>

            {/* --- SECTION 4: GUARANTORS --- */}
            <div style={{ background: '#cfe2ff', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
              <h3 style={{ display: 'flex', justifyContent: 'space-between', margin: '0 0 15px 0' }}>
                👥 Guarantors
                <button type="button" onClick={() => setGuarantors([...guarantors, { id: Date.now(), name: '', email: '', phone: '', relationship: '', employment_status: '', monthly_income: 0 }])} style={{ padding: '5px 15px', background: '#0d6efd', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  + Add Guarantor
                </button>
              </h3>
              {guarantors.map((g) => (
                <div key={g.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: '10px', marginTop: '10px', background: 'white', padding: '10px', borderRadius: '4px', alignItems: 'center' }}>
                  <input placeholder="Full Name" value={g.name} onChange={(e) => setGuarantors(guarantors.map(g2 => g2.id === g.id ? { ...g2, name: e.target.value } : g2))} style={{ padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }} required />
                  <input placeholder="Email" value={g.email} onChange={(e) => setGuarantors(guarantors.map(g2 => g2.id === g.id ? { ...g2, email: e.target.value } : g2))} style={{ padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }} />
                  <input placeholder="Phone" value={g.phone} onChange={(e) => setGuarantors(guarantors.map(g2 => g2.id === g.id ? { ...g2, phone: e.target.value } : g2))} style={{ padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }} required />
                  <input placeholder="Relationship" value={g.relationship} onChange={(e) => setGuarantors(guarantors.map(g2 => g2.id === g.id ? { ...g2, relationship: e.target.value } : g2))} style={{ padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }} />
                  <button type="button" onClick={() => setGuarantors(guarantors.filter(g2 => g2.id !== g.id))} style={{ background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', padding: '6px 12px', cursor: 'pointer' }}>✕</button>
                </div>
              ))}
            </div>

            <button type="submit" disabled={loading} style={{ marginTop: '10px', padding: '12px 40px', background: '#0056b3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '18px', width: '100%' }}>
              {loading ? 'Submitting...' : '✅ Submit Full Application'}
            </button>
          </form>
        )}

        {result && (
          <div style={{ marginTop: '30px' }}>
            <h2>📊 Amortization Schedule</h2>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <div style={{ background: '#e3f2fd', padding: '10px', borderRadius: '8px', flex: 1 }}><strong>EMI:</strong> UGX {result.monthly_emi.toLocaleString()}</div>
              <div style={{ background: '#e8f5e9', padding: '10px', borderRadius: '8px', flex: 1 }}><strong>Total Payment:</strong> UGX {result.total_payment.toLocaleString()}</div>
              <div style={{ background: '#fff3e0', padding: '10px', borderRadius: '8px', flex: 1 }}><strong>Total Interest:</strong> UGX {result.total_interest.toLocaleString()}</div>
            </div>
            {savedLoanId && <button onClick={() => downloadPDF(savedLoanId)} style={{ margin: '10px 0', padding: '8px 16px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>📄 Download PDF</button>}
            <div style={{ maxHeight: '400px', overflowY: 'scroll', marginTop: '10px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ position: 'sticky', top: 0, background: '#333', color: 'white' }}>
                  <tr><th>Month</th><th>EMI (UGX)</th><th>Principal (UGX)</th><th>Interest (UGX)</th><th>Balance (UGX)</th></tr>
                </thead>
                <tbody>
                  {result.schedule.map((row: any) => (
                    <tr key={row.month}>
                      <td>{row.month}</td>
                      <td>{row.emi.toLocaleString()}</td>
                      <td>{row.principal_paid.toLocaleString()}</td>
                      <td>{row.interest_paid.toLocaleString()}</td>
                      <td>{row.remaining_balance.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {myLoans.length > 0 && !result && (
          <div style={{ marginTop: '30px' }}>
            <h2>📋 My Loan History</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#333', color: 'white' }}>
                <tr><th>ID</th><th>Customer</th><th>Principal (UGX)</th><th>EMI (UGX)</th><th>Status</th><th>Action</th></tr>
              </thead>
              <tbody>
                {myLoans.map((loan) => (
                  <tr key={loan.id} style={{ borderBottom: '1px solid #ddd' }}>
                    <td>#{loan.id}</td>
                    <td>{loan.customer_name}</td>
                    <td>{loan.principal.toLocaleString()}</td>
                    <td>{loan.monthly_emi.toLocaleString()}</td>
                    <td><span style={{ background: loan.status === 'approved' ? '#d4edda' : loan.status === 'pending' ? '#fff3cd' : '#f8d7da', padding: '3px 8px', borderRadius: '4px' }}>{loan.status}</span></td>
                    <td><button onClick={() => downloadPDF(loan.id)} style={{ padding: '4px 8px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>PDF</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* --- CHANGE PASSWORD MODAL --- */}
        <ChangePasswordModal 
          isOpen={showChangePassword} 
          onClose={() => setShowChangePassword(false)} 
          onSuccess={() => {}} 
        />
      </div>
    );
  }

  // --- ADMIN DASHBOARD ---
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

        {/* --- ORGANIZED BUTTONS --- */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
            <button onClick={fetchAdminData} style={{ padding: '8px 16px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              🔄 Refresh
            </button>
            <button 
              onClick={async () => {
                if (window.confirm('Generate mock data?')) {
                  const res = await fetch(`${API_BASE_URL}/api/v1/admin/generate-mock-data`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                  });
                  if (res.ok) {
                    alert('Mock data generated!');
                    fetchAdminData();
                  }
                }
              }} 
              style={{ padding: '8px 16px', background: '#ffc107', color: 'black', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              🎲 Generate Data
            </button>
          </div>

          <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
            <button onClick={async () => {
              const token = localStorage.getItem('token');
              const res = await fetch(`${API_BASE_URL}/api/v1/reports/recovery`, {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'recovery_report.xlsx';
                a.click();
                window.URL.revokeObjectURL(url);
              }
            }} style={{ padding: '8px 16px', background: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              📊 Recovery Report
            </button>
            <button onClick={async () => {
              const token = localStorage.getItem('token');
              const res = await fetch(`${API_BASE_URL}/api/v1/reports/financials`, {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'financial_statements.xlsx';
                a.click();
                window.URL.revokeObjectURL(url);
              }
            }} style={{ padding: '8px 16px', background: '#6f42c1', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              📈 Financial Statements
            </button>
            <button onClick={async () => {
              const token = localStorage.getItem('token');
              const res = await fetch(`${API_BASE_URL}/api/v1/reports/portfolio`, {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'portfolio_report.xlsx';
                a.click();
                window.URL.revokeObjectURL(url);
              }
            }} style={{ padding: '8px 16px', background: '#fd7e14', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              📋 Portfolio Report
            </button>
          </div>
        </div>

        {dashboardStats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '15px', marginTop: '20px' }}>
            <div style={{ background: '#e3f2fd', padding: '15px', borderRadius: '8px', textAlign: 'center' }}><strong>Total</strong><br />{dashboardStats.total}</div>
            <div style={{ background: '#fff3cd', padding: '15px', borderRadius: '8px', textAlign: 'center' }}><strong>Pending</strong><br />{dashboardStats.pending}</div>
            <div style={{ background: '#d4edda', padding: '15px', borderRadius: '8px', textAlign: 'center' }}><strong>Approved</strong><br />{dashboardStats.approved}</div>
            <div style={{ background: '#f8d7da', padding: '15px', borderRadius: '8px', textAlign: 'center' }}><strong>Rejected</strong><br />{dashboardStats.rejected}</div>
            <div style={{ background: '#cfe2ff', padding: '15px', borderRadius: '8px', textAlign: 'center' }}><strong>Disbursed</strong><br />{dashboardStats.disbursed}</div>
          </div>
        )}

        <div style={{ marginTop: '30px' }}>
          <h2>📋 All Loan Applications</h2>
          <div style={{ overflowX: 'auto', maxHeight: '600px', overflowY: 'scroll' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead style={{ position: 'sticky', top: 0, background: '#333', color: 'white' }}>
                <tr><th>ID</th><th>Customer</th><th>Principal (UGX)</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {adminLoans.map((loan) => (
                  <tr key={loan.id} style={{ borderBottom: '1px solid #ddd' }}>
                    <td>#{loan.id}</td>
                    <td>{loan.customer_name}</td>
                    <td>{loan.principal.toLocaleString()}</td>
                    <td><span style={{ background: loan.status === 'approved' ? '#d4edda' : loan.status === 'pending' ? '#fff3cd' : '#f8d7da', padding: '3px 8px', borderRadius: '4px' }}>{loan.status}</span></td>
                    <td>
                      {loan.status === 'pending' && (
                        <>
                          <button onClick={() => updateLoanStatus(loan.id, 'approved')} style={{ marginRight: '5px', padding: '4px 8px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Approve</button>
                          <button onClick={() => updateLoanStatus(loan.id, 'rejected')} style={{ padding: '4px 8px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Reject</button>
                        </>
                      )}
                      {loan.status === 'approved' && <button onClick={() => updateLoanStatus(loan.id, 'disbursed')} style={{ padding: '4px 8px', background: '#0d6efd', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Disburse</button>}
                      {loan.status !== 'pending' && <span style={{ fontStyle: 'italic' }}>✓ Done</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* --- CHANGE PASSWORD MODAL --- */}
        <ChangePasswordModal 
          isOpen={showChangePassword} 
          onClose={() => setShowChangePassword(false)} 
          onSuccess={() => {}} 
        />
      </div>
    );
  }

  return <div>Loading...</div>;
}

export default App;