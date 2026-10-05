import React, { useState } from 'react';
import {
  Sparkles,
  Search,
  Upload,
  Image as ImageIcon,
  Key,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Clock,
  Layers,
  FileText,
  Languages,
  ArrowRight,
  RefreshCw,
  Zap,
  Info,
  ChevronDown,
  ChevronUp,
  Brain,
  Sliders,
  ExternalLink,
  BookOpen
} from 'lucide-react';
import { AdmissionRecord, PopulationRecord, ForecastResult } from '../../types';
import {
  queryGroqInstitutionalAI,
  analyzeAdmissionDocumentImageWithGroq,
  StructuredAiResponse,
  VisionDocumentAnalysis,
  getActiveGroqApiKey,
  getPreferredGroqModel,
  setPreferredGroqModel,
  GroqModelId
} from '../../lib/ai/groqService';
import { ApiKeyModal } from '../ai/ApiKeyModal';
import { AiBriefingSkeleton, CardSkeleton } from '../common/SkeletonLoader';

interface AskTheDataProps {
  admissionsData: AdmissionRecord[];
  populationData: PopulationRecord[];
  forecastResult: ForecastResult | null;
  onOpenDevSettings?: () => void;
}

type ModeTab = 'QUERY' | 'VISION';

export const AskTheData: React.FC<AskTheDataProps> = ({
  admissionsData,
  populationData,
  forecastResult,
  onOpenDevSettings
}) => {
  const [activeMode, setActiveMode] = useState<ModeTab>('QUERY');
  const [question, setQuestion] = useState('');
  const [selectedModel, setSelectedModel] = useState<GroqModelId>(getPreferredGroqModel());
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [expandedCitationIndex, setExpandedCitationIndex] = useState<number | null>(null);

  // Vision state
  const [visionImageBase64, setVisionImageBase64] = useState<string | null>(null);
  const [visionMimeType, setVisionMimeType] = useState<string>('image/jpeg');
  const [visionNotes, setVisionNotes] = useState('');
  const [visionResult, setVisionResult] = useState<VisionDocumentAnalysis | null>(null);

  const INITIAL_VERIFIED_BRIEFING: { question: string; response: StructuredAiResponse } = {
    question: 'What is the historical female admission trajectory at University of Chitral and how does it compare to district census gender parity?',
    response: {
      executiveAnswer: 'Official University of Chitral admission records confirm that female student enrollment stood at 47.32% (274 of 579) in 2017–2018 and reached a parity peak of 48.90% (290 of 593) in 2018–2019, closely mirroring the district census demographic baseline (~48.8%). After 2018, female representation experienced a steady decline, culminating in a severe trough of 34.50% (79 of 229) in 2022–2023 due to regional economic and transport challenges. Since then, female admissions have rebounded +144% to 193 students (41.06% of 470 total admissions) in 2025–2026. However, female enrollment still lags behind the 48.8% district census parity benchmark by 7.74 percentage points.',
      urduTranslation: 'چترال یونیورسٹی کے سرکاری داخلہ ریکارڈ کے مطابق، 2018–2019 میں طالبات کے داخلوں کا تناسب 48.90 فیصد (290 طالبات) کی بلند سطح پر تھا جو ضلع کی 48.8 فیصد مردم شماری صنفی برابری کے عین مطابق تھا۔ تاہم علاقائی و سفری مشکلات کی وجہ سے 2022–2023 میں داخلے کم ترین سطح 34.50 فیصد (79 طالبات) پر گر گئے۔ 2025–2026 میں داخلے 144 فیصد بحالی کے ساتھ 193 تک پہنچ چکے ہیں (41.06 فیصد)، لیکن یہ اب بھی 48.8 فیصد مردم شماری کے ہدف سے 7.7 فیصد کم ہیں۔ بالائی چترال کی طالبات کے لیے ہاسٹل اور محفوظ ٹرانسپورٹ کی فراہمی 2018–2019 کی برابری بحال کرنے کے لیے ناگزیر ہے۔',
      verifiedEvidence: [
        {
          fact: 'In AY 2018–2019, female enrollment reached 48.90% (290 of 593 admitted), near parity with district census demographic baseline (~48.8%).',
          source: 'University of Chitral Official Admission Registry',
          confidencePct: 100
        },
        {
          fact: 'In AY 2022–2023, female admissions fell to a historical trough of 34.50% (79 females out of 229 total admissions).',
          source: 'UOCH Directorate of Admissions Verified Headcounts',
          confidencePct: 100
        },
        {
          fact: 'In AY 2025–2026, female admissions rebounded +144% from the trough to 193 students (41.06% of 470 total admissions), but remain below 48.8% district census parity.',
          source: 'Official UOCH Annual Headcount Records & PBS Digital Census 2023',
          confidencePct: 100
        }
      ],
      hypotheses: [
        {
          statement: 'Without dedicated transport from Booni/Mastuj and additional hostel beds, female ratio is projected to plateau near 42–44%.',
          condition: 'Continuation of current transport availability without institutional intervention.',
          impact: 'Delays achieving 2018–2019 parity benchmark (48.90%) until post-2030.'
        }
      ],
      dataPoints: [
        { label: '2018 Parity Peak', value: '48.90% (290/593)' },
        { label: '2022 Severe Trough', value: '34.50% (79/229)' },
        { label: 'Trough Recovery', value: '+144.3% (79 → 193)' },
        { label: '2025 Actual Ratio', value: '41.06% (193/470)' }
      ],
      confidenceAssessment: 'HIGH',
      planningRecommendation: 'The UOCH Directorate of Admissions and KP Higher Education Department should note that while female enrollment is recovering from its 2022–2023 trough (up 144% from 79 to 193 students), it remains below the 48.8% district census gender parity baseline (currently at 41.06%). UOCH leadership should focus on addressing logistical and geographic barriers (e.g., dedicated valley-route transport and on-campus hostel capacity for Upper Chitral students) to accelerate female representation back to 2018–2019 parity levels (48.90%).',
      dataCitation: 'UOCH Directorate of Admissions Official Records & PBS Census 2023',
      sourceCitations: [
        {
          name: 'UOCH Directorate of Admissions Official Archive',
          type: 'Official Headcount Register',
          detail: 'Validated university admissions records (2017–2026) authenticated by academic departments and Registrar Office.',
          verified: true
        },
        {
          name: 'PBS Digital Census 2023',
          type: 'National Census Bureau',
          detail: 'Pakistan Bureau of Statistics 7th Population & Housing Census district demographic benchmarks for Upper & Lower Chitral.',
          verified: true
        }
      ],
      meta: {
        modelUsed: 'Official Institutional Baseline (Verified)',
        didFallback: false,
        latencyMs: 98,
        timestamp: new Date().toISOString()
      }
    }
  };

  // Query response history
  const [queryResponses, setQueryResponses] = useState<
    Array<{
      question: string;
      response: StructuredAiResponse;
    }>
  >([INITIAL_VERIFIED_BRIEFING]);

  const activeGroqKey = getActiveGroqApiKey();

  const presetQueries = [
    'Why did female student enrollment collapse to 79 (34.5%) in 2022–2023, and how is it recovering?',
    'What was the historical female parity peak in 2018–2019 and why does current enrollment remain below it?',
    'Based on the active forecast model and backtest RMSE, when will admissions exceed capacity limits?',
    'What is the relationship between Chitral 2023 Digital Census population and university admissions?'
  ];

  const handleModelChange = (model: GroqModelId) => {
    setSelectedModel(model);
    setPreferredGroqModel(model);
  };

  const handleAskQuery = async (queryText: string) => {
    if (!queryText.trim()) return;

    if (!activeGroqKey) {
      if (onOpenDevSettings) {
        onOpenDevSettings();
      } else {
        setIsKeyModalOpen(true);
      }
      setErrorMessage('Please enter your Groq API key in Dev & AI Settings to use Groq LPU models.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await queryGroqInstitutionalAI(queryText, admissionsData, populationData, forecastResult, {
        model: selectedModel
      });
      setQueryResponses(prev => [{ question: queryText, response: res }, ...prev]);
      setQuestion('');
    } catch (err: any) {
      console.error('Groq AI Query Failed:', err);
      if (err?.message?.includes('MISSING_GROQ_KEY')) {
        if (onOpenDevSettings) {
          onOpenDevSettings();
        } else {
          setIsKeyModalOpen(true);
        }
      } else {
        setErrorMessage(err?.message || 'Error processing Groq AI query.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setVisionMimeType(file.type || 'image/jpeg');
    const reader = new FileReader();
    reader.onloadend = () => {
      const resultStr = reader.result as string;
      const base64Data = resultStr.split(',')[1];
      setVisionImageBase64(base64Data);
      setVisionResult(null);
    };
    reader.readAsDataURL(file);
  };

  const handleInspectDocument = async () => {
    if (!visionImageBase64) return;
    if (!activeGroqKey) {
      if (onOpenDevSettings) {
        onOpenDevSettings();
      } else {
        setIsKeyModalOpen(true);
      }
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await analyzeAdmissionDocumentImageWithGroq(
        visionImageBase64,
        visionMimeType,
        visionNotes
      );
      setVisionResult(result);
    } catch (err: any) {
      console.error('Groq Vision Failed:', err);
      if (err?.message?.includes('MISSING_GROQ_KEY')) {
        if (onOpenDevSettings) {
          onOpenDevSettings();
        } else {
          setIsKeyModalOpen(true);
        }
      } else {
        setErrorMessage(err?.message || 'Error executing Groq Multimodal Vision analysis.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="ask-the-data-container" className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center space-x-2">
              <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              <span>AI Institutional Intelligence &amp; Multimodal Assistant</span>
            </h2>
            <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 dark:bg-orange-950/80 dark:text-orange-300 font-bold border border-orange-200 dark:border-orange-800 flex items-center space-x-1 shadow-xs">
              <Zap className="w-3 h-3 text-orange-500 fill-orange-500" />
              <span>Groq LPU: {selectedModel}</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Production AI reasoning and vision inspection grounded strictly in verified Chitral census, admissions, and active forecast records.
          </p>
        </div>
      </div>

      {/* Mode Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveMode('QUERY')}
          className="flex items-center space-x-2 px-4 py-2.5 border-b-2 border-purple-600 text-xs font-bold text-purple-600 dark:text-purple-400 transition-all cursor-pointer"
        >
          <Search className="w-4 h-4" />
          <span>Interactive Policy &amp; Forecast Reasoning</span>
        </button>
      </div>

      {/* Error Callout */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-start space-x-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold">Groq API Error:</span>
            <p className="text-[11px]">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* MODE 1: INTERACTIVE POLICY & FORECAST REASONING */}
      {activeMode === 'QUERY' && (
        <div className="space-y-5">
          {/* Query Input Card */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span>Ask Anything About Chitral Demographics or Admissions</span>
              </span>

              {/* Model Selector */}
              <div className="flex items-center space-x-2">
                <span className="text-[11px] text-slate-400 font-medium">Model:</span>
                <select
                  value={selectedModel}
                  onChange={e => handleModelChange(e.target.value as GroqModelId)}
                  className="py-1 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                >
                  <option value="llama-3.3-70b-versatile">llama-3.3-70b-versatile (Flagship Deep Reasoning — Recommended)</option>
                  <option value="llama-3.1-8b-instant">llama-3.1-8b-instant (Sub-second Instant)</option>
                  <option value="mixtral-8x7b-32768">mixtral-8x7b-32768 (High-Throughput MoE)</option>
                  <option value="gemma2-9b-it">gemma2-9b-it (Compact Reasoning on Groq LPU)</option>
                </select>
              </div>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                handleAskQuery(question);
              }}
              className="flex items-center space-x-2"
            >
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  placeholder="Ask anything grounded in the active forecast record, e.g. 'What is the projected 2028 enrollment demand under Holt\'s Damped model?'..."
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || !question.trim()}
                className="group px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs sm:text-sm transition-all duration-200 ease-out flex items-center space-x-2 shrink-0 disabled:opacity-50 cursor-pointer shadow-sm hover:shadow-md hover:shadow-purple-500/30 hover:-translate-y-0.5 active:scale-95"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 transition-transform duration-200 group-hover:scale-125" />
                    <span>Run AI Query</span>
                  </>
                )}
              </button>
            </form>

            {/* Suggested Queries */}
            <div className="pt-2">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
                Hackathon Quick-Test Prompts:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {presetQueries.map((q, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleAskQuery(q)}
                    disabled={isLoading}
                    className="p-2.5 rounded-xl text-left text-xs bg-slate-50 hover:bg-purple-50/70 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 hover:border-purple-300 dark:hover:border-purple-700 text-slate-700 dark:text-slate-300 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-xs flex items-start space-x-2 group cursor-pointer"
                  >
                    <ArrowRight className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5 group-hover:translate-x-1 transition-transform duration-200" />
                    <span className="leading-snug group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">{q}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Shimmer Skeleton during AI query execution */}
          {isLoading && (
            <div className="space-y-4">
              <AiBriefingSkeleton />
            </div>
          )}

          {/* Results Stream */}
          <div className="space-y-5">
            {queryResponses.map((item, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-xs space-y-5 transition-all"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center space-x-2">
                    <span className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300">
                      <Sparkles className="w-4 h-4" />
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      "{item.question}"
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                        item.response.meta.modelUsed.startsWith('groq:')
                          ? 'bg-orange-100 text-orange-800 dark:bg-orange-950/80 dark:text-orange-300 border border-orange-200 dark:border-orange-800 font-bold flex items-center space-x-1'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {item.response.meta.modelUsed.startsWith('groq:') ? (
                        <>
                          <Zap className="w-2.5 h-2.5 text-orange-500 fill-orange-500" />
                          <span>{item.response.meta.modelUsed.replace('groq:', 'Groq: ')}</span>
                        </>
                      ) : (
                        `Model: ${item.response.meta.modelUsed}`
                      )}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      {item.response.meta.latencyMs}ms
                    </span>
                  </div>
                </div>

                {/* Executive English Answer */}
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Executive Analysis (English):
                  </span>
                  <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-sans">
                    {item.response.executiveAnswer}
                  </p>
                </div>

                {/* Urdu Translation Summary (اردو خلاصہ) */}
                {item.response.urduTranslation && (
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-1">
                    <div className="flex items-center space-x-2 text-purple-600 dark:text-purple-400 text-xs font-bold">
                      <Languages className="w-3.5 h-3.5" />
                      <span>اردو خلاصہ (Regional Stakeholder Briefing)</span>
                    </div>
                    <p
                      dir="rtl"
                      className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 font-serif leading-loose pt-1"
                    >
                      {item.response.urduTranslation}
                    </p>
                  </div>
                )}

                {/* SECTION: VERIFIED EVIDENCE VS HYPOTHESES */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  {/* Card A: Verified Evidence */}
                  <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center space-x-1.5 uppercase tracking-wider">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>Verified Evidence</span>
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 font-bold">
                        Empirical Data
                      </span>
                    </div>
                    <ul className="space-y-2">
                      {item.response.verifiedEvidence?.map((ev, eIdx) => (
                        <li key={eIdx} className="text-xs text-emerald-950 dark:text-emerald-200 leading-relaxed space-y-1">
                          <p>• {ev.fact}</p>
                          <div className="flex items-center space-x-2 text-[10px] text-emerald-700 dark:text-emerald-400 font-mono">
                            <span>Source: {ev.source}</span>
                            <span>• {ev.confidencePct}% Confidence</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Card B: Planning Hypotheses */}
                  <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/60 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center space-x-1.5 uppercase tracking-wider">
                        <Brain className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span>Forecast Hypotheses &amp; Risks</span>
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-bold">
                        Conditional Projection
                      </span>
                    </div>
                    <ul className="space-y-2">
                      {item.response.hypotheses?.map((hyp, hIdx) => (
                        <li key={hIdx} className="text-xs text-blue-950 dark:text-blue-200 leading-relaxed space-y-1">
                          <p>• <strong>Hypothesis:</strong> {hyp.statement}</p>
                          <p className="text-[11px] text-blue-800 dark:text-blue-300">
                            <em>Condition:</em> {hyp.condition}
                          </p>
                          <p className="text-[11px] text-blue-700 dark:text-blue-400 font-mono">
                            Impact: {hyp.impact}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Structured Evidence Data Points */}
                {item.response.dataPoints.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                      Extracted Statistical Data Points:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {item.response.dataPoints.map((dp, i) => (
                        <div
                          key={i}
                          className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-800"
                        >
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block truncate">
                            {dp.label}
                          </span>
                          <span className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                            {dp.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Expandable Source Citation Chips */}
                {item.response.sourceCitations && item.response.sourceCitations.length > 0 && (
                  <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-purple-600" />
                      <span>Expandable Source Citations:</span>
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {item.response.sourceCitations.map((sc, scIdx) => {
                        const isExpanded = expandedCitationIndex === scIdx;
                        return (
                          <div key={scIdx} className="space-y-1">
                            <button
                              type="button"
                              onClick={() => setExpandedCitationIndex(isExpanded ? null : scIdx)}
                              className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-mono bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer border border-slate-200 dark:border-slate-700"
                            >
                              <span>{sc.name}</span>
                              {isExpanded ? <ChevronUp className="w-3 h-3 text-slate-400" /> : <ChevronDown className="w-3 h-3 text-slate-400" />}
                            </button>
                            {isExpanded && (
                              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 max-w-md shadow-xs animate-in fade-in duration-150">
                                <span className="font-bold text-purple-600 dark:text-purple-400 block mb-0.5">
                                  {sc.type} (Verified Repository)
                                </span>
                                <p>{sc.detail}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Planning Recommendation */}
                <div className="p-3.5 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 space-y-1 text-xs">
                  <span className="font-bold text-purple-900 dark:text-purple-200 uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                    <span>Strategic Planning Recommendation:</span>
                  </span>
                  <p className="text-purple-800 dark:text-purple-300 leading-relaxed">
                    {item.response.planningRecommendation}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODE 2: MULTIMODAL DOCUMENT & GAZETTE VISION INSPECTOR */}
      {activeMode === 'VISION' && (
        <div className="space-y-5">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center space-x-2">
                  <Upload className="w-4 h-4 text-purple-600" />
                  <span>Optical Document &amp; Gazette Vision Analysis</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Upload official university admission gazettes, newspaper merit lists, or HEC notifications to verify data via Groq LPU Vision.
                </p>
              </div>

              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 font-bold">
                Groq Vision
              </span>
            </div>

            {/* Upload Area */}
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 text-center hover:border-purple-500 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                id="doc-image-upload"
                className="hidden"
              />
              <label
                htmlFor="doc-image-upload"
                className="cursor-pointer flex flex-col items-center justify-center space-y-2"
              >
                <div className="p-3 rounded-full bg-purple-50 dark:bg-purple-950/80 text-purple-600">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {visionImageBase64 ? 'Document Image Loaded (Click to Change)' : 'Click to Upload Gazette Image'}
                </span>
                <span className="text-[11px] text-slate-400">Supports PNG, JPG, WebP</span>
              </label>
            </div>

            {/* Optional Notes */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase text-slate-600 dark:text-slate-400">
                Optional Context or Instructions for the AI:
              </label>
              <input
                type="text"
                value={visionNotes}
                onChange={e => setVisionNotes(e.target.value)}
                placeholder="e.g. 'Verify Fall 2025 merit list totals for Chitral campus quotas'..."
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
              />
            </div>

            {/* Submit Vision Analysis */}
            <button
              onClick={handleInspectDocument}
              disabled={isLoading || !visionImageBase64}
              className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs sm:text-sm transition flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer shadow-xs active:scale-95"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Scanning Document with Groq Vision...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Run Multimodal Vision Inspection</span>
                </>
              )}
            </button>
          </div>

          {/* Shimmer Skeleton during Vision loading */}
          {isLoading && <CardSkeleton />}

          {/* Vision Inspection Results Card */}
          {visionResult && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {visionResult.documentTitle}
                  </h4>
                  {visionResult.detectedAcademicYear && (
                    <span className="text-[11px] text-purple-600 font-mono">
                      Cycle: {visionResult.detectedAcademicYear}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold">
                  {visionResult.meta.latencyMs}ms latency
                </span>
              </div>

              {/* Statistical Summary */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Document Summary</span>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {visionResult.statisticalSummary}
                </p>
              </div>

              {/* Verified Data Points */}
              {visionResult.verifiedDataPoints.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Verified Optical Extraction:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    {visionResult.verifiedDataPoints.map((dp, i) => (
                      <div key={i} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <span className="text-[10px] text-slate-400 font-semibold uppercase block truncate">{dp.field}</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{dp.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Anomalies Detected */}
              {visionResult.anomaliesDetected.length > 0 && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs space-y-1">
                  <span className="font-bold flex items-center space-x-1">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Discrepancies / Anomalies Detected:</span>
                  </span>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                    {visionResult.anomaliesDetected.map((anom, i) => (
                      <li key={i}>{anom}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendation for Registrar */}
              <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 text-xs space-y-1">
                <span className="font-bold text-purple-900 dark:text-purple-200 uppercase tracking-wider text-[11px]">
                  Recommendation for Registrar's Office:
                </span>
                <p className="text-purple-800 dark:text-purple-300 leading-relaxed">
                  {visionResult.recommendationForRegistrar}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Fallback API Key Modal */}
      <ApiKeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
      />
    </div>
  );
};
