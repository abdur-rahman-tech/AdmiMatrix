import Papa from 'papaparse';
import { AdmissionRecord, PopulationRecord, ValidationError } from '../../types';

export interface AdmissionValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  records: AdmissionRecord[];
  summary: {
    totalRows: number;
    validRows: number;
    errorCount: number;
    warningCount: number;
  };
}

export interface PopulationValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  records: PopulationRecord[];
  summary: {
    totalRows: number;
    validRows: number;
    errorCount: number;
    warningCount: number;
  };
}

/**
 * Validates a single Admission record against domain integrity rules.
 */
export function validateAdmissionRecord(
  record: Partial<AdmissionRecord>,
  rowNum: number,
  existingYears: Set<string>
): { errors: ValidationError[]; warnings: ValidationError[] } {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // 1. Academic Year Format Check
  if (!record.academicYear) {
    errors.push({
      rowNumber: rowNum,
      fieldName: 'academicYear',
      severity: 'ERROR',
      message: 'Missing required field: Academic Year.'
    });
  } else {
    const regex = /^\d{4}-\d{4}$/;
    if (!regex.test(record.academicYear)) {
      errors.push({
        rowNumber: rowNum,
        fieldName: 'academicYear',
        severity: 'ERROR',
        message: `Invalid academic year format "${record.academicYear}". Expected format YYYY-YYYY (e.g. 2024-2025).`,
        rejectedValue: record.academicYear
      });
    } else {
      const [start, end] = record.academicYear.split('-').map(Number);
      if (end !== start + 1) {
        errors.push({
          rowNumber: rowNum,
          fieldName: 'academicYear',
          severity: 'ERROR',
          message: `Academic year span is invalid: ${record.academicYear}. End year must be start year + 1.`,
          rejectedValue: record.academicYear
        });
      }
      if (existingYears.has(record.academicYear)) {
        errors.push({
          rowNumber: rowNum,
          fieldName: 'academicYear',
          severity: 'ERROR',
          message: `Duplicate record for academic year ${record.academicYear}.`,
          rejectedValue: record.academicYear
        });
      }
    }
  }

  // 2. Headcount validity & Non-negativity
  const fieldsToCheck: (keyof AdmissionRecord)[] = [
    'totalApplicants',
    'maleApplicants',
    'femaleApplicants',
    'totalAdmitted',
    'maleAdmitted',
    'femaleAdmitted'
  ];

  for (const field of fieldsToCheck) {
    const val = record[field];
    if (val === undefined || val === null || isNaN(val as number)) {
      errors.push({
        rowNumber: rowNum,
        fieldName: field,
        severity: 'ERROR',
        message: `Missing or non-numeric value for field "${field}".`
      });
    } else if ((val as number) < 0) {
      errors.push({
        rowNumber: rowNum,
        fieldName: field,
        severity: 'ERROR',
        message: `Field "${field}" cannot be negative (${val}).`,
        rejectedValue: val
      });
    }
  }

  // 3. Mathematical Sum Balancing: Male + Female admitted == Total admitted
  if (
    record.maleAdmitted !== undefined &&
    record.femaleAdmitted !== undefined &&
    record.totalAdmitted !== undefined
  ) {
    const sumAdmitted = Number(record.maleAdmitted) + Number(record.femaleAdmitted);
    if (sumAdmitted !== Number(record.totalAdmitted)) {
      errors.push({
        rowNumber: rowNum,
        fieldName: 'totalAdmitted',
        severity: 'ERROR',
        message: `Gender admission totals do not match total admissions: Male (${record.maleAdmitted}) + Female (${record.femaleAdmitted}) = ${sumAdmitted}, but total was recorded as ${record.totalAdmitted}.`,
        rejectedValue: record.totalAdmitted
      });
    }
  }

  // 4. Mathematical Sum Balancing: Male + Female applicants == Total applicants
  if (
    record.maleApplicants !== undefined &&
    record.femaleApplicants !== undefined &&
    record.totalApplicants !== undefined
  ) {
    const sumApplicants = Number(record.maleApplicants) + Number(record.femaleApplicants);
    if (sumApplicants !== Number(record.totalApplicants)) {
      errors.push({
        rowNumber: rowNum,
        fieldName: 'totalApplicants',
        severity: 'ERROR',
        message: `Gender applicant totals do not match total applicants: Male (${record.maleApplicants}) + Female (${record.femaleApplicants}) = ${sumApplicants}, but total was recorded as ${record.totalApplicants}.`,
        rejectedValue: record.totalApplicants
      });
    }
  }

  // 5. Capacity Check: Admitted cannot exceed Applicants
  if (
    record.totalAdmitted !== undefined &&
    record.totalApplicants !== undefined &&
    record.totalAdmitted > record.totalApplicants
  ) {
    errors.push({
      rowNumber: rowNum,
      fieldName: 'totalAdmitted',
      severity: 'ERROR',
      message: `Total admitted (${record.totalAdmitted}) exceeds applicant pool (${record.totalApplicants}).`,
      rejectedValue: record.totalAdmitted
    });
  }

  // 6. Warning on unusual single-year ratio shifts (> 15% delta)
  if (record.femaleAdmissionRatio !== undefined && (record.femaleAdmissionRatio < 10 || record.femaleAdmissionRatio > 90)) {
    warnings.push({
      rowNumber: rowNum,
      fieldName: 'femaleAdmissionRatio',
      severity: 'WARNING',
      message: `Extreme female admission ratio detected (${record.femaleAdmissionRatio}%). Please double-check source documentation.`
    });
  }

  return { errors, warnings };
}

