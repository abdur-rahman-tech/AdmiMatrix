/**
 * AdmiMatrix Institutional Database & Memory Service
 * 
 * Provides high-performance persistent storage for University of Chitral institutional records,
 * multi-horizon forecast snapshots, audit logs, and AI query memory.
 * 
 * Dual-tier architecture:
 * 1. Tier 1 (Active Edge Memory): High-speed transactional IndexedDB (AdmiMatrixMemoryDB)
 * 2. Tier 2 (Enterprise Deployment): PostgreSQL / Cloud SQL Relational Schema
 */

import { AdmissionRecord, PopulationRecord, AuditLog, ForecastResult } from '../../types';
import { INITIAL_ADMISSION_DATA, INITIAL_POPULATION_DATA } from '../../data/defaultDatasets';

export interface ForecastSnapshot {
  id: string;
  name: string;
  timestamp: string;
  horizonYears: number;
  selectedModel: string;
  scenario: string;
  capacity: number;
  bestModelId: string;
  bestModelRmse: number;
  predictions: Array<{
    academicYear: string;
    projectedTotal: number;
    projectedMale: number;
    projectedFemale: number;
    femaleRatio: number;
  }>;
}

export interface DbMemoryStats {
  admissionsCount: number;
  populationCount: number;
  forecastSnapshotsCount: number;
  auditLogsCount: number;
  dbName: string;
  dbVersion: number;
  storageEngine: string;
  lastSyncTimestamp: string;
}

const DB_NAME = 'AdmiMatrix_Institutional_Memory_v1';
const DB_VERSION = 1;

class DatabaseService {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase> | null = null;

