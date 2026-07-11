import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';

export const Verify: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  useEffect(() => {
    if (id) {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      window.location.replace(`${apiUrl}/documents/${id}/render`);
    }
  }, [id]);

  return (
    <div className="min-h-screen bg-cyber-bg text-cyber-text flex items-center justify-center">
      <div className="text-center">
        <div className="h-10 w-10 border-t-2 border-cyber-primary rounded-full animate-spin mx-auto mb-4" />
        <span className="text-xs text-cyber-text-muted font-semibold uppercase">Loading certificate...</span>
      </div>
    </div>
  );
};
