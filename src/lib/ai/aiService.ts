import { AdmissionRecord, PopulationRecord, ForecastResult } from '../../types';
import { StructuredAiResponse } from './aiTypes';
import {
  GroqModelId,
  GROQ_MODELS,
  getPreferredGroqModel,
  setPreferredGroqModel,
  getPreferredModel,
  setPreferredModel,
  getGroqApiKey,
  setGroqApiKey,
  clearGroqApiKey,
  saveGroqApiKey,
  testGroqConnection,
  queryGroqInstitutionalAI
} from './groqService';

export type AiModelId = GroqModelId;
export type { StructuredAiResponse } from './aiTypes';
export type { GroqModelId };
export {
  GROQ_MODELS,
  getPreferredGroqModel,
  setPreferredGroqModel,
  getPreferredModel,
  setPreferredModel,
  getGroqApiKey,
  setGroqApiKey,
  clearGroqApiKey,
  saveGroqApiKey,
  testGroqConnection,
  queryGroqInstitutionalAI
};

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

export function queryInstitutionalAI(
  question: string,
  admissions: AdmissionRecord[],
  population: PopulationRecord[],
  forecast: ForecastResult | null,
  options?: { model?: GroqModelId; preferredModel?: string }
): Promise<StructuredAiResponse> {
  const modelToUse = (options?.model || (options?.preferredModel as GroqModelId) || getPreferredGroqModel());
  return queryGroqInstitutionalAI(question, admissions, population, forecast, { model: modelToUse });
}

export async function analyzeAdmissionDocumentImage(
  _imageBase64: string,
  _mimeType: string,
  _notes: string
): Promise<VisionDocumentAnalysis> {
  throw new Error('Image analysis was removed in favor of high-speed Groq LPU text and mathematical reasoning.');
}
