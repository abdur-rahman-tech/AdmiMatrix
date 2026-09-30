export type UserRole = 'OWNER' | 'ADMIN' | 'ANALYST' | 'VIEWER';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  pin: string;
  isOwner: boolean;
  isApproved: boolean;
  department?: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface AccessRequest {
  id: string;
  name: string;
  email: string;
  requestedRole: UserRole;
  department?: string;
  reason: string;
  requestedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewedAt?: string;
  reviewedBy?: string;
}

export type VerificationStatus =
  | 'VERIFIED'
  | 'PUBLIC'
  | 'SAMPLE'
  | 'SYNTHETIC'
  | 'ESTIMATED'
  | 'UNDER_REVIEW'
  | 'MISSING';

export type DistrictScope = 'UPPER_CHITRAL' | 'LOWER_CHITRAL' | 'COMBINED_CHITRAL';

export interface DataSource {
  id: string;
  sourceName: string;
  organization: string;
  publicationYear: number;
  geographicCoverage: DistrictScope;
  methodologyNotes: string;
  sourceUrl: string;
  status: VerificationStatus;
  createdAt: string;
}

export interface PopulationRecord {
  id: string;
  year: number;
  district: DistrictScope;
  totalPopulation: number;
  malePopulation: number;
  femalePopulation: number;
  malePercentage: number;
  femalePercentage: number;
  annualGrowthRate?: number;
  sourceId: string;
  isEstimated?: boolean;
  notes?: string;
}

export interface AdmissionRecord {
  id: string;
  academicYear: string; // e.g. "2024-2025"
  startYear: number;
  endYear: number;
  totalApplicants: number;
  maleApplicants: number;
  femaleApplicants: number;
  totalAdmitted: number;
  maleAdmitted: number;
  femaleAdmitted: number;
  maleAdmissionRatio: number; // percentage (0-100)
  femaleAdmissionRatio: number; // percentage (0-100)
  sourceId: string;
  status: VerificationStatus;
  notes?: string;
}

export type ForecastModelId =
  | 'AUTO'
  | 'HOLT'
  | 'OLS'
  | 'DEMOGRAPHIC'
  | 'MOVING_AVG'
  | 'POLYNOMIAL'
  | 'NAIVE'
  | 'LOGIT'
  | 'ARIMA';

export type ForecastScenario = 'BASELINE' | 'OPTIMISTIC' | 'PESSIMISTIC';

export interface PredictionPoint {
  academicYear: string;
  stepAhead: number;
  // Headcounts
  totalAdmitted: number;
  maleAdmitted: number;
  femaleAdmitted: number;
  // Ratios (0-100%)
  femaleRatio: number;
  maleRatio: number;
  // Prediction Intervals for Ratios
  lowerBound80: number;
  upperBound80: number;
  lowerBound95: number;
  upperBound95: number;
  // Prediction Intervals for Headcounts
  totalLower80: number;
  totalUpper80: number;
  totalLower95: number;
  totalUpper95: number;
  // Scenarios & Capacity
  scenarioAdjustmentPct?: number;
  isCapacityExceeded?: boolean;
}

export interface ModelComparisonItem {
  modelId: ForecastModelId;
  modelName: string;
  algorithm: string;
  mae: number;
  rmse: number;
  mape: number;
  isEligible: boolean;
  notes: string;
  rank?: number;
}

export interface DemographicRatioDetails {
  populationUsed: number;
  historicalEnrollment: number;
  historicalParticipationRatePct: number;
  projectedAnnualPopGrowthRatePct: number;
  projectedParticipationRatePct: number;
  projectedFuturePopulation: number;
  resultingEnrollment: number;
  proxyDisclaimer: string;
}

export interface ModelMetricSummary {
  modelId: string;
  modelName: string;
  algorithm: string;
  trainingPeriod: string;
  validationMethod: string;
  mae: number;
  rmse: number;
  mape: number;
  parameters: Record<string, number | string>;
  notes: string;
}

export interface ForecastResult {
  runId: string;
  modelId: ForecastModelId;
  modelName: string;
  selectedModelId?: ForecastModelId; // In AUTO mode, the model that was selected
  horizonYears: 5 | 6 | 7;
  baseAcademicYear: string;
  historicalPeriod: string;
  forecastPeriod: string;
  scenario: ForecastScenario;
  scenarioMultiplierPct: number;
  planningCapacity: number;
  metrics: ModelMetricSummary;
  predictions: PredictionPoint[];
  modelComparison: ModelComparisonItem[];
  demographicDetails?: DemographicRatioDetails;
  dataQualityWarnings: string[];
  methodology: string;
  limitations: string[];
  generatedAt: string;
}

export interface ValidationError {
  rowNumber?: number;
  fieldName: string;
  severity: 'ERROR' | 'WARNING';
  message: string;
  rejectedValue?: any;
}

export interface DataQualityLog {
  id: string;
  timestamp: string;
  datasetType: 'POPULATION' | 'ADMISSIONS';
  severity: 'ERROR' | 'WARNING';
  message: string;
  rowNumber?: number;
  fieldName?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  role: UserRole;
  action: string;
  targetEntity: string;
  details: string;
}
