import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import { getPreferredGroqModel, testGroqConnection } from '../../lib/ai/groqService';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose }) => {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setResult(null);
    fetch('/api/ai/config')
      .then(async response => {
        if (!response.ok) throw new Error(`Configuration request failed (${response.status}).`);
        const config = await response.json();
        setConfigured(Boolean(config.groqConfigured));
      })
      .catch(() => setConfigured(false));
  }, [isOpen]);

  const testConnection = async () => {
    setIsTesting(true);
    setResult(null);
    try {
      const response = await testGroqConnection(getPreferredGroqModel());
      setResult({ success: response.success, message: response.message });
    } finally {
      setIsTesting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="groq-config-title"
        className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4">
          <div>
            <h2 id="groq-config-title" className="font-bold text-slate-900 dark:text-white">
              Groq API configuration
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              The API key is managed by the server and is not entered or stored in this browser.
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-slate-500 hover:text-slate-900 dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </header>

        <p className="mt-5 text-sm text-slate-700 dark:text-slate-200">
          {configured === null
            ? 'Checking server configuration…'
            : configured
              ? 'GROQ_API_KEY is configured on the server.'
              : 'GROQ_API_KEY is not configured. Add it to the ignored .env file and restart the server.'}
        </p>

        <a
          href="https://console.groq.com/keys"
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-block text-sm text-orange-600 dark:text-orange-400 hover:underline"
        >
          Manage Groq API keys
        </a>

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg px-3 py-2 text-sm text-slate-600 dark:text-slate-300">
            Close
          </button>
          <button
            onClick={testConnection}
            disabled={isTesting || configured === false}
            className="rounded-lg bg-orange-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {isTesting ? 'Testing…' : 'Test connection'}
          </button>
        </div>

        {result && (
          <div className={`mt-4 flex gap-2 rounded-lg border p-3 text-sm ${
            result.success
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
              : 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
          }`}>
            {result.success
              ? <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              : <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />}
            <p>{result.message}</p>
          </div>
        )}
      </section>
    </div>
  );
};
