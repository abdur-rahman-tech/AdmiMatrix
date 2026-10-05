import { AdmissionRecord, PopulationRecord, ForecastResult } from '../../types';
import { StructuredAiResponse } from './aiTypes';
import { GroqModelId, queryGroqInstitutionalAI } from './groqService';

export type AiModelId = GroqModelId;
export type { StructuredAiResponse } from './aiTypes';

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
  options?: { model?: GroqModelId }
): Promise<StructuredAiResponse> {
  return queryGroqInstitutionalAI(question, admissions, population, forecast, options);
}

export async function analyzeAdmissionDocumentImage(
  _imageBase64: string,
  _mimeType: string,
  _notes: string
): Promise<VisionDocumentAnalysis> {
  throw new Error('Image analysis is not supported by the configured Groq text models.');
}
