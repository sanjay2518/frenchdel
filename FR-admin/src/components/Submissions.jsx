import { useState, useEffect } from 'react';
import { Play, Download, Eye, RefreshCw, CheckCircle, Clock, AlertCircle, Inbox } from 'lucide-react';
import API_URL from '../config';

const Submissions = () => {
  const [submissions, setSubmissions] = useState([]);
  const [filter, setFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/api/submissions`);
      const data = await response.json();

      if (data.error) {
        setError(data.error);
        setSubmissions([]);
      } else {
        setSubmissions(data.submissions || []);
      }
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
      setError('Failed to connect to server. Please ensure the backend is running.');
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredSubmissions = submissions.filter(sub => {
    const matchesStatus = filter === 'all' || sub.status === filter;
    const matchesType = typeFilter === 'all' || sub.type === typeFilter;
    return matchesStatus && matchesType;
  });

  const pendingCount = submissions.filter(s => s.status === 'pending').length;
  const reviewedCount = submissions.filter(s => s.status === 'reviewed').length;

  if (loading) {
    return (
      <div className="submissions-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading submissions from database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="submissions-page">
      <div className="page-header">
        <div className="header-title-section">
          <h2>User Submissions</h2>
          <p className="header-subtitle">
            {submissions.length === 0
              ? 'No submissions in database yet'
              : `${submissions.length} total submissions (${pendingCount} pending, ${reviewedCount} reviewed)`
            }
          </p>
        </div>
        <div className="header-actions">
          <button
            className="btn-secondary"
            onClick={fetchSubmissions}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'spinning' : ''} />
            Refresh
          </button>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="pending">Pending ({pendingCount})</option>
            <option value="reviewed">Reviewed ({reviewedCount})</option>
          </select>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="all">All Types</option>
            <option value="speaking">Speaking</option>
            <option value="writing">Writing</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <div className="submissions-table">
        {filteredSubmissions.length === 0 ? (
          <div className="empty-table-state">
            <Inbox size={64} />
            <h3>
              {submissions.length === 0
                ? 'No Submissions Yet'
                : 'No Matching Submissions'
              }
            </h3>
            <p>
              {submissions.length === 0
                ? 'User submissions will appear here once students complete practice tasks.'
                : 'Try adjusting the filters to see more submissions.'
              }
            </p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Type</th>
                <th>Prompt</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubmissions.map(submission => (
                <tr key={submission.id}>
                  <td>{submission.userName}</td>
                  <td>{submission.userEmail}</td>
                  <td>
                    <span className={`type-badge ${submission.type}`}>
                      {submission.type}
                    </span>
                  </td>
                  <td>{submission.promptTitle}</td>
                  <td>
                    <span className={`status-badge ${submission.status}`}>
                      {submission.status === 'reviewed' ? (
                        <><CheckCircle size={12} /> Reviewed</>
                      ) : (
                        <><Clock size={12} /> Pending</>
                      )}
                    </span>
                  </td>
                  <td>{new Date(submission.submitted_at).toLocaleDateString()}</td>
                  <td>
                    <div className="actions">
                      {/* View button only for writing practice */}
                      {submission.type === 'writing' && (
                        <button
                          className="btn-icon"
                          title="View"
                          onClick={() => {
                            if (submission.submissionText) {
                              alert(submission.submissionText);
                            } else {
                              alert('No text content available');
                            }
                          }}
                        >
                          <Eye size={16} />
                        </button>
                      )}
                      {submission.type === 'speaking' && (
                        <button
                          className="btn-icon"
                          title="Play Audio"
                          onClick={() => {
                            if (submission.audioFile) {
                              const audio = new Audio(`${API_URL}/api/uploads/audio/${submission.audioFile}`);
                              audio.play().catch(e => console.log('Audio play failed:', e));
                            } else {
                              alert('No audio file available');
                            }
                          }}
                        >
                          <Play size={16} />
                        </button>
                      )}
                      {/* Download button only for writing practice */}
                      {submission.type === 'writing' && submission.submissionText && (
                        <button
                          className="btn-icon"
                          title="Download"
                          onClick={() => {
                            const blob = new Blob([submission.submissionText], { type: 'text/plain' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `submission_${submission.id.substring(0, 8)}.txt`;
                            a.click();
                            URL.revokeObjectURL(url);
                          }}
                        >
                          <Download size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Submissions;