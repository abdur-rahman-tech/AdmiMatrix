import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Cpu, Sliders, X, Zap } from 'lucide-react';
import {
  getPreferredGroqModel,
  GroqModelId,
  setPreferredGroqModel,
  testGroqConnection
} from '../../lib/ai/groqService';

interface DeveloperSettingsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigUpdated?: () => void;
}

export const DeveloperSettingsSidebar: React.FC<DeveloperSettingsSidebarProps> = ({
  isOpen,
  onClose,
  onConfigUpdated
}) => {
  const [selectedModel, setSelectedModel] = useState<GroqModelId>(getPreferredGroqModel());
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    latencyMs?: number;
  } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedModel(getPreferredGroqModel());
    setTestResult(null);
    fetch('/api/ai/config')
      .then(async response => {
        if (!response.ok) throw new Error(`Configuration request failed (${response.status}).`);
        const config = await response.json();
        setConfigured(Boolean(config.groqConfigured));
      })
      .catch(() => setConfigured(false));
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleModelChange = (model: GroqModelId) => {
    setSelectedModel(model);
    setPreferredGroqModel(model);
    setTestResult(null);
    onConfigUpdated?.();
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      setTestResult(await testGroqConnection(selectedModel));
    } finally {
      setIsTesting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-xs flex justify-end">
      <button
        type="button"
        aria-label="Close settings"
        className="flex-1 cursor-default"
        onClick={onClose}
      />
      <aside className="w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl h-full flex flex-col overflow-y-auto">
        <header className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-500 text-white">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Groq AI Settings</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Server-managed API key; it is never stored in your browser.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close settings"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="p-5 space-y-6 flex-1 text-xs text-slate-700 dark:text-slate-300">
          <section className="space-y-2">
            <h4 className="font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5 text-slate-900 dark:text-white">
              <Zap className="w-3.5 h-3.5 text-orange-500" />
              Groq server configuration
            </h4>
            <p className="text-[11px] leading-relaxed">
              {configured === null
                ? 'Checking server configuration…'
                : configured
                  ? 'GROQ_API_KEY is configured on the server.'
                  : 'GROQ_API_KEY is not available. Set it in the ignored .env file and restart the app server.'}
            </p>
            <a
              href="https://console.groq.com/keys"
              target="_blank"
              rel="noreferrer"
              className="inline-block text-orange-600 dark:text-orange-400 hover:underline"
            >
              Manage Groq API keys
            </a>
          </section>

          <section className="space-y-2">
            <label className="font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5 text-slate-900 dark:text-white">
              <Cpu className="w-3.5 h-3.5 text-orange-500" />
              Preferred model
            </label>
            <select
              value={selectedModel}
              onChange={event => handleModelChange(event.target.value as GroqModelId)}
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-semibold text-slate-900 dark:text-white"
            >
              <option value="openai/gpt-oss-120b">GPT OSS 120B</option>
              <option value="openai/gpt-oss-20b">GPT OSS 20B</option>
              <option value="qwen/qwen3.8-27b">Qwen 3.8 27B</option>
            </select>
          </section>

          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isTesting || configured === false}
            className="w-full rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 disabled:opacity-50"
          >
            {isTesting ? 'Testing Groq connection…' : 'Test Groq connection'}
          </button>

          {testResult && (
            <div className={`p-3 rounded-lg border text-xs flex items-start gap-2 ${
              testResult.success
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
            }`}>
              {testResult.success
                ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
              <div>
                <p className="font-bold">{testResult.success ? 'Groq connected' : 'Connection failed'}</p>
                <p>{testResult.message}</p>
                {testResult.latencyMs !== undefined && <p>{testResult.latencyMs} ms</p>}
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};
