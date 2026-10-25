import React, { useState, useEffect } from 'react';
import api from '../services/api';

const SignatureViewer = ({ voucherId, type, altText = 'Signature' }) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    let objectUrl = null;

    const fetchImage = async () => {
      if (!voucherId || !type) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(false);
        const res = await api.get(`/vouchers/${voucherId}/signatures/${type}`, {
          responseType: 'blob',
        });
        if (active) {
          objectUrl = URL.createObjectURL(res.data);
          setImageUrl(objectUrl);
          setLoading(false);
        }
      } catch (err) {
        if (active) {
          setError(true);
          setLoading(false);
        }
      }
    };

    fetchImage();

    return () => {
      active = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [voucherId, type]);

  if (loading) {
    return (
      <div className="p-3 bg-light border rounded text-center text-muted" style={{ minHeight: '80px' }}>
        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
        Loading signature...
      </div>
    );
  }

  if (error || !imageUrl) {
    return (
      <div className="p-3 bg-light border rounded text-center text-muted small" style={{ minHeight: '80px' }}>
        <i className="bi bi-file-earmark-x text-danger me-1"></i> Signature not available
      </div>
    );
  }

  return (
    <div className="border rounded p-2 bg-white text-center shadow-sm d-inline-block">
      <img
        src={imageUrl}
        alt={altText}
        className="img-fluid"
        style={{ maxHeight: '110px', maxWidth: '320px', objectFit: 'contain' }}
      />
    </div>
  );
};

export default SignatureViewer;
