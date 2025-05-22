import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [results, setResults] = useState([]);
  const [company, setCompany] = useState('');
  const [segment, setSegment] = useState('');
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
      const response = await fetch('/api/customers');

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      setResults(data.companyInfo);
      setCompany(data.company);
      setSegment(data.segment);
    } catch (err) {
      setError(err.message);
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

  const handleContactClick = async (contact, companyName, e) => {
    e.stopPropagation(); // Prevent card expansion when clicking contact
    
    setSelectedContact({ ...contact, companyName });
    setLoadingDraft(true);
    setDraftMessage('');

    try {
      const response = await fetch('/api/draft-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contact: contact,
          company: companyName
        })
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      setDraftMessage(data.message);
    } catch (err) {
      console.error('Error generating draft:', err);
      setDraftMessage('Sorry, we could not generate a draft message at this time.');
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
        <h1>Lead Generation & Outreach </h1>
        {company && segment && (
          <p className="company-info">
            Finding potential customers for <span className="highlight">{company}</span> · <span className="highlight">{segment}</span>
          </p>
        )}
      </header>

      <main className="main-content">
        {error && (
          <div className="error-message">
            <p>Unable to retrieve customer data</p>
            <button onClick={fetchCustomers}>Try Again</button>
          </div>
        )}

        {isLoading ? (
          <div className="loading">
            <p>Extracting market data...</p>
            <div className="spinner"></div>
          </div>
        ) : (
          <>
            {results.length > 0 ? (
              <div className="results-container">
                <h2>Recommended Companies</h2>
                <div className="results-count">{results.length} companies identified</div>
                
                <div className="company-cards">
                  {results.map((company, index) => (
                    <div 
                      className={`company-card ${expandedCard === index ? 'expanded' : ''}`} 
                      key={index}
                      onClick={() => toggleExpand(index)}
                    >
                      <div className="card-header">
                        <h3>{company.Name}</h3>
                        <div className="expand-icon">
                          {expandedCard === index ? '−' : '+'}
                        </div>
                      </div>
                      
                      <div className="card-preview">
                        <span>{company["Industry Fit"]}</span>
                        {/* <span>{company["Size and Revenue"]}</span> */}
                      </div>
                      
                      <div className="card-details">
                        <div className="company-detail">
                          <strong>Industry:</strong> {company["Industry Fit"]}
                        </div>
                        <div className="company-detail">
                          <strong>Size & Revenue:</strong> {company["Size and Revenue"]}
                        </div>
                        <div className="company-detail">
                          <strong>Strategic Relevance:</strong> {company["Strategic Relevance"]}
                        </div>
                        <div className="company-detail">
                          <strong>Industry Engagement:</strong> {company["Industry Engagement"]}
                        </div>
                        <div className="company-detail">
                          <strong>Market Activity:</strong> {company["Market Activity"]}
                        </div>
                        <div className="company-detail">
                          <strong>Key Contacts:</strong>
                          <div className="key-contacts-list">
                            {Array.isArray(company["Key Contacts"]) && company["Key Contacts"].map((contact, idx) => (
                              <div 
                                key={idx} 
                                className="key-contact-card clickable"
                                onClick={(e) => handleContactClick(contact, company.Name, e)}
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
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="no-results">
                <p>No potential customers found in this segment</p>
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
                <p><strong>Company:</strong> {selectedContact.companyName}</p>
              </div>

              <div className="linkedin-section">
                <a
                  href={selectedContact["LinkedIn SalesNav URL"]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="linkedin-button"
                >
                  {selectedContact.Name}'s LinkedIn Sales Navigator
                </a>
              </div>

              <div className="message-section">
                <h4>Draft Message</h4>
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
                      placeholder="Your personalized message will appear here..."
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