  /**
   * Initializes and opens the IndexedDB database with structured object stores.
   */
  public async init(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB is not supported in this environment.'));
        return;
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 1. Admissions History Object Store
        if (!db.objectStoreNames.contains('admissions')) {
          const admStore = db.createObjectStore('admissions', { keyPath: 'id' });
          admStore.createIndex('academicYear', 'academicYear', { unique: false });
          admStore.createIndex('startYear', 'startYear', { unique: false });
          admStore.createIndex('status', 'status', { unique: false });
        }

        // 2. Population Census Object Store
        if (!db.objectStoreNames.contains('population')) {
          const popStore = db.createObjectStore('population', { keyPath: 'id' });
          popStore.createIndex('year', 'year', { unique: false });
          popStore.createIndex('district', 'district', { unique: false });
        }

        // 3. Multi-Horizon Forecast Snapshots Object Store
        if (!db.objectStoreNames.contains('forecast_snapshots')) {
          const snapStore = db.createObjectStore('forecast_snapshots', { keyPath: 'id' });
          snapStore.createIndex('timestamp', 'timestamp', { unique: false });
          snapStore.createIndex('selectedModel', 'selectedModel', { unique: false });
        }

        // 4. Institutional Audit Logs Object Store
        if (!db.objectStoreNames.contains('audit_logs')) {
          const auditStore = db.createObjectStore('audit_logs', { keyPath: 'id' });
          auditStore.createIndex('timestamp', 'timestamp', { unique: false });
          auditStore.createIndex('action', 'action', { unique: false });
        }

        // 5. AI Reasoning & Telemetry Cache Store
        if (!db.objectStoreNames.contains('ai_cache')) {
          db.createObjectStore('ai_cache', { keyPath: 'queryHash' });
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve(this.db);
      };

      request.onerror = (event) => {
        reject((event.target as IDBOpenDBRequest).error);
      };
    });

    return this.initPromise;
  }

  /**
   * Seeds default verified institutional records into memory if empty.
   */
  public async seedIfEmpty(): Promise<void> {
    const db = await this.init();
    const count = await this.getCount('admissions');
    if (count === 0) {
      await this.saveAdmissions(INITIAL_ADMISSION_DATA);
      await this.savePopulation(INITIAL_POPULATION_DATA);
      await this.saveAuditLog({
        id: 'audit-db-seed',
        timestamp: new Date().toISOString(),
        user: 'system@admimatrix.org',
        role: 'ADMIN',
        action: 'DATABASE_BOOTSTRAP',
        targetEntity: 'IndexedDB Memory Engine',
        details: 'Seeded initial verified PBS census records (1998-2023) and official UOCH admissions (2017-2026).'
      });
    }
  }

  // --- ADMISSIONS OPERATIONS ---
  public async saveAdmissions(records: AdmissionRecord[]): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('admissions', 'readwrite');
      const store = tx.objectStore('admissions');
      records.forEach(r => store.put(r));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  public async getAllAdmissions(): Promise<AdmissionRecord[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('admissions', 'readonly');
      const store = tx.objectStore('admissions');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  // --- POPULATION OPERATIONS ---
  public async savePopulation(records: PopulationRecord[]): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('population', 'readwrite');
      const store = tx.objectStore('population');
      records.forEach(r => store.put(r));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  public async getAllPopulation(): Promise<PopulationRecord[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('population', 'readonly');
      const store = tx.objectStore('population');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  // --- FORECAST SNAPSHOT OPERATIONS ---
  public async saveForecastSnapshot(snapshot: ForecastSnapshot): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('forecast_snapshots', 'readwrite');
      const store = tx.objectStore('forecast_snapshots');
      store.put(snapshot);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  public async getAllForecastSnapshots(): Promise<ForecastSnapshot[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('forecast_snapshots', 'readonly');
      const store = tx.objectStore('forecast_snapshots');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  // --- AUDIT LOG OPERATIONS ---
  public async saveAuditLog(log: AuditLog): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('audit_logs', 'readwrite');
      const store = tx.objectStore('audit_logs');
      store.put(log);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  public async getAllAuditLogs(): Promise<AuditLog[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('audit_logs', 'readonly');
      const store = tx.objectStore('audit_logs');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  // --- METRICS & STATS ---
  public async getStats(): Promise<DbMemoryStats> {
    await this.init();
    const [admCount, popCount, snapCount, auditCount] = await Promise.all([
      this.getCount('admissions'),
      this.getCount('population'),
      this.getCount('forecast_snapshots'),
      this.getCount('audit_logs')
    ]);

    return {
      admissionsCount: admCount,
      populationCount: popCount,
      forecastSnapshotsCount: snapCount,
      auditLogsCount: auditCount,
      dbName: DB_NAME,
      dbVersion: DB_VERSION,
      storageEngine: 'IndexedDB (W3C High-Performance Client Engine)',
      lastSyncTimestamp: new Date().toISOString()
    };
  }

  private async getCount(storeName: string): Promise<number> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Exports full database memory as JSON string for backup and migration.
   */
  public async exportDatabaseJson(): Promise<string> {
    const [admissions, population, snapshots, audit] = await Promise.all([
      this.getAllAdmissions(),
      this.getAllPopulation(),
      this.getAllForecastSnapshots(),
      this.getAllAuditLogs()
    ]);

    const backup = {
      meta: {
        app: 'AdmiMatrix',
        exportDate: new Date().toISOString(),
        institution: 'University of Chitral',
        version: '1.0'
      },
      admissions,
      population,
      snapshots,
      audit
    };

    return JSON.stringify(backup, null, 2);
  }

  /**
   * Generates production-grade PostgreSQL DDL SQL script for enterprise Cloud SQL migration.
   */
  public generatePostgresSqlDump(): string {
    return `-- ====================================================================
-- AdmiMatrix Institutional Database Schema
-- Recommended Production Enterprise Database: PostgreSQL / Cloud SQL
-- Target Institution: University of Chitral (UOCH), Khyber Pakhtunkhwa
-- ====================================================================

-- 1. ADMISSION RECORDS TABLE
CREATE TABLE IF NOT EXISTS uoch_admission_records (
    id VARCHAR(64) PRIMARY KEY,
    academic_year VARCHAR(16) NOT NULL UNIQUE,
    start_year INTEGER NOT NULL,
    end_year INTEGER NOT NULL,
    total_applicants INTEGER NOT NULL CHECK (total_applicants >= 0),
    male_applicants INTEGER NOT NULL CHECK (male_applicants >= 0),
    female_applicants INTEGER NOT NULL CHECK (female_applicants >= 0),
    total_admitted INTEGER NOT NULL CHECK (total_admitted >= 0),
    male_admitted INTEGER NOT NULL CHECK (male_admitted >= 0),
    female_admitted INTEGER NOT NULL CHECK (female_admitted >= 0),
    male_admission_ratio NUMERIC(5,2) NOT NULL,
    female_admission_ratio NUMERIC(5,2) NOT NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'VERIFIED',
    source_id VARCHAR(64) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_gender_headcount_invariance CHECK (male_admitted + female_admitted = total_admitted)
);

CREATE INDEX IF NOT EXISTS idx_adm_start_year ON uoch_admission_records(start_year);
CREATE INDEX IF NOT EXISTS idx_adm_status ON uoch_admission_records(status);

-- 2. POPULATION CENSUS ARCHIVE TABLE
CREATE TABLE IF NOT EXISTS pbs_population_census (
    id VARCHAR(64) PRIMARY KEY,
    year INTEGER NOT NULL,
    district VARCHAR(64) NOT NULL,
    total_population INTEGER NOT NULL CHECK (total_population > 0),
    male_population INTEGER NOT NULL CHECK (male_population >= 0),
    female_population INTEGER NOT NULL CHECK (female_population >= 0),
    male_percentage NUMERIC(5,2) NOT NULL,
    female_percentage NUMERIC(5,2) NOT NULL,
    annual_growth_rate NUMERIC(4,2) NOT NULL,
    is_estimated BOOLEAN DEFAULT FALSE,
    source_id VARCHAR(64) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pop_year ON pbs_population_census(year);
CREATE INDEX IF NOT EXISTS idx_pop_district ON pbs_population_census(district);

-- 3. MULTI-HORIZON FORECAST RUNS TABLE
CREATE TABLE IF NOT EXISTS forecast_snapshots (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    horizon_years INTEGER NOT NULL CHECK (horizon_years IN (5, 6, 7)),
    selected_model VARCHAR(32) NOT NULL,
    scenario VARCHAR(32) NOT NULL DEFAULT 'BASELINE',
    capacity_limit INTEGER NOT NULL,
    best_model_id VARCHAR(32) NOT NULL,
    best_model_rmse NUMERIC(8,2) NOT NULL,
    predictions_json JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_forecast_created ON forecast_snapshots(created_at);

-- 4. INSTITUTIONAL AUDIT TRAIL TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    user_email VARCHAR(128) NOT NULL,
    role VARCHAR(32) NOT NULL,
    action VARCHAR(64) NOT NULL,
    target_entity VARCHAR(64) NOT NULL,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_time ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
`;
  }

  /**
   * Resets database memory back to verified institutional baseline.
   */
  public async resetToVerifiedBaseline(): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['admissions', 'population', 'forecast_snapshots', 'audit_logs'], 'readwrite');
      tx.objectStore('admissions').clear();
      tx.objectStore('population').clear();
      tx.objectStore('forecast_snapshots').clear();
      tx.objectStore('audit_logs').clear();

      INITIAL_ADMISSION_DATA.forEach(r => tx.objectStore('admissions').put(r));
      INITIAL_POPULATION_DATA.forEach(r => tx.objectStore('population').put(r));

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}

export const dbService = new DatabaseService();
