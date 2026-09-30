import React, { useState, useMemo } from 'react';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Search,
  Filter,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  X,
  Calendar,
  MapPin,
  TrendingUp,
  Percent,
  FileSpreadsheet,
  RotateCcw,
  Copy,
  Sparkles
} from 'lucide-react';
import { PopulationRecord, DataSource, DistrictScope, AuditLog, UserRole } from '../../types';
import { validatePopulationRecord, validatePopulationCSV } from '../../lib/validation/dataValidator';
import { INITIAL_POPULATION_DATA } from '../../data/defaultDatasets';

interface PopulationCRUDProps {
  populationData: PopulationRecord[];
  setPopulationData: React.Dispatch<React.SetStateAction<PopulationRecord[]>>;
  dataSources: DataSource[];
  setAuditLogs: React.Dispatch<React.SetStateAction<AuditLog[]>>;
  userRole: UserRole;
  currentUserName: string;
}

export const PopulationCRUD: React.FC<PopulationCRUDProps> = ({
  populationData,
  setPopulationData,
  dataSources,
  setAuditLogs,
  userRole,
  currentUserName
}) => {
  // Filters and Search
  const [searchTerm, setSearchTerm] = useState('');
  const [districtFilter, setDistrictFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'CENSUS' | 'ESTIMATED'>('ALL');
  const [sortOrder, setSortOrder] = useState<'YEAR_DESC' | 'YEAR_ASC' | 'POP_DESC'>('YEAR_DESC');

  // Modals & Forms
  const [populationSubTab, setPopulationSubTab] = useState<'RECORDS' | 'INGESTION'>('RECORDS');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PopulationRecord | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<PopulationRecord | null>(null);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [selectedBaselineId, setSelectedBaselineId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'info'; text: string } | null>(null);

  // Form Fields for Add / Edit
  const [formYear, setFormYear] = useState<string>('2025');
  const [formDistrict, setFormDistrict] = useState<DistrictScope>('COMBINED_CHITRAL');
  const [formMale, setFormMale] = useState<string>('282500');
  const [formFemale, setFormFemale] = useState<string>('275200');
  const [formTotal, setFormTotal] = useState<string>('557700');
  const [formGrowthRate, setFormGrowthRate] = useState<string>('1.85');
  const [formIsEstimated, setFormIsEstimated] = useState<boolean>(true);
  const [formSourceId, setFormSourceId] = useState<string>('src-pbs-census');
  const [formNotes, setFormNotes] = useState<string>('Official annual intercensal population projection.');
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [formWarnings, setFormWarnings] = useState<string[]>([]);
  const [manualSuccessMsg, setManualSuccessMsg] = useState<string | null>(null);

  // CSV Ingestion State
  const [csvContent, setCsvContent] = useState('');
  const [csvReport, setCsvReport] = useState<ReturnType<typeof validatePopulationCSV> | null>(null);
  const [csvSuccessMsg, setCsvSuccessMsg] = useState<string | null>(null);

  // File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      setCsvContent(content);
      const report = validatePopulationCSV(content);
      setCsvReport(report);
      setCsvSuccessMsg(null);
    };
    reader.readAsText(file);
  };

  // Sample Presets for Ingestion Testing
  const loadSampleValidCSV = () => {
    const sample = `year,district,total_population,male_population,female_population,growth_rate,is_estimated,source_id,notes
2025,COMBINED_CHITRAL,557700,282500,275200,1.85,true,src-pbs-census,Official annual intercensal population projection
2026,COMBINED_CHITRAL,568000,287700,280300,1.85,true,src-pbs-census,Mid-term demographic forecast model
2027,COMBINED_CHITRAL,578500,293000,285500,1.85,true,src-pbs-census,Projected demographic threshold for higher education`;
    setCsvContent(sample);
    setCsvReport(validatePopulationCSV(sample));
    setCsvSuccessMsg(null);
  };

  const loadSampleErroneousCSV = () => {
    const corrupted = `year,district,total_population,male_population,female_population,growth_rate,is_estimated,source_id,notes
1820,COMBINED_CHITRAL,500000,250000,250000,1.5,true,src-pbs-census,Error: Historical year precedes operational boundary
2028,UNKNOWN_VALLEY,600000,300000,300000,1.8,true,src-pbs-census,Error: Invalid district scope UNKNOWN_VALLEY
2029,COMBINED_CHITRAL,620000,250000,250000,1.8,true,src-pbs-census,Error: Gender sum imbalance: 250000 + 250000 != 620000`;
    setCsvContent(corrupted);
    setCsvReport(validatePopulationCSV(corrupted));
    setCsvSuccessMsg(null);
  };

  // Auto-calculate total and ratios when male/female change in form
  const handleMaleChange = (val: string) => {
    setFormMale(val);
    const m = parseInt(val, 10) || 0;
    const f = parseInt(formFemale, 10) || 0;
    setFormTotal((m + f).toString());
  };

  const handleFemaleChange = (val: string) => {
    setFormFemale(val);
    const m = parseInt(formMale, 10) || 0;
    const f = parseInt(val, 10) || 0;
    setFormTotal((m + f).toString());
  };

  const calculatedMalePct = useMemo(() => {
    const tot = parseInt(formTotal, 10) || 0;
    const m = parseInt(formMale, 10) || 0;
    return tot > 0 ? ((m / tot) * 100).toFixed(2) : '50.00';
  }, [formMale, formTotal]);

  const calculatedFemalePct = useMemo(() => {
    const tot = parseInt(formTotal, 10) || 0;
    const f = parseInt(formFemale, 10) || 0;
    return tot > 0 ? ((f / tot) * 100).toFixed(2) : '50.00';
  }, [formFemale, formTotal]);

  // Open Edit Modal
  const handleOpenEdit = (rec: PopulationRecord) => {
    setEditingRecord(rec);
    setFormYear(rec.year.toString());
    setFormDistrict(rec.district);
    setFormMale(rec.malePopulation.toString());
    setFormFemale(rec.femalePopulation.toString());
    setFormTotal(rec.totalPopulation.toString());
    setFormGrowthRate(rec.annualGrowthRate !== undefined ? rec.annualGrowthRate.toString() : '');
    setFormIsEstimated(!!rec.isEstimated);
    setFormSourceId(rec.sourceId || 'src-pbs-census');
    setFormNotes(rec.notes || '');
    setFormErrors([]);
    setFormWarnings([]);
  };

  // Apply Previous Baseline Demographic Projection
  const handleApplyBaseline = (base: PopulationRecord) => {
    const nextYear = base.year + 1;
    const growth = base.annualGrowthRate || 1.74;
    const projectedTotal = Math.round(base.totalPopulation * (1 + growth / 100));
    const projectedMale = Math.round(projectedTotal * (base.malePercentage / 100));
    const projectedFemale = projectedTotal - projectedMale;

    setFormYear(nextYear.toString());
    setFormDistrict(base.district);
    setFormMale(projectedMale.toString());
    setFormFemale(projectedFemale.toString());
    setFormTotal(projectedTotal.toString());
    setFormGrowthRate(growth.toString());
    setFormIsEstimated(true);
    setFormSourceId(base.sourceId || 'src-pbs-census');
    setFormNotes(`Demographic projection derived from Year ${base.year} (${base.district.replace('_', ' ')}) baseline using ${growth}% CAGR.`);
    setSelectedBaselineId(base.id);
    setFormErrors([]);
    setFormWarnings([]);
  };

  // Open Add Modal with previous baseline calculation
  const handleOpenAddWithPrevious = (baseRecord?: PopulationRecord) => {
    // If no record provided, pick latest record
    const base = baseRecord || (populationData.length > 0
      ? [...populationData].sort((a, b) => b.year - a.year)[0]
      : null);

    if (base) {
      handleApplyBaseline(base);
    } else {
      setFormYear('2026');
      setFormDistrict('COMBINED_CHITRAL');
      setFormMale('285000');
      setFormFemale('278000');
      setFormTotal('563000');
      setFormGrowthRate('1.74');
      setFormIsEstimated(true);
      setFormSourceId('src-pbs-census');
      setFormNotes('Official annual intercensal population projection.');
      setSelectedBaselineId(null);
    }

    setEditingRecord(null);
    setFormErrors([]);
    setFormWarnings([]);
    setIsAddModalOpen(true);
  };

  // Open Standard Add Modal
  const handleOpenAdd = () => {
    handleOpenAddWithPrevious();
  };

  // Restore Official Baseline Census Records
  const handleRestoreBaseline = () => {
    setPopulationData(INITIAL_POPULATION_DATA);
    const audit: AuditLog = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: currentUserName,
      role: userRole,
      action: 'POPULATION_RESET_BASELINE',
      targetEntity: 'population_data',
      details: `Restored official Pakistan Bureau of Statistics baseline census dataset (${INITIAL_POPULATION_DATA.length} records: 1998-2025).`
    };
    setAuditLogs(prev => [audit, ...prev]);
    setIsRestoreModalOpen(false);
    setFeedbackMsg({
      type: 'success',
      text: `Successfully restored ${INITIAL_POPULATION_DATA.length} official PBS baseline census records.`
    });
    setTimeout(() => setFeedbackMsg(null), 5000);
  };

  // Save Record (Create or Update)
  const handleSaveRecord = (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors([]);
    setFormWarnings([]);

    const year = parseInt(formYear, 10);
    const male = parseInt(formMale, 10);
    const female = parseInt(formFemale, 10);
    const total = parseInt(formTotal, 10);
    const growth = formGrowthRate ? parseFloat(formGrowthRate) : undefined;

    const malePct = total > 0 ? Number(((male / total) * 100).toFixed(2)) : 0;
    const femalePct = total > 0 ? Number(((female / total) * 100).toFixed(2)) : 0;

    // Existing keys check (excluding current record if editing)
    const existingKeys = new Set(
      populationData
        .filter(r => (editingRecord ? r.id !== editingRecord.id : true))
        .map(r => `${r.year}-${r.district}`)
    );

    const tempRecord: Partial<PopulationRecord> = {
      year,
      district: formDistrict,
      totalPopulation: total,
      malePopulation: male,
      femalePopulation: female,
      malePercentage: malePct,
      femalePercentage: femalePct,
      annualGrowthRate: growth,
      isEstimated: formIsEstimated,
      sourceId: formSourceId,
      notes: formNotes
    };

    const validation = validatePopulationRecord(tempRecord, 1, existingKeys);
    if (validation.errors.length > 0) {
      setFormErrors(validation.errors.map(err => err.message));
      return;
    }
    if (validation.warnings.length > 0) {
      setFormWarnings(validation.warnings.map(w => w.message));
    }

    if (editingRecord) {
      // UPDATE
      const updated: PopulationRecord = {
        ...editingRecord,
        year,
        district: formDistrict,
        totalPopulation: total,
        malePopulation: male,
        femalePopulation: female,
        malePercentage: malePct,
        femalePercentage: femalePct,
        annualGrowthRate: growth,
        isEstimated: formIsEstimated,
        sourceId: formSourceId,
        notes: formNotes
      };

      setPopulationData(prev => prev.map(r => (r.id === updated.id ? updated : r)));

      // Audit Log
      const audit: AuditLog = {
        id: `audit-${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: currentUserName,
        role: userRole,
        action: 'POPULATION_RECORD_UPDATE',
        targetEntity: `Year ${year} (${formDistrict})`,
        details: `Updated population metrics: Total ${total.toLocaleString()} (M: ${male.toLocaleString()}, F: ${female.toLocaleString()}).`
      };
      setAuditLogs(prev => [audit, ...prev]);

      setFeedbackMsg({
        type: 'success',
        text: `Updated Year ${year} (${formDistrict.replace('_', ' ')}) population record.`
      });
      setTimeout(() => setFeedbackMsg(null), 4000);
      setEditingRecord(null);
    } else {
      // CREATE
      const newRec: PopulationRecord = {
        id: `pop-record-${Date.now()}`,
        year,
        district: formDistrict,
        totalPopulation: total,
        malePopulation: male,
        femalePopulation: female,
        malePercentage: malePct,
        femalePercentage: femalePct,
        annualGrowthRate: growth,
        isEstimated: formIsEstimated,
        sourceId: formSourceId,
        notes: formNotes
      };

      setPopulationData(prev => [...prev, newRec]);

      // Audit Log
      const audit: AuditLog = {
        id: `audit-${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: currentUserName,
        role: userRole,
        action: 'POPULATION_RECORD_CREATE',
        targetEntity: `Year ${year} (${formDistrict})`,
        details: `Created demographic entry: Total ${total.toLocaleString()} (${formIsEstimated ? 'Estimated' : 'Official Census'}).`
      };
      setAuditLogs(prev => [audit, ...prev]);

      setFeedbackMsg({
        type: 'success',
        text: `Successfully added Year ${year} (${formDistrict.replace('_', ' ')}) demographic record.`
      });
      setTimeout(() => setFeedbackMsg(null), 4000);
      setIsAddModalOpen(false);
    }
  };

  // DELETE Record
  const handleConfirmDelete = () => {
    if (!recordToDelete) return;

    setPopulationData(prev => prev.filter(r => r.id !== recordToDelete.id));

    const audit: AuditLog = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: currentUserName,
      role: userRole,
      action: 'POPULATION_RECORD_DELETE',
      targetEntity: `Year ${recordToDelete.year} (${recordToDelete.district})`,
      details: `Removed demographic record for Year ${recordToDelete.year}.`
    };
    setAuditLogs(prev => [audit, ...prev]);

    setFeedbackMsg({
      type: 'info',
      text: `Deleted Year ${recordToDelete.year} (${recordToDelete.district.replace('_', ' ')}) population record.`
    });
    setTimeout(() => setFeedbackMsg(null), 4000);

    setRecordToDelete(null);
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['year', 'district', 'total_population', 'male_population', 'female_population', 'male_percentage', 'female_percentage', 'growth_rate', 'is_estimated', 'source_id', 'notes'];
    const rows = populationData.map(r => [
      r.year,
      r.district,
      r.totalPopulation,
      r.malePopulation,
      r.femalePopulation,
      r.malePercentage,
      r.femalePercentage,
      r.annualGrowthRate || '',
      r.isEstimated ? 'true' : 'false',
      r.sourceId,
      `"${(r.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvStr = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `uoch_chitral_population_data_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Ingestion Commit
  const handleCommitPopulationCSV = () => {
    if (!csvReport || !csvReport.isValid || csvReport.records.length === 0) return;

    const newRecords = csvReport.records;
    setPopulationData(prev => {
      const keys = new Set(newRecords.map(r => `${r.year}-${r.district}`));
      const filtered = prev.filter(r => !keys.has(`${r.year}-${r.district}`));
      return [...filtered, ...newRecords].sort((a, b) => a.year - b.year);
    });

    const audit: AuditLog = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: currentUserName,
      role: userRole,
      action: 'POPULATION_CSV_IMPORT',
      targetEntity: 'population_data',
      details: `Imported ${newRecords.length} validated Chitral population records.`
    };
    setAuditLogs(prev => [audit, ...prev]);

    setCsvSuccessMsg(`Successfully imported ${newRecords.length} validated population records.`);
    setCsvReport(null);
    setCsvContent('');
  };

  // Filtered and Sorted Records
  const filteredRecords = useMemo(() => {
    return populationData
      .filter(rec => {
        const matchesSearch =
          searchTerm === '' ||
          rec.year.toString().includes(searchTerm) ||
          rec.district.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (rec.notes && rec.notes.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesDistrict =
          districtFilter === 'ALL' || rec.district === districtFilter;

        const matchesType =
          typeFilter === 'ALL' ||
          (typeFilter === 'CENSUS' && !rec.isEstimated) ||
          (typeFilter === 'ESTIMATED' && !!rec.isEstimated);

        return matchesSearch && matchesDistrict && matchesType;
      })
      .sort((a, b) => {
        if (sortOrder === 'YEAR_DESC') return b.year - a.year;
        if (sortOrder === 'YEAR_ASC') return a.year - b.year;
        if (sortOrder === 'POP_DESC') return b.totalPopulation - a.totalPopulation;
        return 0;
      });
  }, [populationData, searchTerm, districtFilter, typeFilter, sortOrder]);

  const latestCensus = useMemo(() => {
    const censusOnly = populationData.filter(r => !r.isEstimated).sort((a, b) => b.year - a.year);
    return censusOnly[0] || null;
  }, [populationData]);

  // Manual Single Record Submission
  const handleManualAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors([]);
    setFormWarnings([]);

    const year = parseInt(formYear, 10);
    const male = parseInt(formMale, 10);
    const female = parseInt(formFemale, 10);
    const total = parseInt(formTotal, 10);
    const growth = formGrowthRate ? parseFloat(formGrowthRate) : undefined;

    const malePct = total > 0 ? Number(((male / total) * 100).toFixed(2)) : 0;
    const femalePct = total > 0 ? Number(((female / total) * 100).toFixed(2)) : 0;

    const existingKeys = new Set(populationData.map(r => `${r.year}-${r.district}`));

    const tempRecord: Partial<PopulationRecord> = {
      year,
      district: formDistrict,
      totalPopulation: total,
      malePopulation: male,
      femalePopulation: female,
      annualGrowthRate: growth,
      isEstimated: formIsEstimated,
      sourceId: formSourceId,
      notes: formNotes
    };

    const validation = validatePopulationRecord(tempRecord, 1, existingKeys);
    if (validation.errors.length > 0) {
      setFormErrors(validation.errors.map(err => err.message));
      return;
    }
    if (validation.warnings.length > 0) {
      setFormWarnings(validation.warnings.map(w => w.message));
    }

    const newRec: PopulationRecord = {
      id: `pop-record-${Date.now()}`,
      year,
      district: formDistrict,
      totalPopulation: total,
      malePopulation: male,
      femalePopulation: female,
      malePercentage: malePct,
      femalePercentage: femalePct,
      annualGrowthRate: growth,
      isEstimated: formIsEstimated,
      sourceId: formSourceId,
      notes: formNotes
    };

    setPopulationData(prev => [...prev, newRec].sort((a, b) => a.year - b.year));

    const audit: AuditLog = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: currentUserName,
      role: userRole,
      action: 'POPULATION_RECORD_CREATE',
      targetEntity: `Year ${year} (${formDistrict})`,
      details: `Created demographic entry: Total ${total.toLocaleString()} (${formIsEstimated ? 'Estimated' : 'Official Census'}).`
    };
    setAuditLogs(prev => [audit, ...prev]);

    setManualSuccessMsg(`Successfully verified & recorded demographic entry for Year ${year} (${formDistrict.replace('_', ' ')})!`);
    setTimeout(() => setManualSuccessMsg(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Sub-tabs for Population Management */}
      <div className="flex space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2 text-xs">
        <button
          onClick={() => setPopulationSubTab('INGESTION')}
          className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-all duration-200 ease-out hover:-translate-y-0.5 active:scale-95 ${
            populationSubTab === 'INGESTION'
              ? 'bg-purple-600 text-white font-bold shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          CSV Staging &amp; Validation
        </button>
        <button
          onClick={() => setPopulationSubTab('RECORDS')}
          className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-all duration-200 ease-out hover:-translate-y-0.5 active:scale-95 ${
            populationSubTab === 'RECORDS'
              ? 'bg-purple-600 text-white font-bold shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          Active Population Records ({populationData.length})
        </button>
      </div>

      {/* SUB-TAB 1: CSV INGESTION & STAGING WORKFLOW */}
      {populationSubTab === 'INGESTION' && (
        <div className="space-y-6">
          {/* Deterministic Population Ingestion Card */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Deterministic Population Ingestion Workflow
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Upload or paste Chitral demographic CSV dataset. The engine validates column headers, data types, Census vs Projection flags, and mathematical sum balancing (Male + Female = Total) before committing to the database.
              </p>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium mr-1">
                Evaluation Presets:
              </span>
              <button
                type="button"
                onClick={loadSampleValidCSV}
                className="px-2.5 py-1 text-xs font-semibold rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 cursor-pointer transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-xs active:scale-95"
              >
                Load Valid Dataset
              </button>
              <button
                type="button"
                onClick={loadSampleErroneousCSV}
                className="px-2.5 py-1 text-xs font-semibold rounded bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/50 cursor-pointer transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-xs active:scale-95"
              >
                Load Corrupted Dataset (Trap Errors)
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Upload CSV File
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 dark:file:bg-purple-950 dark:file:text-purple-300 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Or Paste Raw CSV
                </label>
                <textarea
                  rows={4}
                  value={csvContent}
                  onChange={e => {
                    setCsvContent(e.target.value);
                    if (e.target.value.trim()) {
                      setCsvReport(validatePopulationCSV(e.target.value));
                    } else {
                      setCsvReport(null);
                    }
                    setCsvSuccessMsg(null);
                  }}
                  placeholder="year,district,total_population,male_population,female_population,growth_rate,is_estimated,source_id,notes"
                  className="w-full text-xs font-mono p-2.5 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Validation Report */}
            {csvReport && (
              <div className={`p-4 rounded-xl border ${
                csvReport.isValid
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
                  : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    {csvReport.isValid ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                    )}
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      Validation Report: {csvReport.isValid ? 'Ready to Ingest' : 'Integrity Violations Found'}
                    </h4>
                  </div>

                  <span className="text-xs font-mono font-bold">
                    {csvReport.summary.validRows} / {csvReport.summary.totalRows} Rows Valid
                  </span>
                </div>

                {csvReport.errors.length > 0 && (
                  <div className="mt-3 space-y-1.5 text-xs text-rose-700 dark:text-rose-300">
                    <p className="font-bold">Blocking Errors ({csvReport.errors.length}):</p>
                    <ul className="list-disc pl-5 space-y-0.5">
                      {csvReport.errors.map((err, i) => (
                        <li key={i}>
                          [Row {err.rowNumber || 'Header'}] {err.fieldName}: {err.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {csvReport.warnings.length > 0 && (
                  <div className="mt-3 space-y-1.5 text-xs text-amber-700 dark:text-amber-300">
                    <p className="font-bold">Advisory Warnings ({csvReport.warnings.length}):</p>
                    <ul className="list-disc pl-5 space-y-0.5">
                      {csvReport.warnings.map((w, i) => (
                        <li key={i}>
                          [Row {w.rowNumber || 'Header'}] {w.fieldName}: {w.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-4 flex justify-end">
                  <button
                    disabled={!csvReport.isValid || csvReport.records.length === 0}
                    onClick={handleCommitPopulationCSV}
                    className="px-4 py-2 rounded-lg bg-purple-700 hover:bg-purple-600 disabled:opacity-40 text-white text-xs font-bold transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-xs active:scale-95 shadow-sm cursor-pointer disabled:hover:translate-y-0 disabled:hover:shadow-none"
                  >
                    Commit to Ingestion Pipeline ({csvReport.records.length} Records)
                  </button>
                </div>
              </div>
            )}

            {csvSuccessMsg && (
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-center justify-between">
                <span className="font-bold">{csvSuccessMsg}</span>
                <button
                  type="button"
                  onClick={() => setPopulationSubTab('RECORDS')}
                  className="px-2.5 py-1 rounded bg-emerald-600 text-white font-bold hover:bg-emerald-500 cursor-pointer"
                >
                  View in Active Records
                </button>
              </div>
            )}
          </div>

          {/* Manual Single Population Record Entry Card */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center space-x-2">
              <Plus className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Manual Demographic Record Entry
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Directly record a single official census or projected year entry with real-time gender balancing calculation.
                </p>
              </div>
            </div>

            <form onSubmit={handleManualAddSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Census / Survey Year *
                  </label>
                  <input
                    type="number"
                    required
                    min={1900}
                    max={2100}
                    value={formYear}
                    onChange={e => setFormYear(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    District Geographic Scope *
                  </label>
                  <select
                    value={formDistrict}
                    onChange={e => setFormDistrict(e.target.value as DistrictScope)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  >
                    <option value="COMBINED_CHITRAL">Combined Chitral (Upper + Lower)</option>
                    <option value="LOWER_CHITRAL">Lower Chitral District</option>
                    <option value="UPPER_CHITRAL">Upper Chitral District</option>
                  </select>
                </div>
              </div>

              {/* Male, Female, Total */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Male Citizens *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formMale}
                    onChange={e => handleMaleChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Female Citizens *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formFemale}
                    onChange={e => handleFemaleChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Total Population *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formTotal}
                    onChange={e => setFormTotal(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Live Auto-Calculated Gender Balance Preview */}
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Computed Gender Ratio:</span>
                <div className="flex items-center space-x-3 font-mono font-bold">
                  <span className="text-blue-600 dark:text-blue-400">{calculatedMalePct}% Male</span>
                  <span className="text-slate-400">•</span>
                  <span className="text-emerald-600 dark:text-emerald-400">{calculatedFemalePct}% Female</span>
                </div>
              </div>

              {/* Growth Rate & Projection Checkbox */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Annual Growth Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 1.80"
                    value={formGrowthRate}
                    onChange={e => setFormGrowthRate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div className="pt-2 sm:pt-4">
                  <label className="flex items-center space-x-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIsEstimated}
                      onChange={e => setFormIsEstimated(e.target.checked)}
                      className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span>Designate as Intercensal Projection</span>
                  </label>
                </div>
              </div>

              {/* Provenance & Notes */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Data Source Provenance
                </label>
                <select
                  value={formSourceId}
                  onChange={e => setFormSourceId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                >
                  {dataSources.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.sourceName}
                    </option>
                  ))}
                  <option value="src-pbs-census">Pakistan Bureau of Statistics (PBS Census)</option>
                  <option value="src-khed-survey">KP Higher Education Statistics</option>
                  <option value="src-uoch-manual">University of Chitral Planning Unit</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Demographic Notes &amp; Methodology
                </label>
                <textarea
                  rows={2}
                  placeholder="Record methodology context, source citations, or provincial survey references..."
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              {formErrors.length > 0 && (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300 space-y-1">
                  <div className="flex items-center space-x-1.5 font-bold">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Integrity Errors Detected:</span>
                  </div>
                  <ul className="list-disc pl-5 space-y-0.5">
                    {formErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {manualSuccessMsg && (
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 font-bold">
                  {manualSuccessMsg}
                </div>
              )}

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-purple-700 hover:bg-purple-600 text-white text-xs font-bold transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-xs active:scale-95 shadow-sm cursor-pointer"
                >
                  Verify &amp; Add Population Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: ACTIVE POPULATION RECORDS & METRICS */}
      {populationSubTab === 'RECORDS' && (
        <div className="space-y-6">
          {/* Top Summary Banner */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                  <Users className="w-5 h-5" />
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Chitral Population Master CRUD Management
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Complete institutional control: Add new census/intercensal records, edit demographics, review mathematical consistency, and remove outdated entries.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                id="btn-add-population-record"
                onClick={() => handleOpenAddWithPrevious()}
                className="px-3.5 py-2 rounded-xl bg-purple-700 hover:bg-purple-600 text-white text-xs font-bold transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md hover:shadow-purple-900/20 active:scale-95 flex items-center space-x-1.5 shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Population Record</span>
              </button>

              <button
                type="button"
                id="btn-restore-baseline"
                onClick={() => setIsRestoreModalOpen(true)}
                className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition border border-slate-200 dark:border-slate-700 flex items-center space-x-1.5 cursor-pointer"
                title="Restore Official PBS Baseline Census Records (1998-2025)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restore Baseline</span>
              </button>

              <button
                type="button"
                onClick={() => setPopulationSubTab('INGESTION')}
                className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition border border-slate-200 dark:border-slate-700 flex items-center space-x-1.5 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>CSV Ingestion</span>
              </button>

              <button
                type="button"
                onClick={handleExportCSV}
                className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition border border-slate-200 dark:border-slate-700 flex items-center space-x-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Feedback Alert Banner */}
          {feedbackMsg && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-center justify-between transition-all ${
                feedbackMsg.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-200'
                  : 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900 text-blue-800 dark:text-blue-200'
              }`}
            >
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span className="font-semibold">{feedbackMsg.text}</span>
              </div>
              <button
                onClick={() => setFeedbackMsg(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Summary KPI Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Records</span>
              <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{populationData.length}</p>
              <span className="text-[10px] text-slate-400">Demographic benchmarks</span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Latest Official Census</span>
              <p className="text-xl font-bold text-purple-600 dark:text-purple-400 mt-0.5">
                {latestCensus ? `${latestCensus.year} Census` : '2023'}
              </p>
              <span className="text-[10px] text-slate-400">
                {latestCensus ? `${latestCensus.totalPopulation.toLocaleString()} citizens` : 'PBS Digital Census'}
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Gender Balance (Latest)</span>
              <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                {latestCensus ? `${latestCensus.femalePercentage}% F` : '49.2% F'}
              </p>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                {latestCensus ? `${latestCensus.malePercentage}% M` : '50.8% M'}
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Annual Growth Rate</span>
              <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                {latestCensus?.annualGrowthRate ? `${latestCensus.annualGrowthRate}%` : '1.80%'}
              </p>
              <span className="text-[10px] text-slate-400">Intercensal benchmark</span>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search population records by year, notes, or district..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* District Scope Filter */}
              <div className="flex items-center space-x-1 bg-slate-50 dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 px-1 font-medium">District:</span>
                <button
                  onClick={() => setDistrictFilter('ALL')}
                  className={`px-2 py-1 rounded font-medium cursor-pointer ${
                    districtFilter === 'ALL' ? 'bg-purple-600 text-white' : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setDistrictFilter('COMBINED_CHITRAL')}
                  className={`px-2 py-1 rounded font-medium cursor-pointer ${
                    districtFilter === 'COMBINED_CHITRAL' ? 'bg-purple-600 text-white' : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Combined
                </button>
                <button
                  onClick={() => setDistrictFilter('LOWER_CHITRAL')}
                  className={`px-2 py-1 rounded font-medium cursor-pointer ${
                    districtFilter === 'LOWER_CHITRAL' ? 'bg-purple-600 text-white' : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Lower
                </button>
                <button
                  onClick={() => setDistrictFilter('UPPER_CHITRAL')}
                  className={`px-2 py-1 rounded font-medium cursor-pointer ${
                    districtFilter === 'UPPER_CHITRAL' ? 'bg-purple-600 text-white' : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Upper
                </button>
              </div>

              {/* Type Filter */}
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value as any)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="ALL">All Types</option>
                <option value="CENSUS">Official Census Only</option>
                <option value="ESTIMATED">Annual Projections Only</option>
              </select>

              {/* Sort Order */}
              <select
                value={sortOrder}
                onChange={e => setSortOrder(e.target.value as any)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="YEAR_DESC">Year (Newest First)</option>
                <option value="YEAR_ASC">Year (Oldest First)</option>
                <option value="POP_DESC">Population (Highest First)</option>
              </select>
            </div>
          </div>

          {/* Main Population Data Table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Year &amp; District</th>
                    <th className="py-3 px-4">Status / Type</th>
                    <th className="py-3 px-4 text-right">Total Population</th>
                    <th className="py-3 px-4 text-right">Male</th>
                    <th className="py-3 px-4 text-right">Female</th>
                    <th className="py-3 px-4 text-center">Gender Ratio</th>
                    <th className="py-3 px-4 text-right">Growth Rate</th>
                    <th className="py-3 px-4">Provenance / Notes</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        No population records matching the selected criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map(rec => (
                      <tr
                        key={rec.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition"
                      >
                        <td className="py-3 px-4 font-medium">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-900 dark:text-white text-sm">{rec.year}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40">
                              {rec.district.replace('_', ' ')}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {rec.isEstimated ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                              Intercensal Estimate
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                              Official PBS Census
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white font-mono text-sm">
                          {rec.totalPopulation.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-300 font-mono">
                          {rec.malePopulation.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-300 font-mono">
                          {rec.femalePopulation.toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center space-x-1 text-[11px] font-medium font-mono">
                            <span className="text-blue-600 dark:text-blue-400">{rec.malePercentage}% M</span>
                            <span className="text-slate-400">/</span>
                            <span className="text-emerald-600 dark:text-emerald-400">{rec.femalePercentage}% F</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right text-slate-700 dark:text-slate-300 font-mono">
                          {rec.annualGrowthRate !== undefined ? `${rec.annualGrowthRate}%` : '—'}
                        </td>
                        <td className="py-3 px-4 max-w-xs truncate text-slate-500 dark:text-slate-400 text-[11px]" title={rec.notes}>
                          {rec.notes || 'Institutional entry'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => handleOpenAddWithPrevious(rec)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition cursor-pointer"
                              title={`Project next cycle from Year ${rec.year} record`}
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleOpenEdit(rec)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition cursor-pointer"
                              title="Edit population record"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => setRecordToDelete(rec)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                              title="Delete population record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT MODAL */}
      {(isAddModalOpen || editingRecord) && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-xl w-full p-6 relative my-8">
            <button
              onClick={() => {
                setIsAddModalOpen(false);
                setEditingRecord(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2.5 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="p-2 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-400">
                {editingRecord ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              </span>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {editingRecord ? `Edit Demographic Record: Year ${editingRecord.year}` : 'Add New Chitral Population Record'}
                </h3>
                <p className="text-xs text-slate-500">
                  {editingRecord
                    ? 'Modify official census counts, growth projections, or institutional notes.'
                    : 'Enter new census or intercensal demographic figures for Chitral.'}
                </p>
              </div>
            </div>

            {/* Quick Pre-fill / Project from Previous Record Bar (Add mode only) */}
            {!editingRecord && (
              <div className="mb-4 p-3.5 rounded-xl bg-purple-50/80 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                  <span className="font-bold text-purple-900 dark:text-purple-200 flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                    <span>Pre-fill &amp; Project from Previous Record:</span>
                  </span>
                  <span className="text-[11px] text-purple-700 dark:text-purple-300 font-medium">
                    Auto-proposes next cycle + CAGR growth
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {populationData
                    .slice()
                    .sort((a, b) => b.year - a.year)
                    .map(baseRec => {
                      const isSelected = selectedBaselineId === baseRec.id;
                      return (
                        <button
                          key={baseRec.id}
                          type="button"
                          onClick={() => handleApplyBaseline(baseRec)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition border cursor-pointer flex items-center space-x-1 ${
                            isSelected
                              ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-purple-400 hover:text-purple-600'
                          }`}
                          title={`Clone Year ${baseRec.year} metrics: ${baseRec.totalPopulation.toLocaleString()} citizens`}
                        >
                          <span>{baseRec.year}</span>
                          <span className="text-[10px] opacity-80">
                            ({baseRec.isEstimated ? 'Est.' : 'Census'} - {baseRec.totalPopulation.toLocaleString()})
                          </span>
                        </button>
                      );
                    })}
                </div>
              </div>
            )}

            <form onSubmit={handleSaveRecord} className="space-y-4">
              {/* Year & District */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Census / Survey Year *
                  </label>
                  <input
                    type="number"
                    required
                    min={1900}
                    max={2100}
                    value={formYear}
                    onChange={e => setFormYear(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    District Geographic Scope *
                  </label>
                  <select
                    value={formDistrict}
                    onChange={e => setFormDistrict(e.target.value as DistrictScope)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  >
                    <option value="COMBINED_CHITRAL">Combined Chitral (Upper + Lower)</option>
                    <option value="LOWER_CHITRAL">Lower Chitral District</option>
                    <option value="UPPER_CHITRAL">Upper Chitral District</option>
                  </select>
                </div>
              </div>

              {/* Male, Female, Total */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Male Citizens *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formMale}
                    onChange={e => handleMaleChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Female Citizens *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formFemale}
                    onChange={e => handleFemaleChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Total Population *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formTotal}
                    onChange={e => setFormTotal(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Live Auto-Calculated Gender Balance Preview */}
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Computed Gender Ratio:</span>
                <div className="flex items-center space-x-3 font-mono font-bold">
                  <span className="text-blue-600 dark:text-blue-400">{calculatedMalePct}% Male</span>
                  <span className="text-slate-400">•</span>
                  <span className="text-emerald-600 dark:text-emerald-400">{calculatedFemalePct}% Female</span>
                </div>
              </div>

              {/* Growth Rate & Estimate Checkbox */}
              <div className="grid grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Annual Growth Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 1.80"
                    value={formGrowthRate}
                    onChange={e => setFormGrowthRate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div className="pt-4">
                  <label className="flex items-center space-x-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIsEstimated}
                      onChange={e => setFormIsEstimated(e.target.checked)}
                      className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span>Designate as Intercensal Projection</span>
                  </label>
                </div>
              </div>

              {/* Source & Notes */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Data Source Provenance
                </label>
                <select
                  value={formSourceId}
                  onChange={e => setFormSourceId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                >
                  {dataSources.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.sourceName}
                    </option>
                  ))}
                  <option value="src-pbs-census">Pakistan Bureau of Statistics (PBS Census)</option>
                  <option value="src-khed-survey">KP Higher Education Statistics</option>
                  <option value="src-uoch-manual">University of Chitral Planning Unit</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Demographic Notes &amp; Methodology
                </label>
                <textarea
                  rows={2}
                  placeholder="Record methodology context, source citations, or provincial survey references..."
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              {/* Validation Feedback */}
              {formErrors.length > 0 && (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300 space-y-1">
                  <div className="flex items-center space-x-1.5 font-bold">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Integrity Errors Detected:</span>
                  </div>
                  <ul className="list-disc pl-5 space-y-0.5">
                    {formErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {formWarnings.length > 0 && (
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-700 dark:text-amber-300 space-y-1">
                  <div className="flex items-center space-x-1.5 font-bold">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Advisory Notes:</span>
                  </div>
                  <ul className="list-disc pl-5 space-y-0.5">
                    {formWarnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingRecord(null);
                  }}
                  className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-purple-700 hover:bg-purple-600 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  {editingRecord ? 'Save Changes' : 'Create Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {recordToDelete && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Delete Population Record?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Are you sure you want to delete the record for <strong>Year {recordToDelete.year}</strong> ({recordToDelete.district.replace('_', ' ')}) with a population of <strong>{recordToDelete.totalPopulation.toLocaleString()}</strong>?
              </p>
            </div>

            <div className="flex items-center justify-center space-x-3 pt-2">
              <button
                onClick={() => setRecordToDelete(null)}
                className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-sm cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESTORE BASELINE MODAL */}
      {isRestoreModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 mx-auto flex items-center justify-center">
              <RotateCcw className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Restore Official Baseline Census Records?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                This will reset the active Chitral population dataset to the official Pakistan Bureau of Statistics (PBS) historical censuses (1998, 2005, 2010, 2015, 2017, 2020, 2023, 2025). Any custom test records will be replaced.
              </p>
            </div>

            <div className="flex items-center justify-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setIsRestoreModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-restore-baseline"
                onClick={handleRestoreBaseline}
                className="px-4 py-2 rounded-lg bg-purple-700 hover:bg-purple-600 text-white text-xs font-bold shadow-sm cursor-pointer"
              >
                Confirm Restore
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSV IMPORT MODAL */}
      {isCsvModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full p-6 relative my-8">
            <button
              onClick={() => setIsCsvModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2.5 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="p-2 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-400">
                <Upload className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Batch Population CSV Import
                </h3>
                <p className="text-xs text-slate-500">
                  Upload or paste CSV with schema: year, district, total_population, male_population, female_population, growth_rate, notes.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Paste Raw CSV or File
                </label>
                <textarea
                  rows={5}
                  placeholder={`year,district,total_population,male_population,female_population,growth_rate,notes\n2025,COMBINED_CHITRAL,557700,282500,275200,1.85,Intercensal projection\n2026,COMBINED_CHITRAL,568000,287700,280300,1.82,Forecast benchmark`}
                  value={csvContent}
                  onChange={e => {
                    setCsvContent(e.target.value);
                    if (e.target.value.trim()) {
                      const report = validatePopulationCSV(e.target.value);
                      setCsvReport(report);
                    } else {
                      setCsvReport(null);
                    }
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              {csvReport && (
                <div className={`p-3 rounded-lg text-xs ${
                  csvReport.isValid
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-200'
                    : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-200'
                }`}>
                  <p className="font-bold">
                    Validation: {csvReport.isValid ? 'All rows passed schema verification' : `${csvReport.errors.length} errors found`}
                  </p>
                  <p className="text-[11px] mt-0.5">
                    Valid rows: {csvReport.records.length} of {csvReport.summary.totalRows}
                  </p>
                </div>
              )}

              {csvSuccessMsg && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">{csvSuccessMsg}</p>
              )}

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  onClick={() => setIsCsvModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Close
                </button>
                <button
                  disabled={!csvReport || !csvReport.isValid || csvReport.records.length === 0}
                  onClick={handleCommitPopulationCSV}
                  className="px-4 py-2 rounded-lg bg-purple-700 hover:bg-purple-600 disabled:opacity-50 text-white text-xs font-bold transition cursor-pointer"
                >
                  Commit Ingestion ({csvReport?.records.length || 0} Records)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