/**
 * Validates a CSV string containing Admission records.
 */
export function validateAdmissionCSV(csvContent: string): AdmissionValidationResult {
  const parseResult = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true
  });

  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  const validatedRecords: AdmissionRecord[] = [];
  const seenYears = new Set<string>();

  if (parseResult.errors.length > 0) {
    parseResult.errors.forEach(e => {
      errors.push({
        rowNumber: e.row,
        fieldName: 'CSV_FORMAT',
        severity: 'ERROR',
        message: `CSV Syntax Error: ${e.message}`
      });
    });
  }

  const rows = parseResult.data as Record<string, any>[];

  rows.forEach((row, index) => {
    const rowNum = index + 2; // account for header row + 1-indexed

    const academicYear = String(row.academic_year || row.academicYear || row.year || '').trim();
    const totalApplicants = Number(row.total_applicants ?? row.totalApplicants ?? 0);
    const maleApplicants = Number(row.male_applicants ?? row.maleApplicants ?? 0);
    const femaleApplicants = Number(row.female_applicants ?? row.femaleApplicants ?? 0);
    const totalAdmitted = Number(row.total_admitted ?? row.totalAdmitted ?? 0);
    const maleAdmitted = Number(row.male_admitted ?? row.maleAdmitted ?? 0);
    const femaleAdmitted = Number(row.female_admitted ?? row.femaleAdmitted ?? 0);
    const notes = String(row.notes || '');

    const femaleRatio = totalAdmitted > 0 ? Number(((femaleAdmitted / totalAdmitted) * 100).toFixed(2)) : 0;
    const maleRatio = totalAdmitted > 0 ? Number((100.0 - femaleRatio).toFixed(2)) : 0;

    const startYear = parseInt(academicYear.split('-')[0] || '0', 10);
    const endYear = parseInt(academicYear.split('-')[1] || '0', 10);

    const record: Partial<AdmissionRecord> = {
      academicYear,
      startYear,
      endYear,
      totalApplicants,
      maleApplicants,
      femaleApplicants,
      totalAdmitted,
      maleAdmitted,
      femaleAdmitted,
      femaleAdmissionRatio: femaleRatio,
      maleAdmissionRatio: maleRatio,
      sourceId: String(row.source_id || 'src-manual-import'),
      status: 'VERIFIED',
      notes
    };

    const validation = validateAdmissionRecord(record, rowNum, seenYears);
    errors.push(...validation.errors);
    warnings.push(...validation.warnings);

    if (academicYear) {
      seenYears.add(academicYear);
    }

    if (validation.errors.length === 0) {
      validatedRecords.push({
        id: `adm-import-${Date.now()}-${index}`,
        academicYear,
        startYear,
        endYear,
        totalApplicants,
        maleApplicants,
        femaleApplicants,
        totalAdmitted,
        maleAdmitted,
        femaleAdmitted,
        femaleAdmissionRatio: femaleRatio,
        maleAdmissionRatio: maleRatio,
        sourceId: record.sourceId || 'src-manual-import',
        status: 'VERIFIED',
        notes
      });
    }
  });

  // Timeline Continuity & Gap Detection across batches
  if (validatedRecords.length > 1) {
    const sorted = [...validatedRecords].sort((a, b) => a.startYear - b.startYear);
    for (let i = 1; i < sorted.length; i++) {
      const prevStart = sorted[i - 1].startYear;
      const currStart = sorted[i].startYear;
      if (currStart > prevStart + 1) {
        const missing: string[] = [];
        for (let y = prevStart + 1; y < currStart; y++) {
          missing.push(`${y}-${y + 1}`);
        }
        warnings.push({
          rowNumber: i + 1,
          fieldName: 'TIMELINE_GAP',
          severity: 'WARNING',
          message: `Discontinuous timeline detected between ${sorted[i - 1].academicYear} and ${sorted[i].academicYear}. Missing academic cycles: ${missing.join(', ')}.`
        });
      }
    }
  }

  return {
    isValid: errors.length === 0 && validatedRecords.length > 0,
    errors,
    warnings,
    records: validatedRecords,
    summary: {
      totalRows: rows.length,
      validRows: validatedRecords.length,
      errorCount: errors.length,
      warningCount: warnings.length
    }
  };
}

