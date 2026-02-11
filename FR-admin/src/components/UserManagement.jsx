import { useState, useEffect } from 'react';
import { UserX, UserCheck, Mail, Users, UserPlus, Clock } from 'lucide-react';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, recent: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/users');
      const data = await response.json();
      setUsers(data.users || []);
      setStats(data.stats || { total: 0, active: 0, recent: 0 });
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (id) => {
    try {
      await fetch(`http://localhost:5000/api/users/${id}/toggle-status`, {
        method: 'POST'
      });
      // Update local state for immediate feedback
      setUsers(users.map(user => 
        user.id === id 
          ? { ...user, status: user.status === 'active' ? 'inactive' : 'active' }
          : user
      ));
    } catch (error) {
      console.error('Failed to toggle user status:', error);
    }
  };

  const sendEmail = async (email) => {
    try {
      await fetch('http://localhost:5000/api/notifications/send-admin-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, message: 'Admin notification' })
      });
      alert(`Email sent to ${email}`);
    } catch (error) {
      console.error('Failed to send email:', error);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <div className="users-page">
      <div className="page-header">
        <h2>Manage Users</h2>
      </div>

      {/* User Statistics */}
      <div className="subscription-stats">
        <div className="stat-card">
          <h3>Total Users</h3>
          <div className="stat-number">{stats.total}</div>
          <Users className="stat-icon" size={24} />
        </div>
        <div className="stat-card">
          <h3>Active Users</h3>
          <div className="stat-number">{stats.active}</div>
          <UserCheck className="stat-icon" size={24} />
        </div>
        <div className="stat-card">
          <h3>Recent Signups</h3>
          <div className="stat-number">{stats.recent}</div>
          <UserPlus className="stat-icon" size={24} />
        </div>
      </div>

      <div className="users-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Username</th>
              <th>Email</th>
              <th>Status</th>
              <th>Subscription</th>
              <th>Join Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="7" className="no-data">
                  No users found. Users will appear here when they register.
                </td>
              </tr>
            ) : (
              users.map(user => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>@{user.username}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`status-badge ${user.status}`}>
                      {user.status}
                    </span>
                  </td>
                  <td>
                    <span className={`subscription-badge ${user.subscription}`}>
                      {user.subscription}
                    </span>
                  </td>
                  <td>
                    <div className="date-cell">
                      <Clock size={14} />
                      {user.joinDate}
                    </div>
                  </td>
                  <td>
                    <div className="actions">
                      <button 
                        className="btn-icon"
                        onClick={() => toggleUserStatus(user.id)}
                        title={user.status === 'active' ? 'Deactivate' : 'Activate'}
                      >
                        {user.status === 'active' ? <UserX size={16} /> : <UserCheck size={16} />}
                      </button>
                      <button 
                        className="btn-icon"
                        onClick={() => sendEmail(user.email)}
                        title="Send Email"
                      >
                        <Mail size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;