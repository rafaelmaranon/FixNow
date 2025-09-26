import React, { useState } from 'react';
import { Job } from '../data/mockJobs';
import './HomeownerModal.css';

interface HomeownerModalProps {
  onClose: () => void;
  onAddJob: (job: Omit<Job, 'id' | 'createdAt' | 'status' | 'lat' | 'lng'>) => void;
}

const HomeownerModal: React.FC<HomeownerModalProps> = ({ onClose, onAddJob }) => {
  const [formData, setFormData] = useState({
    category: 'Plumbing',
    address: '',
    description: '',
    customerName: '',
    phone: '',
    urgency: 'medium' as 'low' | 'medium' | 'high' | 'emergency',
    price: 0,
  });

  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // San Francisco addresses for auto-completion suggestions
  const sfAddresses = [
    '123 Market St, San Francisco, CA',
    '456 Mission St, San Francisco, CA',
    '789 Folsom St, San Francisco, CA',
    '321 Castro St, San Francisco, CA',
    '654 Valencia St, San Francisco, CA',
    '987 Haight St, San Francisco, CA',
    '147 Lombard St, San Francisco, CA',
    '258 Geary St, San Francisco, CA',
  ];

  const categories = [
    { value: 'Plumbing', emoji: '🔧' },
    { value: 'Electrical', emoji: '⚡' },
    { value: 'HVAC', emoji: '🌡️' },
    { value: 'Carpentry', emoji: '🔨' },
  ];

  const urgencyLevels = [
    { value: 'low', label: 'Low Priority', color: '#2ed573' },
    { value: 'medium', label: 'Medium Priority', color: '#ffa502' },
    { value: 'high', label: 'High Priority', color: '#ff6b6b' },
    { value: 'emergency', label: 'Emergency', color: '#ff4757' },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' ? parseFloat(value) || 0 : value
    }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedPhoto(file);
      console.log('📸 Photo selected:', file.name);
    }
  };

  const generateCoordinates = (address: string): { lat: number; lng: number } => {
    // Simple hash function to generate consistent coordinates for demo
    let hash = 0;
    for (let i = 0; i < address.length; i++) {
      const char = address.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Generate coordinates within San Francisco bounds
    const lat = 37.7749 + (hash % 1000) / 10000 - 0.05; // ±0.05 degrees
    const lng = -122.4194 + ((hash >> 10) % 1000) / 10000 - 0.05; // ±0.05 degrees
    
    return { lat, lng };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const newJobData: Omit<Job, 'id' | 'createdAt' | 'status' | 'lat' | 'lng'> = {
        category: formData.category,
        address: formData.address,
        description: formData.description,
        customerName: formData.customerName,
        phone: formData.phone,
        urgency: formData.urgency,
        price: formData.price,
      };

      await onAddJob(newJobData);
      onClose();
    } catch (error) {
      console.error('Failed to create job:', error);
      // Keep modal open on error so user can retry
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = formData.address && formData.description && formData.customerName && formData.phone;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🏠 Create New Job Request</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="job-form">
          <div className="form-section">
            <h3>Job Details</h3>
            
            <div className="form-group">
              <label htmlFor="category">Service Category</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="form-control"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.emoji} {cat.value}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="description">Problem Description *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe the issue you're experiencing..."
                className="form-control"
                rows={3}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="urgency">Priority Level</label>
              <div className="urgency-options">
                {urgencyLevels.map(level => (
                  <label key={level.value} className="urgency-option">
                    <input
                      type="radio"
                      name="urgency"
                      value={level.value}
                      checked={formData.urgency === level.value}
                      onChange={handleInputChange}
                    />
                    <span 
                      className="urgency-label"
                      style={{ borderColor: level.color }}
                    >
                      {level.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="price">Estimated Budget ($)</label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price || ''}
                onChange={handleInputChange}
                placeholder="Enter your budget"
                className="form-control"
                min="0"
                step="10"
              />
            </div>
          </div>

          <div className="form-section">
            <h3>Location & Contact</h3>
            
            <div className="form-group">
              <label htmlFor="address">Address *</label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Enter your address in San Francisco"
                className="form-control"
                list="sf-addresses"
                required
              />
              <datalist id="sf-addresses">
                {sfAddresses.map((addr, index) => (
                  <option key={index} value={addr} />
                ))}
              </datalist>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="customerName">Your Name *</label>
                <input
                  type="text"
                  id="customerName"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleInputChange}
                  placeholder="Full name"
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone Number *</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="(415) 555-0123"
                  className="form-control"
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Photo Upload (Optional)</h3>
            
            <div className="photo-upload">
              <input
                type="file"
                id="photo"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="photo-input"
              />
              <label htmlFor="photo" className="photo-label">
                {selectedPhoto ? (
                  <div className="photo-selected">
                    📸 {selectedPhoto.name}
                    <span className="photo-size">
                      ({(selectedPhoto.size / 1024 / 1024).toFixed(1)} MB)
                    </span>
                  </div>
                ) : (
                  <div className="photo-placeholder">
                    📷 Add a photo to help contractors understand the issue
                  </div>
                )}
              </label>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={onClose}
              className="cancel-btn"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="submit-btn"
              disabled={!isFormValid || isSubmitting}
            >
              {isSubmitting ? '🔄 Creating Job...' : '✅ Create Job Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HomeownerModal;