/**
 * Validates a single Population record against demographic domain rules.
 */
export function validatePopulationRecord(
  record: Partial<PopulationRecord>,
  rowNum: number,
  existingKeys: Set<string>
): { errors: ValidationError[]; warnings: ValidationError[] } {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // 1. Year Validation
  if (!record.year) {
    errors.push({
      rowNumber: rowNum,
      fieldName: 'year',
      severity: 'ERROR',
      message: 'Census / Survey Year is required.'
    });
  } else if (record.year < 1900 || record.year > 2100) {
    errors.push({
      rowNumber: rowNum,
      fieldName: 'year',
      severity: 'ERROR',
      message: `Invalid year ${record.year}. Year must be between 1900 and 2100.`,
      rejectedValue: record.year
    });
  }

  // 2. District Scope Validation
  const validDistricts = ['UPPER_CHITRAL', 'LOWER_CHITRAL', 'COMBINED_CHITRAL'];
  if (!record.district || !validDistricts.includes(record.district)) {
    errors.push({
      rowNumber: rowNum,
      fieldName: 'district',
      severity: 'ERROR',
      message: `Invalid or missing district scope: "${record.district}". Must be UPPER_CHITRAL, LOWER_CHITRAL, or COMBINED_CHITRAL.`,
      rejectedValue: record.district
    });
  }

  // 3. Uniqueness Check (Year + District combination)
  const key = `${record.year}-${record.district}`;
  if (existingKeys.has(key)) {
    errors.push({
      rowNumber: rowNum,
      fieldName: 'year',
      severity: 'ERROR',
      message: `Duplicate entry: A record for Year ${record.year} in district "${record.district}" already exists.`,
      rejectedValue: key
    });
  }

  // 4. Positive population numbers
  if (record.totalPopulation === undefined || record.totalPopulation <= 0) {
    errors.push({
      rowNumber: rowNum,
      fieldName: 'totalPopulation',
      severity: 'ERROR',
      message: 'Total population must be a positive integer greater than zero.',
      rejectedValue: record.totalPopulation
    });
  }

  if (record.malePopulation === undefined || record.malePopulation < 0) {
    errors.push({
      rowNumber: rowNum,
      fieldName: 'malePopulation',
      severity: 'ERROR',
      message: 'Male population cannot be negative.',
      rejectedValue: record.malePopulation
    });
  }

  if (record.femalePopulation === undefined || record.femalePopulation < 0) {
    errors.push({
      rowNumber: rowNum,
      fieldName: 'femalePopulation',
      severity: 'ERROR',
      message: 'Female population cannot be negative.',
      rejectedValue: record.femalePopulation
    });
  }

  // 5. Gender Sum Check
  if (
    record.malePopulation !== undefined &&
    record.femalePopulation !== undefined &&
    record.totalPopulation !== undefined
  ) {
    const sum = record.malePopulation + record.femalePopulation;
    if (Math.abs(sum - record.totalPopulation) > 5) {
      warnings.push({
        rowNumber: rowNum,
        fieldName: 'totalPopulation',
        severity: 'WARNING',
        message: `Sum of male (${record.malePopulation}) and female (${record.femalePopulation}) = ${sum}, which differs from total (${record.totalPopulation}).`
      });
    }
  }

  return { errors, warnings };
}

