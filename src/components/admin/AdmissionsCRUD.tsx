import React, { useState, useMemo } from 'react';
import {
  GraduationCap,
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
  TrendingUp,
  Percent,
  FileSpreadsheet,
  Users,
  RotateCcw,
  Sparkles,
  Info,
  Copy
} from 'lucide-react';
import { AdmissionRecord, DataSource, AuditLog, UserRole, VerificationStatus } from '../../types';
import { validateAdmissionRecord, validateAdmissionCSV } from '../../lib/validation/dataValidator';
import { INITIAL_ADMISSION_DATA } from '../../data/defaultDatasets';

interface AdmissionsCRUDProps {
  admissionsData: AdmissionRecord[];
  setAdmissionsData: React.Dispatch<React.SetStateAction<AdmissionRecord[]>>;
  dataSources: DataSource[];
  setAuditLogs: React.Dispatch<React.SetStateAction<AuditLog[]>>;
  userRole: UserRole;
  currentUserName: string;
}

export const AdmissionsCRUD: React.FC<AdmissionsCRUDProps> = ({
  admissionsData,
  setAdmissionsData,
  dataSources,
  setAuditLogs,
  userRole,
  currentUserName
}) => {
  // Navigation sub-tab
  const [activeSubTab, setActiveSubTab] = useState<'RECORDS' | 'INGESTION'>('RECORDS');

  // Search, Filter, Sort
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'YEAR_DESC' | 'YEAR_ASC' | 'ADMITTED_DESC' | 'FEMALE_RATIO_DESC'>('YEAR_DESC');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AdmissionRecord | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<AdmissionRecord | null>(null);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [selectedBaselineCycleId, setSelectedBaselineCycleId] = useState<string | null>(null);

  // Success / Error Feedback
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form Fields for Add / Edit
  const [formYear, setFormYear] = useState<string>('2026-2027');
  const [formMaleApplicants, setFormMaleApplicants] = useState<string>('2150');
  const [formFemaleApplicants, setFormFemaleApplicants] = useState<string>('2350');
  const [formMaleAdmitted, setFormMaleAdmitted] = useState<string>('1390');
  const [formFemaleAdmitted, setFormFemaleAdmitted] = useState<string>('1510');
  const [formStatus, setFormStatus] = useState<VerificationStatus>('VERIFIED');
  const [formSourceId, setFormSourceId] = useState<string>('src-uoch-admissions');
  const [formNotes, setFormNotes] = useState<string>('Official admission batch approved by Academic Council.');
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [formWarnings, setFormWarnings] = useState<string[]>([]);

  // CSV Staging State
  const [csvContent, setCsvContent] = useState('');
  const [csvReport, setCsvReport] = useState<ReturnType<typeof validateAdmissionCSV> | null>(null);
  const [csvSuccessMsg, setCsvSuccessMsg] = useState<string | null>(null);

  // Computed Values for Current Form Inputs
  const parsedMaleApp = parseInt(formMaleApplicants, 10) || 0;
  const parsedFemaleApp = parseInt(formFemaleApplicants, 10) || 0;
  const parsedTotalApp = parsedMaleApp + parsedFemaleApp;

  const parsedMaleAdm = parseInt(formMaleAdmitted, 10) || 0;
  const parsedFemaleAdm = parseInt(formFemaleAdmitted, 10) || 0;
  const parsedTotalAdm = parsedMaleAdm + parsedFemaleAdm;

  const calculatedFemaleRatio = parsedTotalAdm > 0 ? Number(((parsedFemaleAdm / parsedTotalAdm) * 100).toFixed(2)) : 0;
  const calculatedMaleRatio = parsedTotalAdm > 0 ? Number(((parsedMaleAdm / parsedTotalAdm) * 100).toFixed(2)) : 0;
  const calculatedYieldRate = parsedTotalApp > 0 ? Number(((parsedTotalAdm / parsedTotalApp) * 100).toFixed(1)) : 0;

  // Filtered & Sorted Records
  const processedRecords = useMemo(() => {
    let result = [...admissionsData];

    // Search filter (academic year or notes)
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        r => r.academicYear.toLowerCase().includes(q) || (r.notes && r.notes.toLowerCase().includes(q))
      );
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      result = result.filter(r => r.status === statusFilter);
    }

    // Sort order
    result.sort((a, b) => {
      if (sortOrder === 'YEAR_DESC') return b.startYear - a.startYear;
      if (sortOrder === 'YEAR_ASC') return a.startYear - b.startYear;
      if (sortOrder === 'ADMITTED_DESC') return b.totalAdmitted - a.totalAdmitted;
      if (sortOrder === 'FEMALE_RATIO_DESC') return b.femaleAdmissionRatio - a.femaleAdmissionRatio;
      return 0;
    });

    return result;
  }, [admissionsData, searchTerm, statusFilter, sortOrder]);

  // Aggregate stats
  const totalCycles = admissionsData.length;
  const totalHistoricAdmitted = useMemo(() => admissionsData.reduce((sum, r) => sum + r.totalAdmitted, 0), [admissionsData]);
  const latestRecord = useMemo(() => {
    if (admissionsData.length === 0) return null;
    const sorted = [...admissionsData].sort((a, b) => a.startYear - b.startYear);
    return sorted[sorted.length - 1];
  }, [admissionsData]);

  // Reset Add Form
  const resetAddForm = () => {
    // Propose next year after latest
    if (latestRecord) {
      const nextStart = latestRecord.endYear;
      const nextEnd = nextStart + 1;
      setFormYear(`${nextStart}-${nextEnd}`);
    } else {
      setFormYear('2026-2027');
    }
    setFormMaleApplicants('2150');
    setFormFemaleApplicants('2350');
    setFormMaleAdmitted('1390');
    setFormFemaleAdmitted('1510');
    setFormStatus('VERIFIED');
    setFormSourceId('src-uoch-admissions');
    setFormNotes('Official university admission records validated by Registrar Office.');
    setSelectedBaselineCycleId(null);
    setFormErrors([]);
    setFormWarnings([]);
  };

  // Derive / Project from Previous Cycle
  const handleApplyPreviousCycle = (base: AdmissionRecord) => {
    const nextStart = base.startYear + 1;
    const nextEnd = base.endYear + 1;
    const nextCycleStr = `${nextStart}-${nextEnd}`;

    // Project ~5% expansion in admissions with regional female parity momentum
    const growthRate = 1.05;
    const projMaleApp = Math.round(base.maleApplicants * growthRate);
    const projFemaleApp = Math.round(base.femaleApplicants * 1.06);
    const projMaleAdm = Math.round(base.maleAdmitted * growthRate);
    const projFemaleAdm = Math.round(base.femaleAdmitted * 1.06);

    setFormYear(nextCycleStr);
    setFormMaleApplicants(projMaleApp.toString());
    setFormFemaleApplicants(projFemaleApp.toString());
    setFormMaleAdmitted(projMaleAdm.toString());
    setFormFemaleAdmitted(projFemaleAdm.toString());
    setFormStatus('ESTIMATED');
    setFormSourceId(base.sourceId || 'src-uoch-admissions');
    setFormNotes(`Projected from cycle ${base.academicYear} baseline (+5% capacity expansion with calibrated female growth).`);
    setSelectedBaselineCycleId(base.id);
    setFormErrors([]);
    setFormWarnings([]);
  };

  const handleOpenAddWithPrevious = (base: AdmissionRecord) => {
    handleApplyPreviousCycle(base);
    setEditingRecord(null);
    setIsAddModalOpen(true);
  };

  // Restore Default Baseline Dataset
  const handleRestoreBaseline = () => {
    setAdmissionsData(INITIAL_ADMISSION_DATA);
    try {
      localStorage.setItem('admimatrix_admissions_records', JSON.stringify(INITIAL_ADMISSION_DATA));
    } catch {
      // ignore
    }

    const audit: AuditLog = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: currentUserName,
      role: userRole,
      action: 'DATASET_RESET',
      targetEntity: 'Admissions Baseline Dataset',
      details: 'Restored admissions dataset to official calibrated baseline (2017-2026 cycles).'
    };
    setAuditLogs(prev => [audit, ...prev]);

    setIsRestoreModalOpen(false);
    setFeedbackMsg({
      type: 'success',
      text: 'Successfully restored default calibrated admissions baseline (2017–2026)!'
    });
  };

  // Open Edit Modal
  const handleOpenEdit = (record: AdmissionRecord) => {
    setEditingRecord(record);
    setFormYear(record.academicYear);
    setFormMaleApplicants(record.maleApplicants.toString());
    setFormFemaleApplicants(record.femaleApplicants.toString());
    setFormMaleAdmitted(record.maleAdmitted.toString());
    setFormFemaleAdmitted(record.femaleAdmitted.toString());
    setFormStatus(record.status);
    setFormSourceId(record.sourceId || 'src-uoch-admissions');
    setFormNotes(record.notes || '');
    setFormErrors([]);
    setFormWarnings([]);
  };

  // Validate form in real time
  const validateCurrentForm = (isEdit: boolean): boolean => {
    const errs: string[] = [];
    const warns: string[] = [];

    const match = formYear.trim().match(/^(\d{4})-(\d{4})$/);
    if (!match) {
      errs.push('Academic year must follow the standard format YYYY-YYYY (e.g. 2026-2027).');
    } else {
      const start = parseInt(match[1], 10);
      const end = parseInt(match[2], 10);
      if (end !== start + 1) {
        errs.push(`Invalid academic cycle: End year (${end}) must be start year (${start}) + 1.`);
      }
    }

    // Check duplicate year
    if (!isEdit) {
      if (admissionsData.some(r => r.academicYear.toLowerCase() === formYear.trim().toLowerCase())) {
        errs.push(`A record for academic cycle "${formYear.trim()}" already exists in the database.`);
      }
    } else if (editingRecord) {
      if (
        formYear.trim().toLowerCase() !== editingRecord.academicYear.toLowerCase() &&
        admissionsData.some(r => r.academicYear.toLowerCase() === formYear.trim().toLowerCase())
      ) {
        errs.push(`Cannot rename to "${formYear.trim()}" because another cycle already uses this year.`);
      }
    }

    if (parsedTotalApp <= 0) {
      errs.push('Total applicants must be greater than zero.');
    }
    if (parsedTotalAdm <= 0) {
      errs.push('Total admitted students must be greater than zero.');
    }
    if (parsedMaleAdm > parsedMaleApp) {
      errs.push(`Male admitted (${parsedMaleAdm}) cannot exceed male applicants (${parsedMaleApp}).`);
    }
    if (parsedFemaleAdm > parsedFemaleApp) {
      errs.push(`Female admitted (${parsedFemaleAdm}) cannot exceed female applicants (${parsedFemaleApp}).`);
    }
    if (parsedTotalAdm > parsedTotalApp) {
      errs.push(`Total admitted (${parsedTotalAdm}) cannot exceed total applicants (${parsedTotalApp}).`);
    }

    if (calculatedYieldRate > 85) {
      warns.push(`High admission yield (${calculatedYieldRate}%). Verify that capacity constraints were observed.`);
    }

    setFormErrors(errs);
    setFormWarnings(warns);
    return errs.length === 0;
  };

  // Save New Record (CREATE)
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCurrentForm(false)) return;

    const match = formYear.trim().match(/^(\d{4})-(\d{4})$/)!;
    const startYear = parseInt(match[1], 10);
    const endYear = parseInt(match[2], 10);

    const newRecord: AdmissionRecord = {
      id: `adm-${Date.now()}`,
      academicYear: formYear.trim(),
      startYear,
      endYear,
      totalApplicants: parsedTotalApp,
      maleApplicants: parsedMaleApp,
      femaleApplicants: parsedFemaleApp,
      totalAdmitted: parsedTotalAdm,
      maleAdmitted: parsedMaleAdm,
      femaleAdmitted: parsedFemaleAdm,
      femaleAdmissionRatio: calculatedFemaleRatio,
      maleAdmissionRatio: calculatedMaleRatio,
      sourceId: formSourceId.trim() || 'src-uoch-admissions',
      status: formStatus,
      notes: formNotes.trim() || undefined
    };

    setAdmissionsData(prev => [...prev, newRecord].sort((a, b) => a.startYear - b.startYear));

    // Audit log
    const audit: AuditLog = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: currentUserName,
      role: userRole,
      action: 'MANUAL_RECORD_ADD',
      targetEntity: `Admission Cycle ${newRecord.academicYear}`,
      details: `Created new admission cycle ${newRecord.academicYear} with ${newRecord.totalAdmitted} admitted (${newRecord.femaleAdmissionRatio}% female ratio).`
    };
    setAuditLogs(prev => [audit, ...prev]);

    setIsAddModalOpen(false);
    setFeedbackMsg({
      type: 'success',
      text: `Successfully created admission record for academic cycle ${newRecord.academicYear}!`
    });
  };

  // Update Existing Record (UPDATE)
  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    if (!validateCurrentForm(true)) return;

    const match = formYear.trim().match(/^(\d{4})-(\d{4})$/)!;
    const startYear = parseInt(match[1], 10);
    const endYear = parseInt(match[2], 10);

    const updatedRecord: AdmissionRecord = {
      ...editingRecord,
      academicYear: formYear.trim(),
      startYear,
      endYear,
      totalApplicants: parsedTotalApp,
      maleApplicants: parsedMaleApp,
      femaleApplicants: parsedFemaleApp,
      totalAdmitted: parsedTotalAdm,
      maleAdmitted: parsedMaleAdm,
      femaleAdmitted: parsedFemaleAdm,
      femaleAdmissionRatio: calculatedFemaleRatio,
      maleAdmissionRatio: calculatedMaleRatio,
      sourceId: formSourceId.trim() || 'src-uoch-admissions',
      status: formStatus,
      notes: formNotes.trim() || undefined
    };

    setAdmissionsData(prev =>
      prev.map(r => (r.id === editingRecord.id ? updatedRecord : r)).sort((a, b) => a.startYear - b.startYear)
    );

    // Audit log
    const audit: AuditLog = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: currentUserName,
      role: userRole,
      action: 'RECORD_UPDATE',
      targetEntity: `Admission Cycle ${updatedRecord.academicYear}`,
      details: `Updated cycle ${updatedRecord.academicYear}: Admitted=${updatedRecord.totalAdmitted} (F:${updatedRecord.femaleAdmitted}, M:${updatedRecord.maleAdmitted}), Status=${updatedRecord.status}.`
    };
    setAuditLogs(prev => [audit, ...prev]);

    setEditingRecord(null);
    setFeedbackMsg({
      type: 'success',
      text: `Successfully updated admission record for cycle ${updatedRecord.academicYear}!`
    });
  };

  // Delete Record (DELETE)
  const handleConfirmDelete = () => {
    if (!recordToDelete) return;

    setAdmissionsData(prev => prev.filter(r => r.id !== recordToDelete.id));

    // Audit log
    const audit: AuditLog = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: currentUserName,
      role: userRole,
      action: 'RECORD_DELETE',
      targetEntity: `Admission Cycle ${recordToDelete.academicYear}`,
      details: `Deleted admission record for ${recordToDelete.academicYear} (Total admitted: ${recordToDelete.totalAdmitted}).`
    };
    setAuditLogs(prev => [audit, ...prev]);

    const deletedYear = recordToDelete.academicYear;
    setRecordToDelete(null);
    setFeedbackMsg({
      type: 'success',
      text: `Deleted admission record for cycle ${deletedYear}.`
    });
  };

  // CSV Ingestion Handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      setCsvContent(content);
      const report = validateAdmissionCSV(content);
      setCsvReport(report);
      setCsvSuccessMsg(null);
    };
    reader.readAsText(file);
  };

  const loadSampleValidCSV = () => {
    const sample = `academic_year,total_applicants,male_applicants,female_applicants,total_admitted,male_admitted,female_admitted,notes
2026-2027,4500,2150,2350,2900,1390,1510,Validated Fall 2026 admission cohort
2027-2028,4800,2250,2550,3100,1460,1640,Expanded STEM faculty capacity`;
    setCsvContent(sample);
    setCsvReport(validateAdmissionCSV(sample));
    setCsvSuccessMsg(null);
  };

  const loadSampleErroneousCSV = () => {
    const corrupted = `academic_year,total_applicants,male_applicants,female_applicants,total_admitted,male_admitted,female_admitted,notes
2026-2027,4500,2150,2350,2900,1300,1500,CORRUPTED: 1300+1500=2800 != 2900 total admitted!
2027-2028,4000,2000,2000,4500,2200,2300,CORRUPTED: 4500 admitted exceeds 4000 total applicants!`;
    setCsvContent(corrupted);
    setCsvReport(validateAdmissionCSV(corrupted));
    setCsvSuccessMsg(null);
  };

  const handleCommitCsvImport = () => {
    if (!csvReport || !csvReport.isValid || csvReport.records.length === 0) return;

    const newRecords = csvReport.records;
    setAdmissionsData(prev => {
      const newYearSet = new Set(newRecords.map(r => r.academicYear));
      const filtered = prev.filter(r => !newYearSet.has(r.academicYear));
      return [...filtered, ...newRecords].sort((a, b) => a.startYear - b.startYear);
    });

    const audit: AuditLog = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: currentUserName,
      role: userRole,
      action: 'CSV_DATA_IMPORT',
      targetEntity: 'admission_data',
      details: `Committed ${newRecords.length} validated admission records via CSV pipeline.`
    };
    setAuditLogs(prev => [audit, ...prev]);

    setCsvSuccessMsg(`Successfully committed ${newRecords.length} records into the active database.`);
    setCsvContent('');
    setCsvReport(null);
    setActiveSubTab('RECORDS');
  };

  // Export current records as CSV
  const handleExportCSV = () => {
    const headers = [
      'academic_year',
      'total_applicants',
      'male_applicants',
      'female_applicants',
      'total_admitted',
      'male_admitted',
      'female_admitted',
      'female_ratio_pct',
      'male_ratio_pct',
      'yield_rate_pct',
      'status',
      'notes'
    ];

    const rows = admissionsData.map(r => {
      const yieldRate = ((r.totalAdmitted / (r.totalApplicants || 1)) * 100).toFixed(1);
      return [
        r.academicYear,
        r.totalApplicants,
        r.maleApplicants,
        r.femaleApplicants,
        r.totalAdmitted,
        r.maleAdmitted,
        r.femaleAdmitted,
        r.femaleAdmissionRatio,
        r.maleAdmissionRatio,
        yieldRate,
        r.status,
        `"${(r.notes || '').replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvText = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `uoch_admissions_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="admissions-crud-master-container" className="space-y-5">
      {/* Top Banner & Mode Switcher */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center space-x-2">
                <span>University of Chitral Admission Records Master CRUD</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage historical admission cycles, applicant headcounts, gender parity ratios, and cohort demographics.
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 text-xs">
            <button
              onClick={() => setActiveSubTab('RECORDS')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                activeSubTab === 'RECORDS'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Records Table ({admissionsData.length})</span>
            </button>
            <button
              onClick={() => setActiveSubTab('INGESTION')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                activeSubTab === 'INGESTION'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>CSV Batch Ingestion</span>
            </button>
          </div>

          <button
            onClick={() => {
              resetAddForm();
              setIsAddModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-purple-700 hover:bg-purple-600 text-white text-xs font-bold transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md hover:shadow-purple-900/20 active:scale-95 flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Admission Record</span>
          </button>

          <button
            type="button"
            id="btn-restore-admissions-baseline"
            onClick={() => setIsRestoreModalOpen(true)}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 transition flex items-center space-x-1.5 cursor-pointer"
            title="Restore Official Calibrated Admissions Baseline (2017-2026)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Restore Baseline</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 transition flex items-center space-x-1.5 cursor-pointer"
            title="Download CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Success / Info Feedback Banner */}
      {feedbackMsg && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between shadow-xs ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span className="font-medium">{feedbackMsg.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMsg(null)}
            className="font-bold text-xs hover:underline cursor-pointer ml-3"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* SUBTAB 1: ADMISSION RECORDS MASTER TABLE & CRUD */}
      {activeSubTab === 'RECORDS' && (
        <div className="space-y-4">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                Recorded Cycles
              </span>
              <div className="flex items-baseline space-x-2">
                <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
                  {totalCycles}
                </span>
                <span className="text-xs text-slate-400">cohorts</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">2017 to latest active</p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                Total Admitted Headcount
              </span>
              <div className="flex items-baseline space-x-2">
                <span className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400 font-mono">
                  {totalHistoricAdmitted.toLocaleString()}
                </span>
                <span className="text-xs text-slate-400">students</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Across all historical cycles</p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                Latest Female Ratio
              </span>
              <div className="flex items-baseline space-x-2">
                <span className="text-xl sm:text-2xl font-black text-pink-600 dark:text-pink-400 font-mono">
                  {latestRecord?.femaleAdmissionRatio || 0}%
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-300">
                  {latestRecord?.femaleAdmitted} Females
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Cycle {latestRecord?.academicYear}</p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                Latest Admission Yield
              </span>
              <div className="flex items-baseline space-x-2">
                <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  {latestRecord
                    ? ((latestRecord.totalAdmitted / (latestRecord.totalApplicants || 1)) * 100).toFixed(1)
                    : 0}
                  %
                </span>
                <span className="text-xs text-slate-400">yield</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                {latestRecord?.totalAdmitted} of {latestRecord?.totalApplicants} applicants
              </p>
            </div>
          </div>

          {/* Search, Filter, Sort Toolbar */}
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search cycle (e.g. 2024, 2026) or notes..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
              <div className="flex items-center space-x-1.5 text-xs">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-500 dark:text-slate-400 font-medium">Status:</span>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  <option value="ALL">All Statuses ({admissionsData.length})</option>
                  <option value="VERIFIED">Verified</option>
                  <option value="SYNTHETIC">Synthetic</option>
                  <option value="SAMPLE">Sample</option>
                  <option value="ESTIMATED">Estimated</option>
                  <option value="UNDER_REVIEW">Under Review</option>
                </select>
              </div>

              <div className="flex items-center space-x-1.5 text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Sort:</span>
                <select
                  value={sortOrder}
                  onChange={e => setSortOrder(e.target.value as any)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  <option value="YEAR_DESC">Year: Newest First</option>
                  <option value="YEAR_ASC">Year: Oldest First</option>
                  <option value="ADMITTED_DESC">Admitted: Highest First</option>
                  <option value="FEMALE_RATIO_DESC">Female Ratio: Highest First</option>
                </select>
              </div>

              {(searchTerm || statusFilter !== 'ALL') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('ALL');
                    setSortOrder('YEAR_DESC');
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  title="Reset Filters"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* THE COMPREHENSIVE ADMISSIONS MASTER TABLE WITH CRUD */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Comprehensive Admission Records (2017–2026)
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  Showing {processedRecords.length} of {admissionsData.length} records
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Academic Year</th>
                    <th className="py-3 px-4 text-right">Applicants (M / F / Total)</th>
                    <th className="py-3 px-4 text-right">Admitted (M / F / Total)</th>
                    <th className="py-3 px-4 text-right">Female Ratio (%)</th>
                    <th className="py-3 px-4 text-right">Male Ratio (%)</th>
                    <th className="py-3 px-4 text-right">Yield Rate</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Context Notes</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {processedRecords.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-slate-400" />
                        <p className="font-semibold text-sm">No admission records found matching your filters.</p>
                        <button
                          onClick={() => {
                            setSearchTerm('');
                            setStatusFilter('ALL');
                          }}
                          className="mt-2 text-xs text-purple-600 dark:text-purple-400 hover:underline font-bold"
                        >
                          Clear search filters
                        </button>
                      </td>
                    </tr>
                  ) : (
                    processedRecords.map(r => {
                      const yieldRate = ((r.totalAdmitted / (r.totalApplicants || 1)) * 100).toFixed(1);
                      return (
                        <tr
                          key={r.id}
                          className="hover:bg-purple-50/40 dark:hover:bg-slate-800/40 transition duration-150"
                        >
                          <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700">
                              {r.academicYear}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono">
                            <span className="text-blue-600 dark:text-blue-400">{r.maleApplicants}</span>
                            <span className="text-slate-400 mx-1">/</span>
                            <span className="text-pink-600 dark:text-pink-400">{r.femaleApplicants}</span>
                            <span className="text-slate-400 mx-1">/</span>
                            <span className="font-semibold text-slate-900 dark:text-white">{r.totalApplicants}</span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono">
                            <span className="text-blue-600 dark:text-blue-400 font-medium">{r.maleAdmitted}</span>
                            <span className="text-slate-400 mx-1">/</span>
                            <span className="text-pink-600 dark:text-pink-400 font-medium">{r.femaleAdmitted}</span>
                            <span className="text-slate-400 mx-1">/</span>
                            <span className="font-bold text-slate-900 dark:text-white">{r.totalAdmitted}</span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-pink-600 dark:text-pink-400">
                            {r.femaleAdmissionRatio}%
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                            {r.maleAdmissionRatio}%
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-600 dark:text-slate-300">
                            {yieldRate}%
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 text-[10px] rounded font-semibold border ${
                                r.status === 'VERIFIED'
                                  ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                  : r.status === 'SYNTHETIC'
                                  ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                              }`}
                            >
                              {r.status}
                            </span>
                          </td>
                          <td
                            className="py-3 px-4 text-slate-500 dark:text-slate-400 max-w-xs truncate text-[11px]"
                            title={r.notes}
                          >
                            {r.notes || 'Recorded UOCH cycle.'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center space-x-1.5">
                              <button
                                onClick={() => handleOpenAddWithPrevious(r)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-purple-100 dark:hover:bg-purple-950/60 transition cursor-pointer"
                                title={`Project next academic cycle from ${r.academicYear} record`}
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleOpenEdit(r)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-purple-100 dark:hover:bg-purple-950/60 transition cursor-pointer"
                                title="Edit this record"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setRecordToDelete(r)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-950/60 transition cursor-pointer"
                                title="Delete this record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: CSV INGESTION & PIPELINE */}
      {activeSubTab === 'INGESTION' && (
        <div className="space-y-5">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
                <FileSpreadsheet className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>Deterministic Admissions Ingestion &amp; Validation Pipeline</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Upload or paste admissions data in CSV format. The pipeline validates columns, data types, and mathematical sum constraints before writing to the database.
              </p>
            </div>

            {/* Ingestion Evaluation Presets */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold mr-1">
                Validation Presets:
              </span>
              <button
                onClick={loadSampleValidCSV}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 cursor-pointer transition"
              >
                Load Valid Dataset
              </button>
              <button
                onClick={loadSampleErroneousCSV}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/50 cursor-pointer transition"
              >
                Load Corrupted Dataset (Trap Mathematical Violations)
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                  Upload .CSV File
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="block w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 dark:file:bg-purple-950 dark:file:text-purple-300 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                  Or Paste Raw CSV Data
                </label>
                <textarea
                  rows={4}
                  value={csvContent}
                  onChange={e => {
                    setCsvContent(e.target.value);
                    if (e.target.value.trim()) {
                      setCsvReport(validateAdmissionCSV(e.target.value));
                    } else {
                      setCsvReport(null);
                    }
                    setCsvSuccessMsg(null);
                  }}
                  placeholder="academic_year,total_applicants,male_applicants,female_applicants,total_admitted,male_admitted,female_admitted,notes"
                  className="w-full text-xs font-mono p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Validation Report */}
            {csvReport && (
              <div
                className={`p-4 rounded-xl border ${
                  csvReport.isValid
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
                    : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    {csvReport.isValid ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                    )}
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      Validation Report: {csvReport.isValid ? 'Valid & Ready to Commit' : 'Integrity Violations Trapped'}
                    </h4>
                  </div>

                  <span className="text-xs font-mono font-bold">
                    {csvReport.summary.validRows} / {csvReport.summary.totalRows} Rows Valid
                  </span>
                </div>

                {csvReport.errors.length > 0 && (
                  <div className="mt-3 space-y-1.5 text-xs text-rose-700 dark:text-rose-300">
                    <p className="font-bold">Blocking Integrity Errors ({csvReport.errors.length}):</p>
                    <ul className="list-disc pl-5 space-y-0.5">
                      {csvReport.errors.map((err, i) => (
                        <li key={i}>
                          [Row {err.rowNumber || 'Header'}] {err.fieldName}: {err.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-4 flex justify-end">
                  <button
                    disabled={!csvReport.isValid || csvReport.records.length === 0}
                    onClick={handleCommitCsvImport}
                    className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-600 disabled:opacity-40 text-white text-xs font-bold transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-xs active:scale-95 shadow-sm cursor-pointer disabled:hover:translate-y-0"
                  >
                    Commit {csvReport.records.length} Records to Active Database
                  </button>
                </div>
              </div>
            )}

            {csvSuccessMsg && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">{csvSuccessMsg}</p>
            )}
          </div>
        </div>
      )}

      {/* CREATE / ADD MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
              <div className="flex items-center space-x-2">
                <Plus className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                  Add Admission Record (Academic Cycle)
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
              {/* Form errors */}
              {formErrors.length > 0 && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300 space-y-1">
                  <p className="font-bold flex items-center space-x-1">
                    <AlertCircle className="w-4 h-4 mr-1 shrink-0" />
                    <span>Please correct the following errors:</span>
                  </p>
                  <ul className="list-disc pl-5 space-y-0.5">
                    {formErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Form warnings */}
              {formWarnings.length > 0 && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                  {formWarnings.map((warn, i) => (
                    <p key={i} className="flex items-center space-x-1">
                      <AlertTriangle className="w-3.5 h-3.5 mr-1 shrink-0" />
                      <span>{warn}</span>
                    </p>
                  ))}
                </div>
              )}

              {/* Quick Pre-fill / Project from Previous Cycle Bar */}
              <div className="p-3.5 rounded-xl bg-purple-50/80 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                  <span className="font-bold text-purple-900 dark:text-purple-200 flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                    <span>Pre-fill &amp; Project from Previous Cycle:</span>
                  </span>
                  <span className="text-[11px] text-purple-700 dark:text-purple-300 font-medium">
                    Auto-proposes next cycle (+5% expansion &amp; female trend)
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {admissionsData
                    .slice()
                    .sort((a, b) => b.startYear - a.startYear)
                    .map(baseRec => {
                      const isSelected = selectedBaselineCycleId === baseRec.id;
                      return (
                        <button
                          key={baseRec.id}
                          type="button"
                          onClick={() => handleApplyPreviousCycle(baseRec)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition border cursor-pointer flex items-center space-x-1.5 ${
                            isSelected
                              ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-purple-400 hover:text-purple-600'
                          }`}
                          title={`Derive from ${baseRec.academicYear}: ${baseRec.totalAdmitted.toLocaleString()} admitted (${baseRec.femaleAdmissionRatio}% F)`}
                        >
                          <span className="font-mono">{baseRec.academicYear}</span>
                          <span className="text-[10px] opacity-80">
                            ({baseRec.totalAdmitted.toLocaleString()} adm • {baseRec.femaleAdmissionRatio}% F)
                          </span>
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Academic Year & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Academic Year <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formYear}
                    onChange={e => setFormYear(e.target.value)}
                    placeholder="2026-2027"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono font-bold focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    required
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Format: YYYY-YYYY (e.g. 2026-2027)</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Verification Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={e => setFormStatus(e.target.value as VerificationStatus)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  >
                    <option value="VERIFIED">VERIFIED (Official Institutional Record)</option>
                    <option value="SYNTHETIC">SYNTHETIC (Simulated Projection)</option>
                    <option value="SAMPLE">SAMPLE (Draft / Baseline)</option>
                    <option value="ESTIMATED">ESTIMATED (Interim Assessment)</option>
                    <option value="UNDER_REVIEW">UNDER_REVIEW (Pending Audit)</option>
                  </select>
                </div>
              </div>

              {/* Applicants Section */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Applicant Volumes</span>
                  <span className="text-[11px] font-mono text-purple-600 dark:text-purple-400">
                    Total: {parsedTotalApp.toLocaleString()}
                  </span>
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-blue-600 dark:text-blue-400 mb-1">
                      Male Applicants
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formMaleApplicants}
                      onChange={e => setFormMaleApplicants(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-pink-600 dark:text-pink-400 mb-1">
                      Female Applicants
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formFemaleApplicants}
                      onChange={e => setFormFemaleApplicants(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold focus:ring-2 focus:ring-pink-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Admitted Students Section */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Admitted Headcounts</span>
                  <span className="text-[11px] font-mono text-purple-600 dark:text-purple-400">
                    Total: {parsedTotalAdm.toLocaleString()}
                  </span>
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-blue-600 dark:text-blue-400 mb-1">
                      Male Admitted
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formMaleAdmitted}
                      onChange={e => setFormMaleAdmitted(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-pink-600 dark:text-pink-400 mb-1">
                      Female Admitted
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formFemaleAdmitted}
                      onChange={e => setFormFemaleAdmitted(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold focus:ring-2 focus:ring-pink-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Real-time Math Summary Card */}
              <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-900 dark:text-purple-200 flex items-center space-x-1">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <span>Real-Time Computed Metrics</span>
                  </span>
                  <span className="text-[11px] text-purple-700 dark:text-purple-300 font-mono">
                    Yield: <strong>{calculatedYieldRate}%</strong>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="p-2 rounded bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-900">
                    <span className="text-pink-600 dark:text-pink-400 font-bold block">
                      Female Ratio: {calculatedFemaleRatio}%
                    </span>
                    <span className="text-slate-400 text-[10px]">
                      {parsedFemaleAdm} of {parsedTotalAdm} admitted
                    </span>
                  </div>
                  <div className="p-2 rounded bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-900">
                    <span className="text-blue-600 dark:text-blue-400 font-bold block">
                      Male Ratio: {calculatedMaleRatio}%
                    </span>
                    <span className="text-slate-400 text-[10px]">
                      {parsedMaleAdm} of {parsedTotalAdm} admitted
                    </span>
                  </div>
                </div>
              </div>

              {/* Context Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Provenance &amp; Context Notes
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  placeholder="Record source, department, or special cohort notes..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-600 text-white text-xs font-bold transition shadow-md cursor-pointer"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
              <div className="flex items-center space-x-2">
                <Edit2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                  Edit Admission Cycle: {editingRecord.academicYear}
                </h3>
              </div>
              <button
                onClick={() => setEditingRecord(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
              {/* Form errors */}
              {formErrors.length > 0 && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300 space-y-1">
                  <p className="font-bold flex items-center space-x-1">
                    <AlertCircle className="w-4 h-4 mr-1 shrink-0" />
                    <span>Please correct the following errors:</span>
                  </p>
                  <ul className="list-disc pl-5 space-y-0.5">
                    {formErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Form warnings */}
              {formWarnings.length > 0 && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                  {formWarnings.map((warn, i) => (
                    <p key={i} className="flex items-center space-x-1">
                      <AlertTriangle className="w-3.5 h-3.5 mr-1 shrink-0" />
                      <span>{warn}</span>
                    </p>
                  ))}
                </div>
              )}

              {/* Academic Year & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Academic Year <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formYear}
                    onChange={e => setFormYear(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono font-bold focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    required
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Format: YYYY-YYYY</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Verification Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={e => setFormStatus(e.target.value as VerificationStatus)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  >
                    <option value="VERIFIED">VERIFIED (Official Institutional Record)</option>
                    <option value="SYNTHETIC">SYNTHETIC (Simulated Projection)</option>
                    <option value="SAMPLE">SAMPLE (Draft / Baseline)</option>
                    <option value="ESTIMATED">ESTIMATED (Interim Assessment)</option>
                    <option value="UNDER_REVIEW">UNDER_REVIEW (Pending Audit)</option>
                  </select>
                </div>
              </div>

              {/* Applicants Section */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Applicant Volumes</span>
                  <span className="text-[11px] font-mono text-purple-600 dark:text-purple-400">
                    Total: {parsedTotalApp.toLocaleString()}
                  </span>
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-blue-600 dark:text-blue-400 mb-1">
                      Male Applicants
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formMaleApplicants}
                      onChange={e => setFormMaleApplicants(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-pink-600 dark:text-pink-400 mb-1">
                      Female Applicants
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formFemaleApplicants}
                      onChange={e => setFormFemaleApplicants(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold focus:ring-2 focus:ring-pink-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Admitted Students Section */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Admitted Headcounts</span>
                  <span className="text-[11px] font-mono text-purple-600 dark:text-purple-400">
                    Total: {parsedTotalAdm.toLocaleString()}
                  </span>
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-blue-600 dark:text-blue-400 mb-1">
                      Male Admitted
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formMaleAdmitted}
                      onChange={e => setFormMaleAdmitted(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-pink-600 dark:text-pink-400 mb-1">
                      Female Admitted
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formFemaleAdmitted}
                      onChange={e => setFormFemaleAdmitted(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold focus:ring-2 focus:ring-pink-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Real-time Math Summary Card */}
              <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-900 dark:text-purple-200 flex items-center space-x-1">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <span>Real-Time Recalculated Metrics</span>
                  </span>
                  <span className="text-[11px] text-purple-700 dark:text-purple-300 font-mono">
                    Yield: <strong>{calculatedYieldRate}%</strong>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="p-2 rounded bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-900">
                    <span className="text-pink-600 dark:text-pink-400 font-bold block">
                      Female Ratio: {calculatedFemaleRatio}%
                    </span>
                    <span className="text-slate-400 text-[10px]">
                      {parsedFemaleAdm} of {parsedTotalAdm} admitted
                    </span>
                  </div>
                  <div className="p-2 rounded bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-900">
                    <span className="text-blue-600 dark:text-blue-400 font-bold block">
                      Male Ratio: {calculatedMaleRatio}%
                    </span>
                    <span className="text-slate-400 text-[10px]">
                      {parsedMaleAdm} of {parsedTotalAdm} admitted
                    </span>
                  </div>
                </div>
              </div>

              {/* Context Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Provenance &amp; Context Notes
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  placeholder="Record source, department, or special cohort notes..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-600 text-white text-xs font-bold transition shadow-md cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {recordToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center space-x-3 text-rose-600 dark:text-rose-400">
              <div className="p-2.5 rounded-full bg-rose-100 dark:bg-rose-950/60">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Delete Admission Record?
              </h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to delete the admission cohort for{' '}
              <strong className="font-mono text-slate-900 dark:text-white">{recordToDelete.academicYear}</strong>?
              This record contains <strong>{recordToDelete.totalAdmitted.toLocaleString()}</strong> admitted students ({recordToDelete.femaleAdmissionRatio}% female ratio).
            </p>

            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-300">
              This action will be logged in the immutable Governance Audit Trail.
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setRecordToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-md cursor-pointer"
              >
                Yes, Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
      {/* RESTORE BASELINE MODAL */}
      {isRestoreModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setIsRestoreModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <span className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                <RotateCcw className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Restore Calibrated Baseline?
                </h3>
                <p className="text-xs text-slate-500">
                  Reset University of Chitral admissions dataset (2017–2026)
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
              This will reset the admissions table to the official 2017–2026 calibrated baseline dataset. Any unverified custom records will be replaced. This action is recorded in the platform audit log.
            </p>

            <div className="flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsRestoreModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRestoreBaseline}
                className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-600 text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center space-x-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Confirm Restore</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
