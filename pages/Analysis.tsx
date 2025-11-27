
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { analyzeProfile } from '../services/geminiService';
import { useAuth } from '../context/AuthContext';
import { User } from '../types';
import { Sparkles, CheckCircle, Fingerprint } from 'lucide-react';

export const Analysis: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [status, setStatus] = useState('Connecting to SportPulse AI Node...');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{persona: string, summary: string} | null>(null);

  useEffect(() => {
    const userData = location.state?.userData;
    
    if (!userData) {
      navigate('/welcome');
      return;
    }

    const runAnalysis = async () => {
      // Simulate Steps
      setTimeout(() => { setProgress(20); setStatus('Vectorizing sports interests...'); }, 800);
      setTimeout(() => { setProgress(45); setStatus('Scanning local matches...'); }, 1600);
      setTimeout(() => { setProgress(70); setStatus('Generating Sport Persona...'); }, 2400);

      // Actual Gemini Call
      const aiResult = await analyzeProfile(userData);
      setResult(aiResult);
      
      setProgress(100);
      setStatus('Profile Optimized.');

      // Finalize
      setTimeout(() => {
        const finalUser: User = {
          ...userData,
          id: Date.now().toString(),
          matchPercentage: 0,
          aiPersona: aiResult.persona,
          isTrainer: false // Default to false, BecomePro flow will set it true if completed
        };
        
        login(finalUser);
        
        // Redirect based on "Join as Pro" selection
        if (userData.wantsPro) {
            navigate('/become-pro');
        } else {
            navigate('/');
        }
      }, 2500);
    };

    runAnalysis();
  }, []);

  return (
    <div className="h-screen w-full flex items-center justify-center p-8 text-center relative overflow-hidden bg-black">
      {/* Deep Liquid Background effects */}
      <div className="absolute inset-0 bg-black z-0" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-white/5 rounded-full blur-[100px] animate-pulse-slow opacity-50" />
      <div className="absolute top-[30%] left-[30%] w-[250px] h-[250px] bg-indigo-900/30 rounded-full blur-[80px] animate-blob" />

      <div className="z-10 w-full max-w-sm flex flex-col items-center justify-center min-h-[400px]">
        {!result ? (
          <>
            <div className="w-40 h-40 mx-auto mb-16 relative flex items-center justify-center">
              {/* Outer Ring */}
              <div className="absolute inset-0 border border-white/5 rounded-full" />
              <div className="absolute inset-[-10px] border border-white/10 rounded-full opacity-50" />
              
              {/* Spinning Loader */}
              <div className="absolute inset-0 border-t-2 border-white rounded-full animate-spin shadow-[0_0_30px_rgba(255,255,255,0.3)]" />
              
              {/* Inner Static */}
              <div className="absolute inset-4 bg-black/40 rounded-full backdrop-blur-xl border border-white/10 flex items-center justify-center shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]">
                <Fingerprint size={48} className="text-white animate-pulse" strokeWidth={1} />
              </div>
            </div>
            
            <h2 className="text-3xl font-display font-bold text-white mb-4 tracking-tight">AI Analysis</h2>
            <p className="text-white/50 font-mono text-xs mb-12 h-4 tracking-wider uppercase">{status}</p>

            <div className="w-64 bg-white/10 rounded-full h-1.5 mb-4 overflow-hidden">
              <div 
                className="h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)] transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </>
        ) : (
          <div className="animate-pop flex flex-col items-center w-full">
            <div className="w-24 h-24 mx-auto mb-8 bg-white/[0.05] rounded-full flex items-center justify-center border border-white/20 shadow-[0_0_40px_rgba(255,255,255,0.15)]">
              <CheckCircle className="text-white w-10 h-10 drop-shadow-lg" strokeWidth={1.5} />
            </div>
            
            <h2 className="text-4xl font-display font-bold text-white mb-2">Match Ready</h2>
            
            <div className="w-full bg-gradient-to-b from-white/10 to-transparent backdrop-blur-2xl p-8 rounded-[32px] border border-white/10 mt-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-50" />
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50 pointer-events-none"></div>
              
              <div className="text-[10px] text-white/40 uppercase tracking-[0.2em] mb-3 font-bold">Your Persona</div>
              <div className="text-3xl font-display font-bold text-white mb-4 drop-shadow-md">{result.persona}</div>
              <div className="w-10 h-0.5 bg-white/20 mx-auto mb-5 rounded-full"></div>
              <p className="text-white/80 text-sm font-normal leading-relaxed italic">"{result.summary}"</p>
            </div>
            
            <p className="text-white/30 text-[10px] mt-8 animate-pulse uppercase tracking-widest">Entering Main Hub...</p>
          </div>
        )}
      </div>
    </div>
  );
};
