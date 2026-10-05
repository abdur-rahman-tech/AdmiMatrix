import React, { useState, useEffect } from 'react';
import {
  Database,
  HardDrive,
  Save,
  Download,
  RotateCcw,
  CheckCircle2,
  FileCode,
  Layers,
  Server,
  ShieldCheck,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { dbService, DbMemoryStats, ForecastSnapshot } from '../../lib/db/databaseService';
import { AdmissionRecord, PopulationRecord, ForecastResult } from '../../types';

interface DatabaseMemoryManagerProps {
  admissionsData: AdmissionRecord[];
  populationData: PopulationRecord[];
  forecastResult?: ForecastResult;
  onRestoreData?: (admissions: AdmissionRecord[], population: PopulationRecord[]) => void;
}

export const DatabaseMemoryManager: React.FC<DatabaseMemoryManagerProps> = ({
  admissionsData,
  populationData,
  forecastResult,
  onRestoreData
}) => {
  const [stats, setStats] = useState<DbMemoryStats | null>(null);
  const [snapshots, setSnapshots] = useState<ForecastSnapshot[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'MEMORY' | 'SQL_SCHEMA' | 'ARCHITECTURE'>('MEMORY');

  // Load database stats
  const refreshStats = async () => {
    try {
      await dbService.seedIfEmpty();
      const currentStats = await dbService.getStats();
      setStats(currentStats);
      const allSnaps = await dbService.getAllForecastSnapshots();
      setSnapshots(allSnaps);
    } catch (e) {
      console.error('Failed to load database stats:', e);
    }
  };

  useEffect(() => {
    refreshStats();
  }, []);

  // Save current active state to database memory
  const handleSaveToMemory = async () => {
    setIsSaving(true);
    try {
      await dbService.saveAdmissions(admissionsData);
      await dbService.savePopulation(populationData);

      // Save forecast snapshot if available
      if (forecastResult) {
        const snap: ForecastSnapshot = {
          id: `snap-${Date.now()}`,
          name: `Forecast Snapshot (${forecastResult.modelId} - ${forecastResult.horizonYears}Y)`,
          timestamp: new Date().toISOString(),
          horizonYears: forecastResult.horizonYears,
          selectedModel: forecastResult.selectedModelId || forecastResult.modelId,
          scenario: forecastResult.scenario,
          capacity: forecastResult.planningCapacity,
          bestModelId: forecastResult.selectedModelId || forecastResult.modelId,
          bestModelRmse: forecastResult.metrics?.rmse || 0,
          predictions: forecastResult.predictions.map(p => ({
            academicYear: p.academicYear,
            projectedTotal: p.totalAdmitted,
            projectedMale: p.maleAdmitted,
            projectedFemale: p.femaleAdmitted,
            femaleRatio: p.femaleRatio
          }))
        };
        await dbService.saveForecastSnapshot(snap);
      }

      await refreshStats();
      setSaveSuccessMsg('Current state & forecast snapshot securely committed to Database Memory!');
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  // Restore memory back into application
  const handleRestoreFromMemory = async () => {
    try {
      const adms = await dbService.getAllAdmissions();
      const pops = await dbService.getAllPopulation();
      if (onRestoreData && adms.length > 0) {
        onRestoreData(adms, pops);
        setSaveSuccessMsg(`Successfully restored ${adms.length} admissions and ${pops.length} census records from Database Memory.`);
        setTimeout(() => setSaveSuccessMsg(null), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Export as JSON
  const handleExportJson = async () => {
    const jsonStr = await dbService.exportDatabaseJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admimatrix_database_memory_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export as SQL
  const handleExportSql = () => {
    const sqlStr = dbService.generatePostgresSqlDump();
    const blob = new Blob([sqlStr], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admimatrix_schema_postgresql_${new Date().toISOString().slice(0, 10)}.sql`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
      {/* Header Banner */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-emerald-500/10 via-purple-500/10 to-transparent">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-xs">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Institutional Database &amp; Memory Engine
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  Dual-Tier Architecture
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Transactional persistence carrying historical admissions, PBS census tables, and multi-horizon forecast memory.
              </p>
            </div>
          </div>

          {/* Quick Memory Commit CTA */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSaveToMemory}
              disabled={isSaving}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Committing...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Commit to DB Memory</span>
                </>
              )}
            </button>

            <button
              onClick={handleExportJson}
              className="flex items-center space-x-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
          </div>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center space-x-2 mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800/60">
          <button
            onClick={() => setActiveTab('MEMORY')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'MEMORY'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Live Memory State
          </button>
          <button
            onClick={() => setActiveTab('ARCHITECTURE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'ARCHITECTURE'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Recommended Database Spec
          </button>
          <button
            onClick={() => setActiveTab('SQL_SCHEMA')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'SQL_SCHEMA'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            PostgreSQL / Cloud SQL DDL
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {saveSuccessMsg && (
        <div className="mx-5 mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">{saveSuccessMsg}</span>
        </div>
      )}

      {/* TAB 1: LIVE MEMORY STATE */}
      {activeTab === 'MEMORY' && (
        <div className="p-5 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Admissions In Memory
              </span>
              <span className="text-xl font-mono font-bold text-slate-900 dark:text-white">
                {stats?.admissionsCount ?? admissionsData.length}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">2017–2026 cycles</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Census Timepoints
              </span>
              <span className="text-xl font-mono font-bold text-slate-900 dark:text-white">
                {stats?.populationCount ?? populationData.length}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">PBS 1998–2025</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Forecast Snapshots
              </span>
              <span className="text-xl font-mono font-bold text-slate-900 dark:text-white">
                {stats?.forecastSnapshotsCount ?? snapshots.length}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Multi-horizon models</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Memory Engine
              </span>
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 block truncate">
                IndexedDB v{stats?.dbVersion || 1}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Zero-latency Edge</span>
            </div>
          </div>

          {/* Forecast Snapshots History in Memory */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                <HardDrive className="w-3.5 h-3.5 text-emerald-600" />
                <span>Forecast Snapshots Carried in Memory ({snapshots.length})</span>
              </h4>
              {onRestoreData && (
                <button
                  onClick={handleRestoreFromMemory}
                  className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center space-x-1 font-semibold cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Restore Working State from DB</span>
                </button>
              )}
            </div>

            {snapshots.length === 0 ? (
              <div className="p-6 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2">
                <p className="text-xs text-slate-500">
                  No custom forecast snapshots saved yet. Click <strong>"Commit to DB Memory"</strong> above to store the active forecast run and verified datasets into persistent storage.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {snapshots.slice(0, 4).map((snap) => (
                  <div
                    key={snap.id}
                    className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white truncate max-w-[200px]">
                        {snap.name}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold">
                        {snap.horizonYears} Years
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Model</span>
                        <span className="font-mono font-semibold">{snap.selectedModel}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Saved</span>
                        <span className="font-mono">{new Date(snap.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: RECOMMENDED ARCHITECTURE */}
      {activeTab === 'ARCHITECTURE' && (
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tier 1 */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600">
                  <HardDrive className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Tier 1: Client Edge Memory Database
                  </h5>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    IndexedDB (Active &amp; Operational Now)
                  </span>
                </div>
              </div>
              <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 list-disc list-inside">
                <li><strong>Zero Network Latency:</strong> Instant reads and writes without waiting on external roundtrips.</li>
                <li><strong>No 5MB Storage Cap:</strong> Bypasses localStorage limitations to carry tens of thousands of admission rows.</li>
                <li><strong>Indexed Multi-Field Queries:</strong> Instant queries across academic year, start year, and status.</li>
                <li><strong>Offline Resilience:</strong> Retains full institutional memory during high-altitude Hindu Kush internet outages.</li>
              </ul>
            </div>

            {/* Tier 2 */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-950/80 text-purple-600">
                  <Server className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Tier 2: Enterprise Relational Database
                  </h5>
                  <span className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold">
                    PostgreSQL / Google Cloud SQL
                  </span>
                </div>
              </div>
              <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 list-disc list-inside">
                <li><strong>Strict ACID Transactions:</strong> Enforces math invariants (`male + female = total`) at schema level.</li>
                <li><strong>Centralized Multi-Campus Sync:</strong> Unifies Main Campus and Booni Campus student registries.</li>
                <li><strong>Audit Compliance:</strong> Tamper-evident institutional audit tables for HEC accreditation defense.</li>
                <li><strong>High-Speed Aggregations:</strong> Window functions and time-series rollups over 20+ years of census data.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: POSTGRESQL DDL SCHEMA */}
      {activeTab === 'SQL_SCHEMA' && (
        <div className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center space-x-1.5">
              <FileCode className="w-3.5 h-3.5 text-purple-600" />
              <span>Production-Ready PostgreSQL / Cloud SQL DDL Script</span>
            </span>
            <button
              onClick={handleExportSql}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .sql File</span>
            </button>
          </div>

          <pre className="p-4 rounded-xl bg-slate-950 text-slate-200 font-mono text-[11px] overflow-x-auto max-h-72 border border-slate-800">
            {dbService.generatePostgresSqlDump()}
          </pre>
        </div>
      )}
    </div>
  );
};