/**
 * Validates a CSV string containing Population records.
 */
export function validatePopulationCSV(csvContent: string): PopulationValidationResult {
  const parseResult = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true
  });

  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  const validatedRecords: PopulationRecord[] = [];
  const seenKeys = new Set<string>();

  if (parseResult.errors.length > 0) {
    parseResult.errors.forEach(e => {
      errors.push({
        rowNumber: e.row,
        fieldName: 'CSV_FORMAT',
        severity: 'ERROR',
        message: `CSV Syntax Error: ${e.message}`
      });
    });
  }

  const rows = parseResult.data as Record<string, any>[];

  rows.forEach((row, index) => {
    const rowNum = index + 2;

    const year = Number(row.year || row.census_year || 0);
    const districtRaw = String(row.district || 'COMBINED_CHITRAL').toUpperCase().trim();
    let district: any = 'COMBINED_CHITRAL';
    if (districtRaw.includes('UPPER')) district = 'UPPER_CHITRAL';
    else if (districtRaw.includes('LOWER')) district = 'LOWER_CHITRAL';
    else district = 'COMBINED_CHITRAL';

    const totalPopulation = Number(row.total_population ?? row.totalPopulation ?? row.total ?? 0);
    const malePopulation = Number(row.male_population ?? row.malePopulation ?? row.male ?? 0);
    const femalePopulation = Number(row.female_population ?? row.femalePopulation ?? row.female ?? 0);
    const annualGrowthRate = row.growth_rate !== undefined ? Number(row.growth_rate) : (row.annualGrowthRate !== undefined ? Number(row.annualGrowthRate) : undefined);
    const isEstimated = Boolean(row.is_estimated ?? row.isEstimated ?? false);
    const notes = String(row.notes || '');

    const malePercentage = totalPopulation > 0 ? Number(((malePopulation / totalPopulation) * 100).toFixed(2)) : 0;
    const femalePercentage = totalPopulation > 0 ? Number(((femalePopulation / totalPopulation) * 100).toFixed(2)) : 0;

    const record: Partial<PopulationRecord> = {
      year,
      district,
      totalPopulation,
      malePopulation,
      femalePopulation,
      malePercentage,
      femalePercentage,
      annualGrowthRate,
      isEstimated,
      sourceId: String(row.source_id || 'src-pbs-census'),
      notes
    };

    const validation = validatePopulationRecord(record, rowNum, seenKeys);
    errors.push(...validation.errors);
    warnings.push(...validation.warnings);

    const key = `${year}-${district}`;
    if (year) seenKeys.add(key);

    if (validation.errors.length === 0) {
      validatedRecords.push({
        id: `pop-import-${Date.now()}-${index}`,
        year,
        district,
        totalPopulation,
        malePopulation,
        femalePopulation,
        malePercentage,
        femalePercentage,
        annualGrowthRate,
        isEstimated,
        sourceId: record.sourceId || 'src-pbs-census',
        notes
      });
    }
  });

  return {
    isValid: errors.length === 0 && validatedRecords.length > 0,
    errors,
    warnings,
    records: validatedRecords,
    summary: {
      totalRows: rows.length,
      validRows: validatedRecords.length,
      errorCount: errors.length,
      warningCount: warnings.length
    }
  };
}
