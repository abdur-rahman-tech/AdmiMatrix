import React, { useState } from 'react';
import {
  HelpCircle,
  Search,
  Sparkles,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  MessageSquareQuote
} from 'lucide-react';
import { AdmissionRecord, PopulationRecord, ForecastResult } from '../../types';
import { answerDataQuery, QueryAnswer } from '../../lib/nlp/dataQueryEngine';

interface AskTheDataProps {
  admissionsData: AdmissionRecord[];
  populationData: PopulationRecord[];
  forecastResult: ForecastResult | null;
}

export const AskTheData: React.FC<AskTheDataProps> = ({
  admissionsData,
  populationData,
  forecastResult
}) => {
  const [question, setQuestion] = useState('');
  const [history, setHistory] = useState<QueryAnswer[]>([
    answerDataQuery('What was the female admission ratio in 2024?', admissionsData, populationData, forecastResult),
    answerDataQuery('How has female admission changed over time?', admissionsData, populationData, forecastResult)
  ]);

  const presetQuestions = [
    'What was the female admission ratio in 2024?',
    'How has female admission changed over time?',
    'What does the model estimate for the next five years?',
    'Which year had the largest change in female admission?',
    'What was the total population of Chitral in the 2023 Digital Census?',
    'What is the projected admission ratio for 2030?'
  ];

  const handleAsk = (queryText: string) => {
    if (!queryText.trim()) return;
    const answer = answerDataQuery(queryText, admissionsData, populationData, forecastResult);
    setHistory(prev => [answer, ...prev]);
    setQuestion('');
  };

  return (
    <div id="ask-the-data-container" className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200 dark:border-slate-800">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center space-x-2">
          <HelpCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          <span>Ask the Data — Institutional Query Assistant</span>
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Section 17: Evidence-grounded natural language answering strictly bound to verified Chitral population and admission records.
        </p>
      </div>

      {/* Query Input Box */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk(question);
          }}
          className="flex items-center space-x-2"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder="Ask anything (e.g. 'What was female admission in 2024?', 'How has female ratio grown?')..."
              className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm transition flex items-center space-x-1.5 shrink-0 cursor-pointer"
          >
            <span>Query</span>
          </button>
        </form>

        {/* Suggested Queries */}
        <div className="pt-2">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
            Suggested Queries:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {presetQuestions.map((q, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleAsk(q)}
                className="px-2.5 py-1 rounded-md text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition text-left"
              >
                "{q}"
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Query Answers Stream */}
      <div className="space-y-4">
        {history.map((item, idx) => (
          <div
            key={idx}
            className={`p-5 rounded-xl border shadow-xs transition ${
              item.found
                ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <MessageSquareQuote className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Question: "{item.question}"</span>
              </div>
              {item.found ? (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800">
                  GROUNDED DATA
                </span>
              ) : (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 font-semibold">
                  NOT IN DATABASE
                </span>
              )}
            </div>

            <p className="text-sm font-medium text-slate-900 dark:text-white mt-3 leading-relaxed">
              {item.answer}
            </p>

            {/* Structured Data Points if available */}
            {item.dataPoints && (
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2">
                {Object.entries(item.dataPoints).map(([key, val]) => (
                  <div key={key} className="p-2 rounded bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">{key}</span>
                    <span className="text-xs font-bold font-mono text-slate-800 dark:text-slate-200">{val}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Citation Label */}
            {item.citation && (
              <div className="mt-3 pt-2 text-[11px] text-slate-400 font-mono flex items-center space-x-1">
                <span>Citation:</span>
                <span className="text-slate-600 dark:text-slate-300 font-medium">{item.citation}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
