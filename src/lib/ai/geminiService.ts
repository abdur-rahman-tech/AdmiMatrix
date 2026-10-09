import { AdmissionRecord, PopulationRecord, ForecastResult } from '../../types';

export const GEMINI_MODEL_ID = 'gemini-2.5-flash';

export interface VerifiedEvidenceItem {
  fact: string;
  source: string;
  confidencePct: number;
}

export interface HypothesisItem {
  statement: string;
  condition: string;
  impact: string;
}

export interface SourceCitationItem {
  name: string;
  type: string;
  detail: string;
  verified: boolean;
}

export interface StructuredAiResponse {
  executiveAnswer: string;
  urduTranslation?: string;
  verifiedEvidence: VerifiedEvidenceItem[];
  hypotheses: HypothesisItem[];
  dataPoints: Array<{ label: string; value: string }>;
  confidenceAssessment: 'HIGH' | 'MEDIUM' | 'CONDITIONAL';
  planningRecommendation: string;
  dataCitation: string;
  sourceCitations: SourceCitationItem[];
  meta: {
    modelUsed: string;
    didFallback: boolean;
    latencyMs: number;
    timestamp: string;
  };
}

export interface VisionDocumentAnalysis {
  documentTitle: string;
  detectedAcademicYear?: string;
  verifiedDataPoints: Array<{ field: string; value: string }>;
  statisticalSummary: string;
  anomaliesDetected: string[];
  recommendationForRegistrar: string;
  meta: {
    modelUsed: string;
    latencyMs: number;
  };
}

export function buildForecastGroundingContext(
  admissions: AdmissionRecord[],
  population: PopulationRecord[],
  currentForecast: ForecastResult | null
): string {
  const admissionRows = [...admissions]
    .sort((a, b) => a.startYear - b.startYear)
    .map(record =>
      `${record.academicYear}: total admitted=${record.totalAdmitted}, male=${record.maleAdmitted}, female=${record.femaleAdmitted}, applicants=${record.totalApplicants}.`
    )
    .join('\n');
  const populationRows = [...population]
    .sort((a, b) => a.year - b.year)
    .map(record =>
      `${record.year} ${record.district}: population=${record.totalPopulation}, male=${record.malePopulation ?? 'not provided'}, female=${record.femalePopulation ?? 'not provided'}.`
    )
    .join('\n');

  const forecast = currentForecast
    ? `Model: ${currentForecast.modelName} (${currentForecast.selectedModelId || currentForecast.modelId})
Academic year baseline: ${currentForecast.baseAcademicYear}
Forecast period: ${currentForecast.forecastPeriod}
Scenario: ${currentForecast.scenario}
Planning capacity: ${currentForecast.planningCapacity}
Validation MAE: ${currentForecast.metrics.mae}; RMSE: ${currentForecast.metrics.rmse}; MAPE: ${currentForecast.metrics.mape}%
Predictions:
${currentForecast.predictions.map(prediction =>
    `${prediction.academicYear}: total=${prediction.totalAdmitted}, male=${prediction.maleAdmitted}, female=${prediction.femaleAdmitted}, interval=${prediction.totalLower95}-${prediction.totalUpper95}, capacity exceeded=${Boolean(prediction.isCapacityExceeded)}`
  ).join('\n')}`
    : 'No active forecast is available.';

  return `University of Chitral (UOCH), Chitral, Khyber Pakhtunkhwa, Pakistan.
PBS 2023 Chitral district population baseline: approximately 553,526.

VERIFIED ADMISSIONS:
${admissionRows}

POPULATION CENSUS:
${populationRows}

ACTIVE LOCALLY-COMPUTED FORECAST:
${forecast}`;
}

async function requestGemini(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string | Array<{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }> }>,
  responseFormat = true
): Promise<{ text: string; latencyMs: number }> {
  const startedAt = Date.now();
  const response = await fetch('/api/ai/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: GEMINI_MODEL_ID,
      messages,
      temperature: 0.1,
      max_tokens: 4096,
      ...(responseFormat ? { response_format: { type: 'json_object' } } : {})
    })
  });

  const result = await response.json();
  if (!response.ok) {
    const errorCode = result.code ? `${result.code}: ` : '';
    throw new Error(`${errorCode}${result.error || `Gemini API request failed (${response.status}).`}`);
  }

  const text = result.choices?.[0]?.message?.content;
  if (typeof text !== 'string' || !text.trim()) {
    throw new Error('Gemini returned an empty completion response.');
  }

  return { text: text.trim(), latencyMs: Date.now() - startedAt };
}

