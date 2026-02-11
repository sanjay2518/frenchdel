import { useState, useEffect } from 'react';
import { Send, Mic, PenTool, Play, Eye, X, CheckCircle, Clock, RefreshCw, AlertCircle, Trash2 } from 'lucide-react';

const Feedback = () => {
  const [allSubmissions, setAllSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [feedback, setFeedback] = useState({ score: '', comments: '' });
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('pending');
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    setFetchingData(true);
    setError('');
    try {
      // Fetch ALL submissions from database (real-time data only)
      const response = await fetch('http://localhost:5000/api/submissions');
      const data = await response.json();

      if (data.error) {
        setError(data.error);
        setAllSubmissions([]);
      } else {
        // Only use real submissions from database
        setAllSubmissions(data.submissions || []);
      }
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
      setError('Failed to connect to server. Please ensure the backend is running.');
      setAllSubmissions([]);
    } finally {
      setFetchingData(false);
    }
  };

  // Filter submissions based on type and status
  const filteredSubmissions = allSubmissions.filter(sub => {
    const matchesStatus = filterStatus === 'all' || sub.status === filterStatus;
    const matchesType = filterType === 'all' || sub.type === filterType;
    return matchesStatus && matchesType;
  });

  // Get pending count for display
  const pendingCount = allSubmissions.filter(s => s.status === 'pending').length;
  const reviewedCount = allSubmissions.filter(s => s.status === 'reviewed').length;

  const submitFeedback = async () => {
    if (!selectedSubmission || !feedback.score || !feedback.comments) {
      alert('Please provide both score and comments');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/submissions/${selectedSubmission.id}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score: feedback.score,
          comments: feedback.comments,
          type: selectedSubmission.type
        })
      });

      if (response.ok) {
        setSuccessMessage(`Feedback sent successfully for ${selectedSubmission.type} practice!`);
        setTimeout(() => setSuccessMessage(''), 3000);
        // Refresh the real-time data from database
        await fetchSubmissions();
        setSelectedSubmission(null);
        setFeedback({ score: '', comments: '' });
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to submit feedback');
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      alert('Failed to submit feedback. Please check the server connection.');
    } finally {
      setLoading(false);
    }
  };

  const deleteSubmission = async (submissionId) => {
    setDeleting(true);
    try {
      const response = await fetch(`http://localhost:5000/api/submissions/${submissionId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setSuccessMessage('Submission deleted successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
        await fetchSubmissions();
        if (selectedSubmission?.id === submissionId) {
          setSelectedSubmission(null);
          setFeedback({ score: '', comments: '' });
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete submission');
      }
    } catch (error) {
      console.error('Failed to delete submission:', error);
      setError('Failed to delete submission. Please check the server connection.');
    } finally {
      setDeleting(false);
      setDeleteConfirm(null);
    }
  };

  const playAudio = (audioFile) => {
    if (audioFile) {
      const audio = new Audio(`http://localhost:5000/api/uploads/audio/${audioFile}`);
      audio.play().catch(e => console.log('Audio play failed:', e));
    } else {
      alert('No audio file available');
    }
  };

  const getFeedbackPlaceholder = (type) => {
    if (type === 'speaking') {
      return 'Provide detailed feedback on pronunciation, fluency, grammar usage, vocabulary choice, and overall communication effectiveness...';
    }
    return 'Provide detailed feedback on grammar, spelling, sentence structure, vocabulary usage, coherence, and writing style...';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="feedback-page">
      <div className="page-header">
        <div className="header-title-section">
          <h2>Add Written Feedback</h2>
          <p className="header-subtitle">Review and provide feedback on real user submissions</p>
        </div>
        <div className="header-actions">
          <button
            className="btn-secondary"
            onClick={fetchSubmissions}
            disabled={fetchingData}
          >
            <RefreshCw size={16} className={fetchingData ? 'spinning' : ''} />
            Refresh
          </button>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="pending">Pending ({pendingCount})</option>
            <option value="reviewed">Reviewed ({reviewedCount})</option>
            <option value="all">All Submissions</option>
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Types</option>
            <option value="speaking">Speaking Only</option>
            <option value="writing">Writing Only</option>
          </select>
        </div>
      </div>

      {successMessage && (
        <div className="success-message">
          <CheckCircle size={18} />
          {successMessage}
        </div>
      )}

      {error && (
        <div className="error-message">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <div className="feedback-layout">
        <div className="pending-submissions">
          <h3>
            {filterStatus === 'pending' ? 'Pending' : filterStatus === 'reviewed' ? 'Reviewed' : 'All'} Submissions
            <span className="count-badge">({filteredSubmissions.length})</span>
          </h3>

          {fetchingData ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading submissions from database...</p>
            </div>
          ) : (
            <div className="submissions-list">
              {filteredSubmissions.length === 0 ? (
                <div className="no-submissions">
                  <Clock size={48} />
                  <p>
                    {allSubmissions.length === 0
                      ? 'No submissions in database yet. Users need to submit practice tasks first.'
                      : `No ${filterStatus === 'all' ? '' : filterStatus} submissions found.`
                    }
                  </p>
                </div>
              ) : (
                filteredSubmissions.map(submission => (
                  <div
                    key={submission.id}
                    className={`submission-card ${selectedSubmission?.id === submission.id ? 'selected' : ''} ${submission.status}`}
                    onClick={() => {
                      setSelectedSubmission(submission);
                      if (submission.status === 'reviewed') {
                        setFeedback({
                          score: submission.score?.toString() || '',
                          comments: submission.feedback || ''
                        });
                      } else {
                        setFeedback({ score: '', comments: '' });
                      }
                    }}
                  >
                    <div className="submission-card-header">
                      <div className={`type-icon ${submission.type}`}>
                        {submission.type === 'speaking' ? <Mic size={18} /> : <PenTool size={18} />}
                      </div>
                      <h4>{submission.promptTitle}</h4>
                      {submission.status === 'reviewed' && (
                        <span className="reviewed-badge">
                          <CheckCircle size={14} /> Reviewed
                        </span>
                      )}
                    </div>
                    <p className="submission-user">{submission.userName}</p>
                    <p className="submission-email">{submission.userEmail}</p>
                    <div className="submission-meta">
                      <span className={`type-badge ${submission.type}`}>
                        {submission.type}
                      </span>
                      <span className="submission-date">
                        {formatDate(submission.submitted_at)}
                      </span>
                    </div>
                    {submission.status === 'reviewed' && submission.score && (
                      <div className="score-preview">
                        Score: <strong>{submission.score}/100</strong>
                      </div>
                    )}
                    <button
                      className="btn-delete-small"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirm(submission.id);
                      }}
                      title="Delete submission"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="feedback-form">
          {selectedSubmission ? (
            <>
              <div className="selected-submission-header">
                <div className={`type-icon large ${selectedSubmission.type}`}>
                  {selectedSubmission.type === 'speaking' ? <Mic size={24} /> : <PenTool size={24} />}
                </div>
                <div>
                  <h3>{selectedSubmission.promptTitle}</h3>
                  <p className="practice-type">
                    {selectedSubmission.type === 'speaking' ? 'Speaking Practice' : 'Writing Practice'}
                    {selectedSubmission.status === 'reviewed' && (
                      <span className="reviewed-indicator"> (Already Reviewed)</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="student-info">
                <p><strong>Student:</strong> {selectedSubmission.userName}</p>
                <p><strong>Email:</strong> {selectedSubmission.userEmail}</p>
                <p><strong>Submitted:</strong> {formatDate(selectedSubmission.submitted_at)}</p>
                <p><strong>Status:</strong>
                  <span className={`status-text ${selectedSubmission.status}`}>
                    {selectedSubmission.status === 'reviewed' ? ' ✓ Reviewed' : ' ⏳ Pending Review'}
                  </span>
                </p>
              </div>

              {/* Preview submission content */}
              <div className="submission-preview">
                <h4>Submission Content</h4>
                {selectedSubmission.type === 'speaking' ? (
                  <div className="audio-preview">
                    <button
                      className="btn-audio"
                      onClick={() => playAudio(selectedSubmission.audioFile)}
                    >
                      <Play size={18} />
                      Play Audio Recording
                    </button>
                    {!selectedSubmission.audioFile && (
                      <p className="no-content-msg">No audio file uploaded</p>
                    )}
                  </div>
                ) : (
                  <>
                    <button
                      className="btn-preview"
                      onClick={() => setShowPreview(true)}
                    >
                      <Eye size={18} />
                      View Written Submission
                    </button>
                    {!selectedSubmission.submissionText && (
                      <p className="no-content-msg">No text content available</p>
                    )}
                  </>
                )}
              </div>

              <div className="form-group">
                <label>Score (0-100)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={feedback.score}
                  onChange={(e) => setFeedback({ ...feedback, score: e.target.value })}
                  placeholder="Enter score between 0-100"
                  disabled={selectedSubmission.status === 'reviewed'}
                />
              </div>

              <div className="form-group">
                <label>
                  Feedback Comments for {selectedSubmission.type === 'speaking' ? 'Speaking' : 'Writing'}
                </label>
                <textarea
                  rows="8"
                  value={feedback.comments}
                  onChange={(e) => setFeedback({ ...feedback, comments: e.target.value })}
                  placeholder={getFeedbackPlaceholder(selectedSubmission.type)}
                  disabled={selectedSubmission.status === 'reviewed'}
                />
              </div>

              {selectedSubmission.status === 'pending' ? (
                <button
                  className="btn-primary"
                  onClick={submitFeedback}
                  disabled={loading || !feedback.score || !feedback.comments}
                >
                  <Send size={16} />
                  {loading ? 'Sending Feedback...' : `Send ${selectedSubmission.type === 'speaking' ? 'Speaking' : 'Writing'} Feedback`}
                </button>
              ) : (
                <div className="already-reviewed-notice">
                  <CheckCircle size={20} />
                  <span>This submission has already been reviewed</span>
                </div>
              )}

              <button
                className="btn-danger"
                onClick={() => setDeleteConfirm(selectedSubmission.id)}
                style={{ marginTop: '1rem' }}
              >
                <Trash2 size={16} />
                Delete Submission
              </button>
            </>
          ) : (
            <div className="no-selection">
              <div className="no-selection-icon">
                <PenTool size={48} />
              </div>
              <h3>Select a Submission</h3>
              <p>Choose a submission from the list to provide feedback</p>
              <p className="help-text">
                {allSubmissions.length === 0
                  ? 'No submissions available yet. Wait for users to submit their practice tasks.'
                  : `${pendingCount} submission(s) pending review`
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal for Writing Submissions */}
      {showPreview && selectedSubmission && (
        <div className="preview-modal-overlay" onClick={() => setShowPreview(false)}>
          <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="preview-modal-header">
              <h3>Written Submission</h3>
              <button className="btn-close" onClick={() => setShowPreview(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="preview-modal-content">
              {selectedSubmission.submissionText ? (
                <p>{selectedSubmission.submissionText}</p>
              ) : (
                <p className="no-content">No text content available for this submission.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="preview-modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="delete-confirm-icon">
              <Trash2 size={32} />
            </div>
            <h3>Delete Submission?</h3>
            <p>Are you sure you want to delete this submission? This action cannot be undone.</p>
            <div className="delete-confirm-actions">
              <button
                className="btn-secondary"
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className="btn-danger"
                onClick={() => deleteSubmission(deleteConfirm)}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Feedback;