import React, { useEffect, useState } from 'react';
import { Activity, AlertCircle, CheckCircle2, Cpu, X, Zap } from 'lucide-react';
import { GEMINI_MODEL_ID } from '../../lib/ai/geminiService';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose }) => {
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [testSucceeded, setTestSucceeded] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setIsConfigured(null);
    setMessage(null);
    setTestSucceeded(false);
    fetch('/api/ai/config')
      .then(async response => {
        if (!response.ok) throw new Error(`Configuration request failed (${response.status}).`);
        const config = await response.json();
        setIsConfigured(Boolean(config.geminiConfigured));
      })
      .catch(error => {
        setIsConfigured(false);
        setMessage(error instanceof Error ? error.message : 'Could not load Gemini configuration.');
      });
  }, [isOpen]);

  if (!isOpen) return null;

  const testConnection = async () => {
    setIsTesting(true);
    setMessage(null);
    setTestSucceeded(false);
    const startedAt = Date.now();
    try {
      const response = await fetch('/api/ai/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: GEMINI_MODEL_ID,
          messages: [{ role: 'user', content: 'Reply with: Gemini online' }],
          max_tokens: 16,
          temperature: 0
        })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || `Gemini test failed (${response.status}).`);
      const reply = result.choices?.[0]?.message?.content?.trim();
      setMessage(`Gemini connection verified${reply ? `: ${reply}` : ''} (${Date.now() - startedAt}ms).`);
      setIsConfigured(true);
      setTestSucceeded(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Gemini connection test failed.');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-800/80">
          <div className="flex items-center space-x-3">
            <div className="rounded-xl bg-blue-600 p-2 text-white"><Zap className="h-5 w-5" /></div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Gemini API Configuration</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Server-side key status and connection test</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-6 text-xs text-slate-700 dark:text-slate-300">
          <div className="flex items-start justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/60 dark:bg-blue-950/20">
            <div>
              <p className="font-bold text-slate-900 dark:text-white">Google Gemini</p>
              <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-300">
                Model: <code className="font-mono">{GEMINI_MODEL_ID}</code>
              </p>
              <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-300">
                Configure <code className="font-mono">GEMINI_API_KEY</code> in the server environment. The key is never sent to the browser.
              </p>
            </div>
            <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${
              isConfigured
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
            }`}>
              {isConfigured === null ? 'CHECKING' : isConfigured ? 'CONFIGURED' : 'NOT CONFIGURED'}
            </span>
          </div>

          {message && (
            <div className={`flex items-start space-x-2 rounded-xl border p-3 ${
              testSucceeded
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200'
                : 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200'
            }`}>
              {testSucceeded ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
              <p>{message}</p>
            </div>
          )}

          <div className="flex items-center space-x-2 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
            <Cpu className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span>Chat and document image analysis use {GEMINI_MODEL_ID}.</span>
          </div>
        </div>

        <div className="flex justify-between border-t border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/60">
          <button
            type="button"
            onClick={testConnection}
            disabled={isTesting}
            className="flex items-center space-x-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <Activity className={`h-3.5 w-3.5 text-blue-600 ${isTesting ? 'animate-spin' : ''}`} />
            <span>{isTesting ? 'Testing Gemini...' : 'Test Gemini connection'}</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-blue-700"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