function parseJsonResponse(text: string): Record<string, any> {
  try {
    return JSON.parse(text);
  } catch {
    const cleaned = text.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace < 0 || lastBrace <= firstBrace) {
      throw new Error('Gemini returned an invalid JSON response.');
    }
    return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
  }
}

export async function queryGeminiInstitutionalAI(
  question: string,
  admissions: AdmissionRecord[],
  population: PopulationRecord[],
  currentForecast: ForecastResult | null
): Promise<StructuredAiResponse> {
  const context = buildForecastGroundingContext(admissions, population, currentForecast);
  const { text, latencyMs } = await requestGemini([
    {
      role: 'system',
      content: `You are the University of Chitral institutional planning assistant. Only use the context supplied by the application. Never invent or recalculate forecasts, metrics, or historical numbers; clearly distinguish verified records from projections. Include a natural Urdu summary and cite PBS census and UOCH records when relevant. Return only a valid JSON object with executiveAnswer, urduTranslation, verifiedEvidence (fact, source, confidencePct), hypotheses (statement, condition, impact), dataPoints (label, value), confidenceAssessment (HIGH, MEDIUM, or CONDITIONAL), planningRecommendation, dataCitation, and sourceCitations (name, type, detail, verified).`
    },
    {
      role: 'user',
      content: `Question: ${question}\n\nUse this application data as the only source of numerical facts:\n${context}`
    }
  ]);
  const parsed = parseJsonResponse(text);

  return {
    executiveAnswer: typeof parsed.executiveAnswer === 'string' ? parsed.executiveAnswer : '',
    urduTranslation: typeof parsed.urduTranslation === 'string' ? parsed.urduTranslation : undefined,
    verifiedEvidence: Array.isArray(parsed.verifiedEvidence) ? parsed.verifiedEvidence : [],
    hypotheses: Array.isArray(parsed.hypotheses) ? parsed.hypotheses : [],
    dataPoints: Array.isArray(parsed.dataPoints) ? parsed.dataPoints : [],
    confidenceAssessment: ['HIGH', 'MEDIUM', 'CONDITIONAL'].includes(parsed.confidenceAssessment)
      ? parsed.confidenceAssessment
      : 'CONDITIONAL',
    planningRecommendation: typeof parsed.planningRecommendation === 'string' ? parsed.planningRecommendation : '',
    dataCitation: typeof parsed.dataCitation === 'string' ? parsed.dataCitation : 'UOCH records / PBS Census 2023',
    sourceCitations: Array.isArray(parsed.sourceCitations) ? parsed.sourceCitations : [],
    meta: {
      modelUsed: `gemini:${GEMINI_MODEL_ID}`,
      didFallback: false,
      latencyMs,
      timestamp: new Date().toISOString()
    }
  };
}

export async function analyzeAdmissionDocumentImageWithGemini(
  imageBase64: string,
  mimeType: string,
  userNotes?: string
): Promise<VisionDocumentAnalysis> {
  const prompt = `Inspect this University of Chitral / Chitral higher-education admissions document.
${userNotes ? `Additional context: ${userNotes}` : ''}
Return JSON with documentTitle, detectedAcademicYear, verifiedDataPoints (field, value), statisticalSummary, anomaliesDetected, and recommendationForRegistrar. Do not infer unclear data.`;
  const { text, latencyMs } = await requestGemini([{
    role: 'user',
    content: [
      { type: 'text', text: prompt },
      {
        type: 'image_url',
        image_url: { url: `data:${mimeType || 'image/jpeg'};base64,${imageBase64}` }
      }
    ]
  }]);
  const parsed = parseJsonResponse(text);

  return {
    documentTitle: parsed.documentTitle || 'Unclassified Institutional Document',
    detectedAcademicYear: parsed.detectedAcademicYear,
    verifiedDataPoints: Array.isArray(parsed.verifiedDataPoints) ? parsed.verifiedDataPoints : [],
    statisticalSummary: parsed.statisticalSummary || '',
    anomaliesDetected: Array.isArray(parsed.anomaliesDetected) ? parsed.anomaliesDetected : [],
    recommendationForRegistrar: parsed.recommendationForRegistrar || '',
    meta: { modelUsed: `gemini:${GEMINI_MODEL_ID}`, latencyMs }
  };
}
