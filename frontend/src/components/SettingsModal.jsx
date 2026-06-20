import React, { useState, useEffect } from 'react';
import { X, Key, ShieldCheck, Eye, EyeOff, Info } from 'lucide-react';

export default function SettingsModal({ isOpen, onClose }) {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const savedKey = localStorage.getItem('ignite_gemini_key') || '';
    setApiKey(savedKey);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem('ignite_gemini_key', apiKey.trim());
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1000);
  };

  const handleClear = () => {
    localStorage.removeItem('ignite_gemini_key');
    setApiKey('');
    setSaved(true);
    setTimeout(() => setSaved(false), 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl glassmorphism border-white/10 shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-accentPurple" />
            <h3 className="text-lg font-semibold text-white">API Settings</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Google Gemini API Key (Optional)
            </label>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full py-2.5 pl-3 pr-10 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:border-accentPurple transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-gray-400 flex items-start gap-1 mt-1">
              <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-accentIndigo" />
              <span>
                Providing your API key unlocks **live Gemini AI response mode** for custom business ideas. Leave it empty to use our built-in high-quality local template engine.
              </span>
            </p>
          </div>

          <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-gray-300">
              <p className="font-semibold text-white mb-0.5">Securely Stored</p>
              Your key is saved locally in your own browser's storage and only passed in the headers to talk directly to Gemini's API. We never store your keys on our servers.
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={handleClear}
              className="flex-1 py-2 text-xs font-semibold border border-white/10 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-all"
            >
              Clear Key
            </button>
            <button
              type="submit"
              className="flex-1 py-2 text-xs font-semibold bg-gradient-to-r from-accentPurple to-accentPink rounded-xl text-white hover:opacity-90 shadow-lg shadow-accentPurple/20 transition-all"
            >
              {saved ? 'Saved Successfully!' : 'Save Key'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
