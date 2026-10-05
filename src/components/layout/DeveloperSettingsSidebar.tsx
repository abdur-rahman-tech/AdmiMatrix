import React, { useState, useEffect } from 'react';
import {
  Sliders,
  X,
  Key,
  Eye,
  EyeOff,
  Activity,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Layers,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Terminal,
  Database,
  Zap
} from 'lucide-react';
import {
  getActiveApiKey,
  setActiveApiKey,
  clearActiveApiKey,
  getPreferredModel,
  setPreferredModel,
  testGeminiConnection,
  GeminiModelId
} from '../../lib/ai/geminiService';
import {
  getActiveGroqApiKey,
  setActiveGroqApiKey,
  clearActiveGroqApiKey,
  testGroqConnection,
  GroqModelId
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
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [groqKeyInput, setGroqKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [showGroqKey, setShowGroqKey] = useState(false);
  const [selectedModel, setSelectedModel] = useState<GeminiModelId>('gemini-3.8-flash');
  const [isTesting, setIsTesting] = useState(false);
  const [isTestingGroq, setIsTestingGroq] = useState(false);
  const [hasServerGeminiKey, setHasServerGeminiKey] = useState(false);
  const [hasServerGroqKey, setHasServerGroqKey] = useState(false);
  const [serverConfigAvailable, setServerConfigAvailable] = useState(true);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    model?: string;
    latencyMs?: number;
  } | null>(null);
  const [groqTestResult, setGroqTestResult] = useState<{
    success: boolean;
    message: string;
    model?: string;
    latencyMs?: number;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setApiKeyInput(getActiveApiKey());
      setGroqKeyInput(getActiveGroqApiKey());
      setSelectedModel(getPreferredModel());
      setTestResult(null);
      setGroqTestResult(null);
      fetch('/api/ai/config')
        .then(async response => {
          if (!response.ok) throw new Error(`Configuration request failed (${response.status}).`);
          const config = await response.json();
          setHasServerGeminiKey(Boolean(config.geminiConfigured));
          setHasServerGroqKey(Boolean(config.groqConfigured));
          setServerConfigAvailable(true);
        })
        .catch(() => {
          setHasServerGeminiKey(false);
          setHasServerGroqKey(false);
          setServerConfigAvailable(false);
        });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSaveKey = () => {
    setActiveApiKey(apiKeyInput);
    setActiveGroqApiKey(groqKeyInput);
    setPreferredModel(selectedModel);
    if (onConfigUpdated) onConfigUpdated();
  };

  const handleClearKey = () => {
    clearActiveApiKey();
    setApiKeyInput('');
    setTestResult(null);
    if (onConfigUpdated) onConfigUpdated();
  };

  const handleClearGroqKey = () => {
    clearActiveGroqApiKey();
    setGroqKeyInput('');
    setGroqTestResult(null);
    if (onConfigUpdated) onConfigUpdated();
  };

  const handleModelChange = (model: GeminiModelId) => {
    setSelectedModel(model);
    setPreferredModel(model);
    if (onConfigUpdated) onConfigUpdated();
  };

  const handleTestPing = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testGeminiConnection(apiKeyInput.trim(), selectedModel);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        model: selectedModel,
        message: err?.message || 'Connection ping failed.',
        latencyMs: 0
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleTestGroqPing = async () => {
    setIsTestingGroq(true);
    setGroqTestResult(null);
    try {
      const chosenGroqModel = selectedModel.startsWith('groq:')
        ? (selectedModel.replace('groq:', '') as GroqModelId)
        : 'openai/gpt-oss-120b';
      const res = await testGroqConnection(groqKeyInput.trim(), chosenGroqModel);
      setGroqTestResult(res);
    } catch (err: any) {
      setGroqTestResult({
        success: false,
        message: err?.message || 'Groq ping failed.',
        latencyMs: 0
      });
    } finally {
      setIsTestingGroq(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-xs flex justify-end">
      {/* Click outside backdrop */}
      <div className="flex-1" onClick={onClose} />

      {/* Slide-over Panel */}
      <aside className="w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl h-full flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-purple-600 text-white shadow-xs">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <span>Developer &amp; AI Settings</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-700">
                  Live Control
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Runtime model selection, API key override, and connection telemetry.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Controls */}
        <div className="p-5 space-y-6 flex-1 text-xs text-slate-700 dark:text-slate-300">
          {/* Section 1: API Key Management */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
                <Key className="w-3.5 h-3.5 text-purple-600" />
                <span>Google Gemini API Key</span>
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-purple-600 dark:text-purple-400 hover:underline flex items-center space-x-1"
              >
                <span>Get Free Key</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKeyInput}
                onChange={e => {
                  setApiKeyInput(e.target.value);
                  setTestResult(null);
                }}
                onBlur={handleSaveKey}
                placeholder="AIzaSy... (Browser-local override; server .env is preferred)"
                className="w-full pl-3 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500 dark:text-slate-400">
                {!serverConfigAvailable
                  ? 'Server configuration status unavailable'
                  : hasServerGeminiKey
                    ? '✓ Server .env key detected'
                    : 'No server .env key detected'}
              </span>
              {apiKeyInput && (
                <button
                  type="button"
                  onClick={handleClearKey}
                  className="text-rose-500 hover:text-rose-600 font-semibold cursor-pointer"
                >
                  Clear Key
                </button>
              )}
            </div>
          </div>

          {/* Section 2: Groq API Key Management */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
                <Zap className="w-3.5 h-3.5 text-orange-500" />
                <span>Groq LPU API Key</span>
              </label>
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-orange-600 dark:text-orange-400 hover:underline flex items-center space-x-1"
              >
                <span>Get Free Groq Key</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="relative">
              <input
                type={showGroqKey ? 'text' : 'password'}
                value={groqKeyInput}
                onChange={e => {
                  setGroqKeyInput(e.target.value);
                  setGroqTestResult(null);
                }}
                onBlur={handleSaveKey}
                placeholder="gsk_... (Browser-local override; server .env is preferred)"
                className="w-full pl-3 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <button
                type="button"
                onClick={() => setShowGroqKey(!showGroqKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showGroqKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500 dark:text-slate-400">
                {!serverConfigAvailable
                  ? 'Server configuration status unavailable'
                  : hasServerGroqKey
                    ? '✓ Server .env key detected'
                    : groqKeyInput
                      ? '✓ Browser-local Groq key saved'
                      : 'No Groq key saved'}
              </span>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={handleTestGroqPing}
                  disabled={isTestingGroq}
                  className="text-orange-600 dark:text-orange-400 hover:underline font-bold cursor-pointer disabled:opacity-50"
                >
                  {isTestingGroq ? 'Testing...' : 'Test Groq'}
                </button>
                {groqKeyInput && (
                  <button
                    type="button"
                    onClick={handleClearGroqKey}
                    className="text-rose-500 hover:text-rose-600 font-semibold cursor-pointer"
                  >
                    Clear Groq
                  </button>
                )}
              </div>
            </div>

            {groqTestResult && (
              <div
                className={`p-3 rounded-lg border text-xs flex items-start space-x-2 ${
                  groqTestResult.success
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                    : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                }`}
              >
                {groqTestResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="space-y-0.5">
                  <span className="font-bold block">
                    {groqTestResult.success ? 'Groq LPU Connected' : 'Groq Connection Error'}
                  </span>
                  <p className="text-[11px] font-mono leading-tight">{groqTestResult.message}</p>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Active Model Selection */}
          <div className="space-y-2">
            <label className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
              <Cpu className="w-3.5 h-3.5 text-purple-600" />
              <span>Active AI Model Target</span>
            </label>

            <select
              value={selectedModel}
              onChange={e => handleModelChange(e.target.value as GeminiModelId)}
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
            >
              <optgroup label="Groq LPU (Ultra-Low Latency &amp; Forecast Grounded)">
                <option value="groq:openai/gpt-oss-120b">groq:openai/gpt-oss-120b (Recommended)</option>
                <option value="groq:openai/gpt-oss-20b">groq:openai/gpt-oss-20b</option>
                <option value="groq:llama-3.3-70b-versatile">groq:llama-3.3-70b-versatile (Fast Deep Reasoning)</option>
                <option value="groq:llama-3.1-8b-instant">groq:llama-3.1-8b-instant (Sub-second Instant)</option>
                <option value="groq:mixtral-8x7b-32768">groq:mixtral-8x7b-32768 (High Throughput MoE)</option>
              </optgroup>
              <optgroup label="Google Gemini Models">
                <option value="gemini-3.8-flash">gemini-3.8-flash (Standard Multimodal — Recommended)</option>
                <option value="gemini-2.5-flash">gemini-2.5-flash (Fast Primary)</option>
                <option value="gemini-flash-latest">gemini-flash-latest (Dynamic Flash Alias)</option>
                <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Speed &amp; Rate-Limit Fallback)</option>
                <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview (Deep Institutional Reasoning)</option>
              </optgroup>
            </select>
          </div>

          {/* Section 4: Connection Ping Test */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-white text-[11px] uppercase tracking-wider">
                Gemini Connection Health
              </span>
              <button
                type="button"
                onClick={handleTestPing}
                disabled={isTesting}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold transition disabled:opacity-50 cursor-pointer shadow-xs active:scale-95"
              >
                <Activity className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                <span>{isTesting ? 'Pinging...' : 'Test Gemini'}</span>
              </button>
            </div>

            {testResult && (
              <div
                className={`p-3 rounded-xl border flex items-start space-x-2 text-xs ${
                  testResult.success
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                    : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                )}
                <div className="space-y-0.5">
                  <p className="font-bold">
                    {testResult.success ? `Connected (${testResult.latencyMs}ms)` : 'Connection Failed'}
                  </p>
                  <p className="text-[11px] leading-relaxed">{testResult.message}</p>
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Architecture Guarantee Pill */}
          <div className="p-4 rounded-xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/60 space-y-2 text-[11px]">
            <span className="font-bold text-purple-900 dark:text-purple-200 uppercase tracking-wider flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
              <span>Mathematical Integrity Separation</span>
            </span>
            <p className="text-purple-800 dark:text-purple-300 leading-relaxed">
              AdmiMatrix strictly executes all numerical time-series forecasting (Logit-Linked Asymptotic Trend, Holt-Winters, Monte Carlo intervals) in local TypeScript modules (<code className="font-mono text-purple-900 dark:text-purple-200">src/lib/ml</code>). LLMs are strictly used for natural language explanation and multimodal vision inspection.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
          <span className="text-[10px] font-mono text-slate-400">
            AdmiMatrix v2.4 • Hackathon Build
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-bold text-xs transition cursor-pointer"
          >
            Close Settings
          </button>
        </div>
      </aside>
    </div>
  );
};
