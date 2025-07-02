import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [results, setResults] = useState([]);
  const [expandedCard, setExpandedCard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedContact, setSelectedContact] = useState(null);
  const [draftMessage, setDraftMessage] = useState('');
  const [loadingDraft, setLoadingDraft] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Try proxy first, fallback to direct URL
      const apiUrl = process.env.NODE_ENV === 'production' 
        ? '/api/customers' 
        : 'http://localhost:5001/api/customers';
      
      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('API Response:', data); // Debug logging
      setResults(data.contactInfo || []); // Updated to match backend response with fallback
    } catch (err) {
      setError(`Failed to fetch connections: ${err.message}`);
      console.error('Error fetching data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpand = (index) => {
    if (expandedCard === index) {
      setExpandedCard(null);
    } else {
      setExpandedCard(index);
    }
  };

  const handleContactClick = async (contact, e) => {
    e.stopPropagation(); // Prevent card expansion when clicking contact
    
    setSelectedContact(contact);
    setLoadingDraft(true);
    setDraftMessage('');

    try {
      // Try proxy first, fallback to direct URL
      const apiUrl = process.env.NODE_ENV === 'production' 
        ? '/api/draft-message' 
        : 'http://localhost:5001/api/draft-message';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contact: contact
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      setDraftMessage(data.message || 'No message generated');
    } catch (err) {
      console.error('Error generating draft:', err);
      setDraftMessage(`Sorry, we could not generate a draft message at this time. Error: ${err.message}`);
    } finally {
      setLoadingDraft(false);
    }
  };

  const closeContactModal = () => {
    setSelectedContact(null);
    setDraftMessage('');
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Message copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy: ', err);
    });
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Networking Agent</h1>
        <p className="company-info">
          Finding connections & drafting messages to simplify networking!
        </p>
      </header>

      <main className="main-content">
        {error && (
          <div className="error-message">
            <p>Unable to retrieve connection data</p>
            <button onClick={fetchCustomers}>Try Again</button>
          </div>
        )}

        {isLoading ? (
          <div className="loading">
            <p>Researching possible connections...</p>
            <div className="spinner"></div>
          </div>
        ) : (
          <>
            {results.length > 0 ? (
              <div className="results-container">
                <h2>Recommended Connections</h2>
                <div className="results-count">{results.length} potential connections identified</div>
                
                <div className="company-cards">
                  {results.map((person, index) => (
                    <div 
                      className={`company-card ${expandedCard === index ? 'expanded' : ''}`} 
                      key={index}
                      onClick={() => toggleExpand(index)}
                    >
                      <div className="card-header">
                        <h3>{person.Name}</h3>
                        <div className="expand-icon">
                          {expandedCard === index ? '−' : '+'}
                        </div>
                      </div>
                      
                      <div className="card-preview">
                        <span>{person["Job Title"]} at {person.Workplace}</span>
                      </div>
                      
                      <div className="card-details">
                        <div className="company-detail">
                          <strong>Job Title:</strong> {person["Job Title"]}
                        </div>
                        <div className="company-detail">
                          <strong>Workplace:</strong> {person.Workplace}
                        </div>
                        <div className="company-detail">
                          <strong>Strategic Relevance:</strong> {person["Strategic Relevance"]}
                        </div>
                        {person["Princeton Connection"] && (
                          <div className="company-detail">
                            <strong>Princeton Connection:</strong> {person["Princeton Connection"]}
                          </div>
                        )}
                        {person["Previous Mentorship"] && (
                          <div className="company-detail">
                            <strong>Previous Mentorship:</strong> {person["Previous Mentorship"]}
                          </div>
                        )}
                        
                        {person["Contact Information"] && person["Contact Information"].length > 0 && (
                          <div className="company-detail">
                            <strong>Contact Information:</strong>
                            <div className="key-contacts-list">
                              {person["Contact Information"].map((contact, idx) => (
                                <div 
                                  key={idx} 
                                  className="contact-information-card clickable"
                                  onClick={(e) => handleContactClick(contact, e)}
                                >
                                  <div className="contact-name">{contact.Name}</div>
                                  <div className="contact-title">{contact.Title}</div>
                                  <div className="contact-action">
                                    Click to draft message
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Main person contact button */}
                        <div className="main-contact-section">
                          <button 
                            className="contact-main-person-btn"
                            onClick={(e) => handleContactClick({
                              Name: person.Name,
                              Title: person["Job Title"],
                              Workplace: person.Workplace,
                              "LinkedIn SalesNav URL": person["LinkedIn SalesNav URL"] || "#"
                            }, e)}
                          >
                            Draft Message to {person.Name}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="no-results">
                <p>No potential connections found</p>
                <button onClick={fetchCustomers}>Refresh</button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Contact Modal */}
      {selectedContact && (
        <div className="modal-overlay" onClick={closeContactModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Outreach to {selectedContact.Name}</h3>
              <button className="close-button" onClick={closeContactModal}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="contact-info">
                <p><strong>Name:</strong> {selectedContact.Name}</p>
                <p><strong>Title:</strong> {selectedContact.Title}</p>
              </div>

              {selectedContact["LinkedIn SalesNav URL"] && selectedContact["LinkedIn SalesNav URL"] !== "#" && (
                <div className="linkedin-section">
                  <a
                    href={selectedContact["LinkedIn SalesNav URL"]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="linkedin-button"
                  >
                    View {selectedContact.Name}'s LinkedIn Profile
                  </a>
                </div>
              )}

              <div className="message-section">
                <h4>Draft LinkedIn Message</h4>
                {loadingDraft ? (
                  <div className="loading-draft">
                    <p>Generating personalized message...</p>
                    <div className="spinner-small"></div>
                  </div>
                ) : (
                  <div className="message-container">
                    <textarea
                      className="draft-message"
                      value={draftMessage}
                      onChange={(e) => setDraftMessage(e.target.value)}
                      rows={8}
                      placeholder="Your personalized LinkedIn message will appear here..."
                    />
                    <div className="message-actions">
                      <button 
                        className="copy-button"
                        onClick={() => copyToClipboard(draftMessage)}
                        disabled={!draftMessage}
                      >
                        Copy Message
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;