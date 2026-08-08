import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);

  // Core Data State
  const [employees, setEmployees] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [auditMessage, setAuditMessage] = useState('');

  // Add Employee Form State
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpRole, setNewEmpRole] = useState('');

  // Interactive Edit Modal State
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [modalStatus, setModalStatus] = useState('');
  const [modalNotes, setModalNotes] = useState('');

  // DAY 7: Edge Case Notification State (MUST BE INSIDE Dashboard = () => {})
  const [notification, setNotification] = useState({ message: '', type: '' });

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: '', type: '' }), 4000);
  };

  // 1. Fetch Employees & Alerts on Load
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [empRes, alertRes] = await Promise.all([
        axios.get('http://127.0.0.1:5000/api/employees'),
        axios.get('http://127.0.0.1:5000/api/alerts')
      ]);
      setEmployees(empRes.data);
      setAlerts(alertRes.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // 2. Add New Employee
 const handleAddEmployee = async (e) => {
  e.preventDefault();
  if (!newEmpName.trim() || !newEmpRole.trim()) {
    showNotification('Employee name and role cannot be empty.', 'error');
    return;
  }

  try {
    const res = await axios.post('http://127.0.0.1:5000/api/employees', {
      name: newEmpName,
      role: newEmpRole
    });
    setEmployees([...employees, res.data]);
    setNewEmpName('');
    setNewEmpRole('');
    showNotification(`Successfully added ${res.data.name}!`, 'success');
  } catch (err) {
    showNotification('Failed to add employee. Please try again.', 'error');
  }
};

  // 3. Trigger Reconciliation Engine
  const handleRunAudit = async () => {
    try {
      setAuditMessage('Running automated carrier sync audit...');
      const res = await axios.post('http://127.0.0.1:5000/api/reconcile');
      setAuditMessage(res.data.message);
      fetchDashboardData();
    } catch (err) {
      setAuditMessage('Audit failed. Ensure you have active employees first.');
    }
  };

  // 4. DAY 6: Open Investigation Modal
  const openAlertModal = (alert) => {
    setSelectedAlert(alert);
    setModalStatus(alert.status);
    setModalNotes(alert.notes || '');
  };

  // 5. DAY 6: Close Modal
  const closeModal = () => {
    setSelectedAlert(null);
    setModalStatus('');
    setModalNotes('');
  };

  // 6. DAY 6: Save Updated Alert Status & Notes (PATCH)
  const handleUpdateAlert = async (e) => {
    e.preventDefault();
    if (!selectedAlert) return;

    try {
      const res = await axios.patch(`http://127.0.0.1:5000/api/alerts/${selectedAlert.id}`, {
        status: modalStatus,
        notes: modalNotes
      });

      // Update local state immediately without full page reload
      setAlerts(alerts.map(a => a.id === selectedAlert.id ? res.data.alert : a));
      closeModal();
    } catch (err) {
      console.error('Failed to update alert:', err);
    }
  };

  // 7. DAY 6: Dismiss / Delete Alert (DELETE)
  const handleDeleteAlert = async (alertId) => {
    try {
      await axios.delete(`http://127.0.0.1:5000/api/alerts/${alertId}`);
      // Remove alert from state
      setAlerts(alerts.filter(a => a.id !== alertId));
      closeModal();
    } catch (err) {
      console.error('Failed to dismiss alert:', err);
    }
  };

  return (
    <div style={{ padding: '30px', fontFamily: 'system-ui, -apple-system, sans-serif', backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      
      {/* HEADER NAVBAR */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', padding: '15px 25px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '25px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', color: '#1a252c' }}>🛡️ BenAlert Enterprise</h1>
          <span style={{ fontSize: '13px', color: '#6c757d' }}>Multi-Tenant HR Compliance Portal</span>
        </div>
        <div>
          <span style={{ marginRight: '15px', fontSize: '14px' }}>Manager: <strong>{user?.email}</strong></span>
          <button onClick={logout} style={{ padding: '8px 16px', backgroundColor: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            Logout
          </button>
        </div>
      </header>

      {/* DAY 7: EDGE CASE NOTIFICATION BANNER */}
{notification.message && (
  <div style={{
    padding: '12px 20px',
    marginBottom: '20px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 'bold',
    backgroundColor: notification.type === 'error' ? '#f8d7da' : '#d4edda',
    color: notification.type === 'error' ? '#721c24' : '#155724',
    border: notification.type === 'error' ? '1px solid #f5c6cb' : '1px solid #c3e6cb',
    transition: 'all 0.3s ease'
  }}>
    {notification.type === 'error' ? '⚠️ ' : '✅ '}
    {notification.message}
  </div>
)}

      {/* METRIC WARNING BANNERS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '25px' }}>
        <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '8px', borderLeft: '5px solid #007bff', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h4 style={{ margin: '0 0 5px 0', color: '#6c757d', fontSize: '12px', textTransform: 'uppercase' }}>Active Workforce</h4>
          <p style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', color: '#007bff' }}>{employees.length} Employees</p>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '8px', borderLeft: '5px solid #dc3545', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h4 style={{ margin: '0 0 5px 0', color: '#6c757d', fontSize: '12px', textTransform: 'uppercase' }}>Open Discrepancies</h4>
          <p style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', color: '#dc3545' }}>
            {alerts.filter(a => a.status !== 'Dismissed' && a.status !== 'Resolved').length} Active Flags
          </p>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '8px', borderLeft: '5px solid #28a745', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <button onClick={handleRunAudit} style={{ padding: '12px', backgroundColor: '#28a745', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}>
            ⚡ Run Carrier Reconciliation Audit
          </button>
          {auditMessage && <p style={{ margin: '8px 0 0 0', fontSize: '11px', color: '#28a745', textAlign: 'center' }}>{auditMessage}</p>}
        </div>
      </div>

      {/* MAIN WORKSPACE */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
        
        {/* COLUMN 1: EMPLOYEE MANAGEMENT */}
        <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h3>👥 Assigned Workforce</h3>
          
          <form onSubmit={handleAddEmployee} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <input 
              type="text" 
              placeholder="Employee Name" 
              value={newEmpName} 
              onChange={(e) => setNewEmpName(e.target.value)}
              style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              required 
            />
            <input 
              type="text" 
              placeholder="Job Role" 
              value={newEmpRole} 
              onChange={(e) => setNewEmpRole(e.target.value)}
              style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              required 
            />
            <button type="submit" style={{ padding: '8px 15px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              + Add
            </button>
          </form>

          {loading ? (
            <p>Loading workforce...</p>
          ) : employees.length === 0 ? (
            <p style={{ color: '#6c757d', fontStyle: 'italic' }}>No employees found. Add your first worker above!</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f3f5', textAlign: 'left', fontSize: '12px', color: '#495057' }}>
                  <th style={{ padding: '10px' }}>ID</th>
                  <th style={{ padding: '10px' }}>Name</th>
                  <th style={{ padding: '10px' }}>Role</th>
                  <th style={{ padding: '10px' }}>HR Status</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp.id} style={{ borderBottom: '1px solid #eee', fontSize: '14px' }}>
                    <td style={{ padding: '10px' }}>#{emp.id}</td>
                    <td style={{ padding: '10px', fontWeight: '500' }}>{emp.name}</td>
                    <td style={{ padding: '10px', color: '#6c757d' }}>{emp.role}</td>
                    <td style={{ padding: '10px' }}>
                      <span style={{ backgroundColor: '#e6f4ea', color: '#137333', padding: '3px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                        {emp.hr_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* COLUMN 2: ACTIVE AUDIT ALERTS */}
        <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h3>🚨 Active Insurance Discrepancies</h3>

          {loading ? (
            <p>Loading alerts...</p>
          ) : alerts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
              <p style={{ margin: 0, color: '#28a745', fontWeight: 'bold' }}>✅ All Clean!</p>
              <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#6c757d' }}>No carrier sync drops detected across your workforce.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {alerts.map((alert) => (
                <div 
                  key={alert.id} 
                  onClick={() => openAlertModal(alert)}
                  style={{ 
                    border: alert.status === 'Resolved' ? '1px solid #c3e6cb' : '1px solid #f5c6cb', 
                    backgroundColor: alert.status === 'Resolved' ? '#d4edda' : '#f8d7da', 
                    padding: '12px', 
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'transform 0.1s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ color: alert.status === 'Resolved' ? '#155724' : '#721c24' }}>
                      {alert.employee_name}
                    </strong>
                    <span style={{ 
                      backgroundColor: alert.status === 'Resolved' ? '#28a745' : alert.status === 'Investigating' ? '#ffc107' : '#dc3545', 
                      color: alert.status === 'Investigating' ? '#000' : '#fff', 
                      padding: '2px 8px', 
                      borderRadius: '4px', 
                      fontSize: '10px', 
                      fontWeight: 'bold',
                      textTransform: 'uppercase' 
                    }}>
                      {alert.status}
                    </span>
                  </div>
                  <p style={{ margin: '5px 0', fontSize: '13px', color: '#495057' }}>
                    <strong>Carrier:</strong> {alert.carrier_name} — <em>{alert.carrier_status}</em>
                  </p>
                  <p style={{ margin: 0, fontSize: '12px', color: '#6c757d', fontStyle: 'italic' }}>
                    "{alert.notes}"
                  </p>
                  <div style={{ marginTop: '8px', fontSize: '11px', color: '#007bff', textAlign: 'right', fontWeight: 'bold' }}>
                    Click to investigate or resolve ⚙️
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* DAY 6: INTERACTIVE INVESTIGATION MODAL POPUP */}
      {selectedAlert && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{ backgroundColor: '#ffffff', width: '450px', padding: '25px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
            <h3 style={{ marginTop: 0, color: '#1a252c' }}>🛠️ Investigate Audit Discrepancy</h3>
            <p style={{ fontSize: '14px', color: '#495057', marginBottom: '15px' }}>
              Employee: <strong>{selectedAlert.employee_name}</strong><br />
              Issue: <span style={{ color: '#dc3545' }}>{selectedAlert.carrier_status}</span>
            </p>

            <form onSubmit={handleUpdateAlert}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>Update Status</label>
                <select 
                  value={modalStatus} 
                  onChange={(e) => setModalStatus(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                  <option value="Open">Open (Action Required)</option>
                  <option value="Investigating">Investigating (Contacted Carrier)</option>
                  <option value="Resolved">Resolved (Coverage Re-instated)</option>
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>Investigation Notes</label>
                <textarea 
                  rows="3"
                  value={modalNotes} 
                  onChange={(e) => setModalNotes(e.target.value)}
                  placeholder="Record carrier rep name, ticket ID, or resolution action..."
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button 
                  type="button" 
                  onClick={() => handleDeleteAlert(selectedAlert.id)}
                  style={{ padding: '8px 12px', backgroundColor: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                >
                  Dismiss / Delete Alert
                </button>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    type="button" 
                    onClick={closeModal}
                    style={{ padding: '8px 12px', backgroundColor: '#6c757d', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    style={{ padding: '8px 15px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;