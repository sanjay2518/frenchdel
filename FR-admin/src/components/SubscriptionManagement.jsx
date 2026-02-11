import { useState, useEffect } from 'react';
import { CreditCard, X } from 'lucide-react';
import API_URL from '../config';

const SubscriptionManagement = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [stats, setStats] = useState({ active: 0, revenue: 0, cancelled: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const response = await fetch(`${API_URL}/api/subscriptions`);
      const data = await response.json();
      setSubscriptions(data.subscriptions || []);
      setStats(data.stats || { active: 0, revenue: 0, cancelled: 0 });
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const cancelSubscription = async (id) => {
    try {
      await fetch(`${API_URL}/api/subscriptions/${id}/cancel`, {
        method: 'POST'
      });
      await fetchSubscriptions();
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
    }
  };

  const reactivateSubscription = async (id) => {
    try {
      await fetch(`${API_URL}/api/subscriptions/${id}/reactivate`, {
        method: 'POST'
      });
      await fetchSubscriptions();
    } catch (error) {
      console.error('Failed to reactivate subscription:', error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="subscriptions-page">
      <div className="page-header">
        <h2>Manage Subscriptions</h2>
      </div>

      <div className="subscription-stats">
        <div className="stat-card">
          <h3>Active Subscriptions</h3>
          <p className="stat-number">{stats.active}</p>
        </div>
        <div className="stat-card">
          <h3>Monthly Revenue</h3>
          <p className="stat-number">${stats.revenue}</p>
        </div>
        <div className="stat-card">
          <h3>Cancelled This Month</h3>
          <p className="stat-number">{stats.cancelled}</p>
        </div>
      </div>

      <div className="subscriptions-table">
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Plan</th>
              <th>Status</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Amount</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.map(subscription => (
              <tr key={subscription.id}>
                <td>{subscription.user}</td>
                <td>{subscription.email}</td>
                <td>
                  <span className="plan-badge premium">
                    {subscription.plan}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${subscription.status}`}>
                    {subscription.status}
                  </span>
                </td>
                <td>{subscription.startDate}</td>
                <td>{subscription.endDate}</td>
                <td>{subscription.amount}</td>
                <td>
                  <div className="actions">
                    {subscription.status === 'active' ? (
                      <button 
                        className="btn-icon delete"
                        onClick={() => cancelSubscription(subscription.id)}
                        title="Cancel Subscription"
                      >
                        <X size={16} />
                      </button>
                    ) : (
                      <button 
                        className="btn-icon"
                        onClick={() => reactivateSubscription(subscription.id)}
                        title="Reactivate Subscription"
                      >
                        <CreditCard size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SubscriptionManagement;