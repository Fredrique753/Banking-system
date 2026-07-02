// v2 - Force redeploy
/* eslint-disable */
import { useState, useEffect } from 'react';
// @ts-ignore
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
// @ts-ignore
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const API_BASE_URL = 'https://banking-system-qdnx.onrender.com';
const CURRENCY = 'UGX';

// ============================================
// CHANGE PASSWORD MODAL
// ============================================
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
      <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', maxWidth: '420px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <h2 style={{ marginTop: 0, color: '#1a1a2e' }}>🔑 Change Password</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ fontWeight: 600, fontSize: '14px', color: '#333' }}>Current Password</label>
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '4px', fontSize: '14px' }} />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ fontWeight: 600, fontSize: '14px', color: '#333' }}>New Password</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '4px', fontSize: '14px' }} />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ fontWeight: 600, fontSize: '14px', color: '#333' }}>Confirm New Password</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '4px', fontSize: '14px' }} />
          </div>
          {error && <p style={{ color: '#dc3545', fontSize: '14px', marginBottom: '10px' }}>{error}</p>}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 20px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ padding: '10px 20px', background: '#0d6efd', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>{loading ? 'Saving...' : 'Change Password'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================
// LOAN APPLICATION FORM COMPONENT
// ============================================
function LoanApplicationForm({ onSuccess, clients, loanProducts }: { onSuccess: () => void; clients: any[]; loanProducts: any[] }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    client_id: '',
    loan_product_id: '',
    principal: 5000000,
    annual_interest_rate: 12,
    tenure_months: 12,
    business_type: '',
    loan_purpose: '',
    repayment_source: '',
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

  const handleProductChange = (productId: string) => {
    const product = loanProducts.find((p: any) => p.id === parseInt(productId));
    if (product) {
      setFormData({
        ...formData,
        loan_product_id: productId,
        annual_interest_rate: product.default_interest_rate,
        tenure_months: product.default_tenure,
        principal: Math.max(product.min_principal, Math.min(product.max_principal, formData.principal))
      });
    } else {
      setFormData({ ...formData, loan_product_id: productId });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.client_id) { alert('Please select a client'); return; }
    setLoading(true);
    try {
      const payload = {
        client_id: parseInt(formData.client_id),
        loan_product_id: formData.loan_product_id ? parseInt(formData.loan_product_id) : null,
        principal: parseFloat(formData.principal),
        annual_interest_rate: parseFloat(formData.annual_interest_rate),
        tenure_months: parseInt(formData.tenure_months),
        business_type: formData.business_type,
        loan_purpose: formData.loan_purpose,
        repayment_source: formData.repayment_source,
        guarantor_name: formData.guarantor_name,
        guarantor_phone: formData.guarantor_phone,
        guarantor_email: formData.guarantor_email,
        guarantor_relationship: formData.guarantor_relationship,
        employment_status: formData.employment_status,
        monthly_income: parseFloat(formData.monthly_income) || 0,
        existing_debts: parseFloat(formData.existing_debts) || 0,
        credit_score: parseInt(formData.credit_score) || 0,
        collateral_type: formData.collateral_type,
        collateral_value: parseFloat(formData.collateral_value) || 0,
      };

      const res = await fetch(`${API_BASE_URL}/api/v1/admin/loans/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        alert(`✅ Loan application submitted! Loan ID: ${data.loan_id}\nMonthly EMI: ${CURRENCY} ${data.monthly_emi.toLocaleString()}`);
        onSuccess();
      } else {
        alert('Failed to submit loan: ' + JSON.stringify(data, null, 2));
      }
    } catch (err) {
      alert('Error submitting loan');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} style={{ background: '#ffffff', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginTop: '20px' }}>
      {/* Select Client */}
      <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#1a1a2e' }}>👤 Select Client</h3>
        <select value={formData.client_id} onChange={(e) => setFormData({...formData, client_id: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px' }} required>
          <option value="">Select a client...</option>
          {clients.map((c: any) => (
            <option key={c.id} value={c.id}>{c.first_name} {c.last_name} - {c.id_number}</option>
          ))}
        </select>
      </div>

      {/* Loan Product */}
      {loanProducts.length > 0 && (
        <div style={{ background: '#e9ecef', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#1a1a2e' }}>📦 Loan Product</h3>
          <select value={formData.loan_product_id} onChange={(e) => handleProductChange(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px' }}>
            <option value="">Select a product (optional)</option>
            {loanProducts.map((p: any) => (
              <option key={p.id} value={p.id}>{p.name} - {p.default_interest_rate}% / {p.default_tenure}m</option>
            ))}
          </select>
        </div>
      )}

      {/* Loan Terms */}
      <div style={{ background: '#fff3cd', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#856404' }}>💰 Loan Terms</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
          <div><label style={{ fontWeight: 600, fontSize: '13px' }}>Principal ({CURRENCY}) *</label><input type="number" value={formData.principal} onChange={(e) => setFormData({...formData, principal: parseFloat(e.target.value)})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '4px' }} required /></div>
          <div><label style={{ fontWeight: 600, fontSize: '13px' }}>Annual Rate (%) *</label><input type="number" step="0.01" value={formData.annual_interest_rate} onChange={(e) => setFormData({...formData, annual_interest_rate: parseFloat(e.target.value)})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '4px' }} required /></div>
          <div><label style={{ fontWeight: 600, fontSize: '13px' }}>Tenure (Months) *</label><input type="number" value={formData.tenure_months} onChange={(e) => setFormData({...formData, tenure_months: parseInt(e.target.value)})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '4px' }} required /></div>
        </div>
      </div>

      {/* New Fields */}
      <div style={{ background: '#e3f2fd', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#0d47a1' }}>📋 Loan Details</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
          <div><label style={{ fontWeight: 600, fontSize: '13px' }}>Business Type</label><input value={formData.business_type} onChange={(e) => setFormData({...formData, business_type: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '4px' }} /></div>
          <div><label style={{ fontWeight: 600, fontSize: '13px' }}>Loan Purpose</label><input value={formData.loan_purpose} onChange={(e) => setFormData({...formData, loan_purpose: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '4px' }} /></div>
          <div><label style={{ fontWeight: 600, fontSize: '13px' }}>Repayment Source</label><input value={formData.repayment_source} onChange={(e) => setFormData({...formData, repayment_source: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '4px' }} /></div>
        </div>
      </div>

      {/* Guarantor */}
      <div style={{ background: '#cfe2ff', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#084298' }}>👥 Guarantor</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div><label style={{ fontWeight: 600, fontSize: '13px' }}>Full Name</label><input value={formData.guarantor_name} onChange={(e) => setFormData({...formData, guarantor_name: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '4px' }} /></div>
          <div><label style={{ fontWeight: 600, fontSize: '13px' }}>Phone</label><input value={formData.guarantor_phone} onChange={(e) => setFormData({...formData, guarantor_phone: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '4px' }} /></div>
          <div><label style={{ fontWeight: 600, fontSize: '13px' }}>Email</label><input value={formData.guarantor_email} onChange={(e) => setFormData({...formData, guarantor_email: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '4px' }} /></div>
          <div><label style={{ fontWeight: 600, fontSize: '13px' }}>Relationship</label><input value={formData.guarantor_relationship} onChange={(e) => setFormData({...formData, guarantor_relationship: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '4px' }} /></div>
        </div>
      </div>

      {/* Financials */}
      <div style={{ background: '#d4edda', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#0f5132' }}>📊 Financial & Employment</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
          <div><label style={{ fontWeight: 600, fontSize: '13px' }}>Employment Status</label><select value={formData.employment_status} onChange={(e) => setFormData({...formData, employment_status: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '4px' }}><option>Employed</option><option>Self-Employed</option><option>Unemployed</option><option>Retired</option></select></div>
          <div><label style={{ fontWeight: 600, fontSize: '13px' }}>Monthly Income ({CURRENCY})</label><input type="number" value={formData.monthly_income} onChange={(e) => setFormData({...formData, monthly_income: parseFloat(e.target.value)})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '4px' }} /></div>
          <div><label style={{ fontWeight: 600, fontSize: '13px' }}>Existing Debts ({CURRENCY}/month)</label><input type="number" value={formData.existing_debts} onChange={(e) => setFormData({...formData, existing_debts: parseFloat(e.target.value)})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '4px' }} /></div>
          <div><label style={{ fontWeight: 600, fontSize: '13px' }}>Credit Score</label><input type="number" value={formData.credit_score} onChange={(e) => setFormData({...formData, credit_score: parseInt(e.target.value)})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '4px' }} /></div>
          <div><label style={{ fontWeight: 600, fontSize: '13px' }}>Collateral Type</label><input value={formData.collateral_type} onChange={(e) => setFormData({...formData, collateral_type: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '4px' }} /></div>
          <div><label style={{ fontWeight: 600, fontSize: '13px' }}>Collateral Value ({CURRENCY})</label><input type="number" value={formData.collateral_value} onChange={(e) => setFormData({...formData, collateral_value: parseFloat(e.target.value)})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '4px' }} /></div>
        </div>
      </div>

      <button type="submit" disabled={loading} style={{ padding: '12px 40px', background: '#0d6efd', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', width: '100%', fontWeight: 600 }}>
        {loading ? 'Submitting...' : '✅ Submit Loan Application'}
      </button>
    </form>
  );
}

// ============================================
// LOAN PRODUCT FORM COMPONENT (NEW)
// ============================================
function LoanProductForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    min_principal: 1000000,
    max_principal: 50000000,
    default_interest_rate: 12,
    default_tenure: 12,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/admin/loan-products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        alert('✅ Loan product created successfully!');
        onSuccess();
      } else {
        alert('Failed to create loan product: ' + (data.detail || 'Unknown error'));
      }
    } catch (err) {
      alert('Error creating loan product');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '20px' }}>
      <h3 style={{ marginTop: 0 }}>📦 New Loan Product</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
        <div>
          <label style={{ fontWeight: 600, fontSize: '13px' }}>Product Name *</label>
          <input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '4px' }} required />
        </div>
        <div>
          <label style={{ fontWeight: 600, fontSize: '13px' }}>Description</label>
          <input value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '4px' }} />
        </div>
        <div>
          <label style={{ fontWeight: 600, fontSize: '13px' }}>Min Principal ({CURRENCY}) *</label>
          <input type="number" value={formData.min_principal} onChange={(e) => setFormData({...formData, min_principal: parseFloat(e.target.value)})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '4px' }} required />
        </div>
        <div>
          <label style={{ fontWeight: 600, fontSize: '13px' }}>Max Principal ({CURRENCY}) *</label>
          <input type="number" value={formData.max_principal} onChange={(e) => setFormData({...formData, max_principal: parseFloat(e.target.value)})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '4px' }} required />
        </div>
        <div>
          <label style={{ fontWeight: 600, fontSize: '13px' }}>Default Rate (%) *</label>
          <input type="number" step="0.01" value={formData.default_interest_rate} onChange={(e) => setFormData({...formData, default_interest_rate: parseFloat(e.target.value)})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '4px' }} required />
        </div>
        <div>
          <label style={{ fontWeight: 600, fontSize: '13px' }}>Default Tenure (Months) *</label>
          <input type="number" value={formData.default_tenure} onChange={(e) => setFormData({...formData, default_tenure: parseInt(e.target.value)})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '4px' }} required />
        </div>
      </div>
      <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
        <button type="submit" disabled={loading} style={{ padding: '10px 24px', background: '#0d6efd', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>{loading ? 'Creating...' : '✅ Create Product'}</button>
        <button type="button" onClick={onCancel} style={{ padding: '10px 24px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
      </div>
    </form>
  );
}

// ============================================
// CHART COMPONENT
// ============================================
function LoanChart({ stats }: { stats: any }) {
  if (!stats) return null;
  
  const data = {
    labels: ['Pending', 'Approved', 'Rejected', 'Disbursed'],
    datasets: [{
      label: 'Loans by Status',
      data: [stats.pending || 0, stats.approved || 0, stats.rejected || 0, stats.disbursed || 0],
      backgroundColor: ['#ffc107', '#28a745', '#dc3545', '#0d6efd'],
      borderRadius: 8,
    }]
  };
  
  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: '📊 Loan Portfolio Overview' }
    }
  };
  
  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <Bar options={options} data={data} height={200} />
    </div>
  );
}

// ============================================
// MAIN APP
// ============================================
function App() {
  const [view, setView] = useState<'login' | 'admin'>('login');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [loanProducts, setLoanProducts] = useState<any[]>([]);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [showLoanForm, setShowLoanForm] = useState(false);
  const [showClientForm, setShowClientForm] = useState(false);
  const [showLoanProductForm, setShowLoanProductForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'clients' | 'loans' | 'reports' | 'products'>('dashboard');
  const [brandColor] = useState('#1a1a2e');

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
        fetchLoanProducts();
      } else {
        localStorage.removeItem('token');
        setView('login');
      }
    } catch {
      setView('login');
    }
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
    } catch (err) {
      console.error(err);
    }
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
    } catch (err) {
      console.error(err);
    }
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
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLoanProducts = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/admin/loan-products`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLoanProducts(data);
      }
    } catch (err) {
      console.error(err);
    }
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
      } else {
        alert('Failed to update');
      }
    } catch (err) {
      alert('Error');
    }
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
    } catch (err) {
      alert('Error creating client');
    }
    setLoading(false);
  };

  const downloadReport = async (endpoint: string, filename: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/v1/reports/${endpoint}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        alert('Failed to download report');
      }
    } catch (err) {
      alert('Error downloading report');
    }
  };

  // --- LOGIN SCREEN ---
  if (view === 'login') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: `linear-gradient(135deg, ${brandColor} 0%, #16213e 100%)`, padding: '20px' }}>
        <div style={{ maxWidth: '420px', width: '100%', background: 'white', padding: '40px', borderRadius: '16px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h1 style={{ fontSize: '28px', color: '#1a1a2e', margin: 0 }}>🏦 Loan Management</h1>
            <p style={{ color: '#6c757d', margin: '8px 0 0 0' }}>Sign in to access the admin panel</p>
          </div>
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontWeight: 600, fontSize: '14px', color: '#333' }}>Username</label>
              <input type="text" placeholder="Enter your username" value={loginForm.username} onChange={e => setLoginForm({...loginForm, username: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '4px', fontSize: '14px' }} required />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontWeight: 600, fontSize: '14px', color: '#333' }}>Password</label>
              <input type="password" placeholder="Enter your password" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '4px', fontSize: '14px' }} required />
            </div>
            <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', background: brandColor, color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 600, cursor: 'pointer' }}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <p style={{ textAlign: 'center', fontSize: '13px', color: '#6c757d', marginTop: '15px' }}>Default: admin / admin123</p>
        </div>
      </div>
    );
  }

  // --- ADMIN DASHBOARD ---
  if (view === 'admin') {
    return (
      <div style={{ minHeight: '100vh', background: '#f0f2f5' }}>
        {/* TOP NAVBAR */}
        <div style={{ background: brandColor, padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>🏦</span>
            <span style={{ color: 'white', fontSize: '18px', fontWeight: 700 }}>Loan Management System</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: '#aaa', fontSize: '14px' }}>👋 {user?.full_name || user?.username}</span>
            <button onClick={() => setShowChangePassword(true)} style={{ padding: '6px 14px', background: 'transparent', color: '#aaa', border: '1px solid #444', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>🔑 Change Password</button>
            <button onClick={handleLogout} style={{ padding: '6px 14px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>🚪 Logout</button>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
          {/* ACTION BUTTONS */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '24px' }}>
            <button onClick={() => { setShowClientForm(!showClientForm); setShowLoanForm(false); setShowLoanProductForm(false); }} style={{ padding: '10px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}>➕ New Client</button>
            <button onClick={() => { setShowLoanForm(!showLoanForm); setShowClientForm(false); setShowLoanProductForm(false); }} style={{ padding: '10px 20px', background: '#0d6efd', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}>📝 New Loan</button>
            <button onClick={() => { setShowLoanProductForm(!showLoanProductForm); setShowClientForm(false); setShowLoanForm(false); }} style={{ padding: '10px 20px', background: '#fd7e14', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}>📦 New Product</button>
            
            <button onClick={() => { setActiveTab('dashboard'); fetchAdminData(); }} style={{ padding: '10px 20px', background: activeTab === 'dashboard' ? brandColor : '#6c757d', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}>📊 Dashboard</button>
            <button onClick={() => { setActiveTab('clients'); fetchClients(); }} style={{ padding: '10px 20px', background: activeTab === 'clients' ? brandColor : '#6c757d', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}>👥 Clients</button>
            <button onClick={() => { setActiveTab('loans'); fetchLoans(); }} style={{ padding: '10px 20px', background: activeTab === 'loans' ? brandColor : '#6c757d', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}>📋 Loans</button>
            <button onClick={() => { setActiveTab('products'); fetchLoanProducts(); }} style={{ padding: '10px 20px', background: activeTab === 'products' ? brandColor : '#6c757d', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}>📦 Products</button>
            <button onClick={() => { setActiveTab('reports'); }} style={{ padding: '10px 20px', background: activeTab === 'reports' ? brandColor : '#6c757d', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}>📈 Reports</button>
          </div>

          {/* CLIENT FORM */}
          {showClientForm && (
            <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '20px' }}>
              <h2 style={{ marginTop: 0, fontSize: '18px', color: '#1a1a2e' }}>➕ New Client</h2>
              <form onSubmit={handleCreateClient}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                  <div><label style={{ fontWeight: 600, fontSize: '13px' }}>First Name *</label><input value={clientForm.first_name} onChange={(e) => setClientForm({...clientForm, first_name: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '4px' }} required /></div>
                  <div><label style={{ fontWeight: 600, fontSize: '13px' }}>Last Name *</label><input value={clientForm.last_name} onChange={(e) => setClientForm({...clientForm, last_name: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '4px' }} required /></div>
                  <div><label style={{ fontWeight: 600, fontSize: '13px' }}>Email *</label><input type="email" value={clientForm.email} onChange={(e) => setClientForm({...clientForm, email: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '4px' }} required /></div>
                  <div><label style={{ fontWeight: 600, fontSize: '13px' }}>Phone *</label><input value={clientForm.phone} onChange={(e) => setClientForm({...clientForm, phone: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '4px' }} required /></div>
                  <div><label style={{ fontWeight: 600, fontSize: '13px' }}>Address</label><input value={clientForm.address} onChange={(e) => setClientForm({...clientForm, address: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '4px' }} /></div>
                  <div><label style={{ fontWeight: 600, fontSize: '13px' }}>ID Number *</label><input value={clientForm.id_number} onChange={(e) => setClientForm({...clientForm, id_number: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '4px' }} required /></div>
                </div>
                <button type="submit" disabled={loading} style={{ marginTop: '15px', padding: '10px 24px', background: '#28a745', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>{loading ? 'Creating...' : '✅ Create Client'}</button>
              </form>
            </div>
          )}

          {/* LOAN APPLICATION FORM */}
          {showLoanForm && (
            <LoanApplicationForm onSuccess={() => { setShowLoanForm(false); fetchLoans(); fetchAdminData(); }} clients={clients} loanProducts={loanProducts} />
          )}

          {/* LOAN PRODUCT FORM */}
          {showLoanProductForm && (
            <LoanProductForm onSuccess={() => { setShowLoanProductForm(false); fetchLoanProducts(); }} onCancel={() => setShowLoanProductForm(false)} />
          )}

          {/* DASHBOARD TAB */}
          {activeTab === 'dashboard' && dashboardStats && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div style={{ background: 'white', padding: '20px', borderRadius: '12px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: '#1a1a2e' }}>{dashboardStats.total_clients || 0}</div>
                  <div style={{ fontSize: '13px', color: '#6c757d' }}>Total Clients</div>
                </div>
                <div style={{ background: 'white', padding: '20px', borderRadius: '12px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: '#1a1a2e' }}>{dashboardStats.total_loans || 0}</div>
                  <div style={{ fontSize: '13px', color: '#6c757d' }}>Total Loans</div>
                </div>
                <div style={{ background: '#fff3cd', padding: '20px', borderRadius: '12px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: '#856404' }}>{dashboardStats.pending || 0}</div>
                  <div style={{ fontSize: '13px', color: '#856404' }}>Pending</div>
                </div>
                <div style={{ background: '#d4edda', padding: '20px', borderRadius: '12px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: '#0f5132' }}>{dashboardStats.approved || 0}</div>
                  <div style={{ fontSize: '13px', color: '#0f5132' }}>Approved</div>
                </div>
                <div style={{ background: '#f8d7da', padding: '20px', borderRadius: '12px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: '#842029' }}>{dashboardStats.rejected || 0}</div>
                  <div style={{ fontSize: '13px', color: '#842029' }}>Rejected</div>
                </div>
                <div style={{ background: '#cfe2ff', padding: '20px', borderRadius: '12px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: '#084298' }}>{dashboardStats.disbursed || 0}</div>
                  <div style={{ fontSize: '13px', color: '#084298' }}>Disbursed</div>
                </div>
              </div>

              {/* CHART */}
              <div style={{ background: 'white', padding: '20px', borderRadius: '12px', marginTop: '20px' }}>
                <LoanChart stats={dashboardStats} />
              </div>
            </div>
          )}

          {/* CLIENTS TAB */}
          {activeTab === 'clients' && clients.length > 0 && (
            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <h2 style={{ marginTop: 0, fontSize: '18px', color: '#1a1a2e' }}>👥 All Clients</h2>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ background: '#f8f9fa' }}>
                      <th style={{ padding: '10px', textAlign: 'left' }}>ID</th>
                      <th style={{ padding: '10px', textAlign: 'left' }}>Name</th>
                      <th style={{ padding: '10px', textAlign: 'left' }}>Email</th>
                      <th style={{ padding: '10px', textAlign: 'left' }}>Phone</th>
                      <th style={{ padding: '10px', textAlign: 'left' }}>ID Number</th>
                      <th style={{ padding: '10px', textAlign: 'left' }}>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map((c: any) => (
                      <tr key={c.id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '10px' }}>#{c.id}</td>
                        <td style={{ padding: '10px' }}>{c.first_name} {c.last_name}</td>
                        <td style={{ padding: '10px' }}>{c.email}</td>
                        <td style={{ padding: '10px' }}>{c.phone}</td>
                        <td style={{ padding: '10px' }}>{c.id_number}</td>
                        <td style={{ padding: '10px' }}>{new Date(c.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* LOANS TAB */}
          {activeTab === 'loans' && loans.length > 0 && (
            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <h2 style={{ marginTop: 0, fontSize: '18px', color: '#1a1a2e' }}>📋 All Loan Applications</h2>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ background: '#f8f9fa' }}>
                      <th style={{ padding: '10px', textAlign: 'left' }}>ID</th>
                      <th style={{ padding: '10px', textAlign: 'left' }}>Client</th>
                      <th style={{ padding: '10px', textAlign: 'left' }}>Principal ({CURRENCY})</th>
                      <th style={{ padding: '10px', textAlign: 'left' }}>EMI ({CURRENCY})</th>
                      <th style={{ padding: '10px', textAlign: 'left' }}>Status</th>
                      <th style={{ padding: '10px', textAlign: 'left' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loans.map((loan: any) => (
                      <tr key={loan.id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '10px' }}>#{loan.id}</td>
                        <td style={{ padding: '10px' }}>{loan.client_name || 'Unknown'}</td>
                        <td style={{ padding: '10px' }}>{loan.principal ? loan.principal.toLocaleString() : 0}</td>
                        <td style={{ padding: '10px' }}>{loan.monthly_emi ? loan.monthly_emi.toLocaleString() : 0}</td>
                        <td style={{ padding: '10px' }}>
                          <span style={{ 
                            padding: '4px 10px', 
                            borderRadius: '20px', 
                            fontSize: '12px',
                            fontWeight: 600,
                            background: loan.status === 'approved' ? '#d4edda' : 
                                       loan.status === 'pending' ? '#fff3cd' : 
                                       loan.status === 'disbursed' ? '#cfe2ff' : '#f8d7da',
                            color: loan.status === 'approved' ? '#0f5132' : 
                                   loan.status === 'pending' ? '#856404' : 
                                   loan.status === 'disbursed' ? '#084298' : '#842029'
                          }}>
                            {loan.status || 'Unknown'}
                          </span>
                        </td>
                        <td style={{ padding: '10px' }}>
                          {loan.status === 'pending' && (
                            <>
                              <button onClick={() => updateLoanStatus(loan.id, 'approved')} style={{ marginRight: '5px', padding: '4px 12px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Approve</button>
                              <button onClick={() => updateLoanStatus(loan.id, 'rejected')} style={{ padding: '4px 12px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Reject</button>
                            </>
                          )}
                          {loan.status === 'approved' && (
                            <button onClick={() => updateLoanStatus(loan.id, 'disbursed')} style={{ padding: '4px 12px', background: '#0d6efd', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Disburse</button>
                          )}
                          {loan.status !== 'pending' && loan.status !== 'approved' && loan.status !== 'disbursed' && (
                            <span style={{ fontStyle: 'italic', fontSize: '13px', color: '#6c757d' }}>✓ Done</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PRODUCTS TAB */}
          {activeTab === 'products' && (
            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <h2 style={{ marginTop: 0, fontSize: '18px', color: '#1a1a2e' }}>📦 Loan Products</h2>
              {loanProducts.length === 0 ? (
                <p style={{ color: '#6c757d' }}>No loan products yet. Click <strong>"New Product"</strong> to create one.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                    <thead>
                      <tr style={{ background: '#f8f9fa' }}>
                        <th style={{ padding: '10px', textAlign: 'left' }}>ID</th>
                        <th style={{ padding: '10px', textAlign: 'left' }}>Name</th>
                        <th style={{ padding: '10px', textAlign: 'left' }}>Min Principal ({CURRENCY})</th>
                        <th style={{ padding: '10px', textAlign: 'left' }}>Max Principal ({CURRENCY})</th>
                        <th style={{ padding: '10px', textAlign: 'left' }}>Rate (%)</th>
                        <th style={{ padding: '10px', textAlign: 'left' }}>Tenure (Months)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loanProducts.map((p: any) => (
                        <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '10px' }}>#{p.id}</td>
                          <td style={{ padding: '10px' }}>{p.name}</td>
                          <td style={{ padding: '10px' }}>{p.min_principal.toLocaleString()}</td>
                          <td style={{ padding: '10px' }}>{p.max_principal.toLocaleString()}</td>
                          <td style={{ padding: '10px' }}>{p.default_interest_rate}%</td>
                          <td style={{ padding: '10px' }}>{p.default_tenure}m</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* REPORTS TAB */}
          {activeTab === 'reports' && (
            <div>
              <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '20px' }}>
                <h2 style={{ marginTop: 0, fontSize: '18px', color: '#1a1a2e' }}>📈 Financial Reports</h2>
                <p style={{ color: '#6c757d', marginBottom: '20px' }}>Download Excel reports for your portfolio, recovery, and financial statements.</p>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '36px', marginBottom: '10px' }}>📊</div>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#1a1a2e' }}>Recovery Report</h3>
                    <p style={{ fontSize: '13px', color: '#6c757d', marginBottom: '15px' }}>Overdue clients and outstanding balances</p>
                    <button 
                      onClick={() => downloadReport('recovery', 'recovery_report.xlsx')}
                      style={{ padding: '8px 20px', background: '#17a2b8', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                    >
                      📥 Download Excel
                    </button>
                  </div>

                  <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '36px', marginBottom: '10px' }}>📈</div>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#1a1a2e' }}>Financial Statements</h3>
                    <p style={{ fontSize: '13px', color: '#6c757d', marginBottom: '15px' }}>Profit & Loss, Balance Sheet</p>
                    <button 
                      onClick={() => downloadReport('financials', 'financial_statements.xlsx')}
                      style={{ padding: '8px 20px', background: '#6f42c1', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                    >
                      📥 Download Excel
                    </button>
                  </div>

                  <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '36px', marginBottom: '10px' }}>📋</div>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#1a1a2e' }}>Portfolio Report</h3>
                    <p style={{ fontSize: '13px', color: '#6c757d', marginBottom: '15px' }}>Expected vs actual returns, portfolio yield</p>
                    <button 
                      onClick={() => downloadReport('portfolio', 'portfolio_report.xlsx')}
                      style={{ padding: '8px 20px', background: '#fd7e14', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                    >
                      📥 Download Excel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* EMPTY STATE */}
          {activeTab === 'clients' && clients.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '12px' }}>
              <p style={{ color: '#6c757d' }}>No clients yet. Click <strong>"New Client"</strong> to add one.</p>
            </div>
          )}
          {activeTab === 'loans' && loans.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '12px' }}>
              <p style={{ color: '#6c757d' }}>No loan applications yet. Click <strong>"New Loan"</strong> to create one.</p>
            </div>
          )}
        </div>

        {/* CHANGE PASSWORD MODAL */}
        <ChangePasswordModal isOpen={showChangePassword} onClose={() => setShowChangePassword(false)} onSuccess={() => {}} />
      </div>
    );
  }

  return <div>Loading...</div>;
}

export default App;