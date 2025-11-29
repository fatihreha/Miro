import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';

// Minimal App - Provider test
function TestWelcome() {
    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontFamily: 'system-ui',
            textAlign: 'center',
            padding: '20px'
        }}>
            <div>
                <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                    🎉 App.tsx Çalışıyor!
                </h1>
                <p style={{ fontSize: '1.5rem' }}>
                    Router ve routing BAŞARILI
                </p>
                <p style={{ marginTop: '20px', opacity: 0.8 }}>
                    Sorun provider'lardan birinde. Şimdi tek tek ekleyeceğiz.
                </p>
            </div>
        </div>
    );
}

function App() {
    return (
        <HashRouter>
            <Routes>
                <Route path="/" element={<TestWelcome />} />
                <Route path="*" element={<TestWelcome />} />
            </Routes>
        </HashRouter>
    );
}

export default App;
