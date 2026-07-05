/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { db, isFirebaseReady } from '../config/firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { StockItem, Patient, StaffMember, DailyReport } from '../types';

/**
 * Fetch all clinical inventory supplies from Firestore
 */
export async function getFirestoreInventory(): Promise<StockItem[]> {
  if (!isFirebaseReady || !db) return [];
  try {
    const querySnapshot = await getDocs(collection(db, 'inventory'));
    const items: StockItem[] = [];
    querySnapshot.forEach((docSnap) => {
      items.push({ id: docSnap.id, ...docSnap.data() } as StockItem);
    });
    return items;
  } catch (err) {
    console.error('[Firestore Service] Error fetching inventory:', err);
    throw err;
  }
}

/**
 * Save or update stock item in Firestore
 */
export async function saveFirestoreInventoryItem(item: StockItem): Promise<void> {
  if (!isFirebaseReady || !db) return;
  try {
    const docRef = doc(db, 'inventory', item.id);
    await setDoc(docRef, item, { merge: true });
  } catch (err) {
    console.error('[Firestore Service] Error saving inventory item:', err);
    throw err;
  }
}

/**
 * Delete stock item from Firestore
 */
export async function deleteFirestoreInventoryItem(itemId: string): Promise<void> {
  if (!isFirebaseReady || !db) return;
  try {
    await deleteDoc(doc(db, 'inventory', itemId));
  } catch (err) {
    console.error('[Firestore Service] Error deleting inventory item:', err);
    throw err;
  }
}

/**
 * Fetch all patient admissions from Firestore
 */
export async function getFirestorePatients(): Promise<Patient[]> {
  if (!isFirebaseReady || !db) return [];
  try {
    const querySnapshot = await getDocs(collection(db, 'patients'));
    const patients: Patient[] = [];
    querySnapshot.forEach((docSnap) => {
      patients.push({ id: docSnap.id, ...docSnap.data() } as Patient);
    });
    return patients;
  } catch (err) {
    console.error('[Firestore Service] Error fetching patients:', err);
    throw err;
  }
}

/**
 * Save or update patient admission in Firestore
 */
export async function saveFirestorePatient(patient: Patient): Promise<void> {
  if (!isFirebaseReady || !db) return;
  try {
    const docRef = doc(db, 'patients', patient.id);
    await setDoc(docRef, patient, { merge: true });
  } catch (err) {
    console.error('[Firestore Service] Error saving patient:', err);
    throw err;
  }
}

/**
 * Delete patient record from Firestore
 */
export async function deleteFirestorePatient(patientId: string): Promise<void> {
  if (!isFirebaseReady || !db) return;
  try {
    await deleteDoc(doc(db, 'patients', patientId));
  } catch (err) {
    console.error('[Firestore Service] Error deleting patient:', err);
    throw err;
  }
}

/**
 * Fetch all clinical staff registries from Firestore
 */
export async function getFirestoreStaff(): Promise<StaffMember[]> {
  if (!isFirebaseReady || !db) return [];
  try {
    const querySnapshot = await getDocs(collection(db, 'staff'));
    const staff: StaffMember[] = [];
    querySnapshot.forEach((docSnap) => {
      staff.push({ id: docSnap.id, ...docSnap.data() } as StaffMember);
    });
    return staff;
  } catch (err) {
    console.error('[Firestore Service] Error fetching staff:', err);
    throw err;
  }
}

/**
 * Save or update staff member in Firestore
 */
export async function saveFirestoreStaffMember(staff: StaffMember): Promise<void> {
  if (!isFirebaseReady || !db) return;
  try {
    const docRef = doc(db, 'staff', staff.id);
    await setDoc(docRef, staff, { merge: true });
  } catch (err) {
    console.error('[Firestore Service] Error saving staff member:', err);
    throw err;
  }
}

/**
 * Delete staff registry from Firestore
 */
export async function deleteFirestoreStaffMember(staffId: string): Promise<void> {
  if (!isFirebaseReady || !db) return;
  try {
    await deleteDoc(doc(db, 'staff', staffId));
  } catch (err) {
    console.error('[Firestore Service] Error deleting staff member:', err);
    throw err;
  }
}

/**
 * Fetch shift reports history from Firestore
 */
export async function getFirestoreReports(): Promise<DailyReport[]> {
  if (!isFirebaseReady || !db) return [];
  try {
    const q = query(collection(db, 'reports'), orderBy('date', 'desc'));
    const querySnapshot = await getDocs(q);
    const reports: DailyReport[] = [];
    querySnapshot.forEach((docSnap) => {
      reports.push({ id: docSnap.id, ...docSnap.data() } as DailyReport);
    });
    return reports;
  } catch (err) {
    console.error('[Firestore Service] Error fetching reports:', err);
    throw err;
  }
}

/**
 * Submit shifts report to Firestore
 */
export async function saveFirestoreReport(report: DailyReport): Promise<void> {
  if (!isFirebaseReady || !db) return;
  try {
    const docRef = doc(db, 'reports', report.id);
    await setDoc(docRef, report, { merge: true });
  } catch (err) {
    console.error('[Firestore Service] Error saving shift report:', err);
    throw err;
  }
}
