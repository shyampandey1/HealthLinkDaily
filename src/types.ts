/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface StockItem {
  id: string;
  name: string;
  nameHindi?: string;
  category: string;
  count: number;
  unit: string;
  criticalThreshold: number;
}

export interface Patient {
  id: string;
  name: string;
  gender: 'Male' | 'Female' | 'Other';
  age: number;
  type: 'OPD' | 'IPD';
  status: 'Admitted' | 'Discharged' | 'Transferred';
  time: string; // ISO string or simple hh:mm A
  contact?: string;
  vitals?: {
    bp?: string;
    pulse?: number;
    temp?: number;
  };
  notes?: string;
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  roleHindi?: string;
  active: boolean; // Attendance today
  phone?: string;
  shift: 'Day' | 'Night';
  checkInTime?: string;
}

export interface DailyReport {
  id: string;
  date: string; // YYYY-MM-DD
  stockCounts: { itemId: string; count: number }[];
  footfall: { opd: number; ipd: number };
  staffAttendance: { staffId: string; present: boolean }[];
  submittedBy: string;
  submittedAt: string; // ISO timestamp
  notes?: string;
}

export interface CentreData {
  id?: string;
  name: string;
  subName: string;
  type: string;
  lat: number | null;
  lng: number | null;
  address: string;
  transit: string;
  status: string;
  contact: string;
  beds: string;
}
