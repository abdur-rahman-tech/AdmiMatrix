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
