// src/LeadDetailsPage.js (or src/pages/LeadDetailsPage.js)

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './LeadDetailsPage.css'; // We'll create this CSS file next

export default function LeadDetailsPage() {
    const { id } = useParams(); // Get the lead ID from the URL
    const navigate = useNavigate();
    const [lead, setLead] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchLeadDetails = async () => {
            try {
                // Fetch details for the specific lead using its ID
                const res = await axios.get(`http://localhost:8000/api/leads/${id}`);
                setLead(res.data);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching lead details:', err);
                setError('Failed to load lead details. Please try again.');
                setLoading(false);
            }
        };

        fetchLeadDetails();
    }, [id]); // Re-fetch if the ID changes

    if (loading) {
        return <div className="lead-details-container">Loading lead details...</div>;
    }

    if (error) {
        return <div className="lead-details-container error-message">{error}</div>;
    }

    if (!lead) {
        return <div className="lead-details-container">Lead not found.</div>;
    }

    // Function to format the date if needed
    const formatDate = (dateString) => {
        return dateString ? new Date(dateString).toLocaleDateString() : 'N/A';
    };

    return (
        <div className="lead-details-container">
            <div className="lead-details-header">
                <h2>{lead.salutation} {lead.name}</h2>
                <button className="back-button" onClick={() => navigate(-1)}>← Back</button>
            </div>

            <div className="lead-details-card">
                <div className="card-section">
                    <h3>Contact Information</h3>
                    <div className="detail-grid">
                        <div className="detail-item">
                            <span className="label">Full Name:</span>
                            <span>{lead.salutation} {lead.name}</span>
                        </div>
                        <div className="detail-item">
                            <span className="label">Email:</span>
                            <span>{lead.email || 'N/A'}</span>
                        </div>
                        <div className="detail-item">
                            <span className="label">Phone:</span>
                            <span>{lead.phone || 'N/A'}</span>
                        </div>
                        <div className="detail-item">
                            <span className="label">Company:</span>
                            <span>{lead.company || 'N/A'}</span>
                        </div>
                        <div className="detail-item">
                            <span className="label">Website:</span>
                            <span>{lead.website || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                <div className="card-section">
                    <h3>Lead Details</h3>
                    <div className="detail-grid">
                        <div className="detail-item">
                            <span className="label">Lead Owner:</span>
                            <span>{lead.leadOwner || 'N/A'}</span>
                        </div>
                        <div className="detail-item">
                            <span className="label">Lead Source:</span>
                            <span>{lead.leadSource || 'N/A'}</span>
                        </div>
                        <div className="detail-item">
                            <span className="label">Lead Status:</span>
                            <span>{lead.leadStatus || 'N/A'}</span>
                        </div>
                        <div className="detail-item">
                            <span className="label">Industry:</span>
                            <span>{lead.industry || 'N/A'}</span>
                        </div>
                        <div className="detail-item">
                            <span className="label">Annual Revenue:</span>
                            <span>{lead.annualRevenue ? `$${lead.annualRevenue.toLocaleString()}` : 'N/A'}</span>
                        </div>
                        <div className="detail-item">
                            <span className="label">No. of Employees:</span>
                            <span>{lead.noOfEmployees || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                <div className="card-section">
                    <h3>Address Information</h3>
                    <div className="detail-grid">
                        <div className="detail-item">
                            <span className="label">Street:</span>
                            <span>{lead.address?.street || 'N/A'}</span>
                        </div>
                        <div className="detail-item">
                            <span className="label">City:</span>
                            <span>{lead.address?.city || 'N/A'}</span>
                        </div>
                        <div className="detail-item">
                            <span className="label">State:</span>
                            <span>{lead.address?.state || 'N/A'}</span>
                        </div>
                        <div className="detail-item">
                            <span className="label">Zip Code:</span>
                            <span>{lead.address?.zipCode || 'N/A'}</span>
                        </div>
                        <div className="detail-item">
                            <span className="label">Country:</span>
                            <span>{lead.address?.country || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                <div className="card-section">
                    <h3>Other Information</h3>
                    <div className="detail-grid">
                        <div className="detail-item">
                            <span className="label">Created At:</span>
                            <span>{formatDate(lead.createdAt)}</span>
                        </div>
                        <div className="detail-item">
                            <span className="label">Last Modified At:</span>
                            <span>{formatDate(lead.updatedAt)}</span>
                        </div>
                        <div className="detail-item full-width">
                            <span className="label">Description:</span>
                            <p className="description-text">{lead.description || 'N/A'}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}