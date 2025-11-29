import React from 'react';

// Minimal test component - sorunun kaynağını bulmak için
export const TestPage: React.FC = () => {
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      fontFamily: 'system-ui'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅ React Çalışıyor!</h1>
        <p style={{ fontSize: '1.5rem', opacity: 0.9 }}>Test Page - {new Date().toLocaleTimeString()}</p>
        <p style={{ marginTop: '2rem', fontSize: '1rem', opacity: 0.7 }}>
          Bu sayfayı görüyorsan React render oluyor.
        </p>
      </div>
    </div>
  );
};
