/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StockItem, Patient, StaffMember, DailyReport } from '../types';

export const initialStockItems: StockItem[] = [
  {
    id: 'stock-1',
    name: 'Paracetamol 500mg',
    nameHindi: 'पैरासिटामोल 500 मि.ग्रा.',
    category: 'Tablets',
    count: 450,
    unit: 'Tablets',
    criticalThreshold: 100
  },
  {
    id: 'stock-2',
    name: 'IV Fluids (RL)',
    nameHindi: 'आई.वी. फ्लूइड्स (आर.एल.)',
    category: '500ml Bottles',
    count: 82,
    unit: '500ml Bottles',
    criticalThreshold: 20
  },
  {
    id: 'stock-3',
    name: 'Amoxicillin 250mg',
    nameHindi: 'एमोक्सिसिलिन 250 मि.ग्रा.',
    category: 'Capsules',
    count: 140,
    unit: 'Capsules',
    criticalThreshold: 50
  },
  {
    id: 'stock-4',
    name: 'Oral Rehydration Salts (ORS)',
    nameHindi: 'ओ.आर.एस. घोल',
    category: 'Sachets',
    count: 195,
    unit: 'Sachets',
    criticalThreshold: 40
  },
  {
    id: 'stock-5',
    name: 'Surgical Gloves',
    nameHindi: 'सर्जिकल दस्ताने',
    category: 'Consumables',
    count: 18,
    unit: 'Pairs',
    criticalThreshold: 50 // Critical status triggered
  },
  {
    id: 'stock-6',
    name: 'Disposable Syringes 5ml',
    nameHindi: 'डिस्पोजेबल सीरिंज 5 मि.ली.',
    category: 'Consumables',
    count: 32,
    unit: 'Pieces',
    criticalThreshold: 40 // Critical status triggered
  }
];

export const initialPatients: Patient[] = [
  {
    id: 'pat-1',
    name: 'Rajesh Kumar',
    gender: 'Male',
    age: 42,
    type: 'OPD',
    status: 'Discharged',
    time: '09:15 AM',
    contact: '+91 98765 43210',
    vitals: {
      bp: '120/80',
      pulse: 72,
      temp: 98.6
    },
    notes: 'Mild fever and body pain. Prescribed Paracetamol.'
  },
  {
    id: 'pat-2',
    name: 'Sunita Devi',
    gender: 'Female',
    age: 36,
    type: 'IPD',
    status: 'Admitted',
    time: '10:30 AM',
    contact: '+91 87654 32109',
    vitals: {
      bp: '135/85',
      pulse: 88,
      temp: 100.2
    },
    notes: 'Severe dehydration. Initiated IV Fluids (RL) therapy.'
  },
  {
    id: 'pat-3',
    name: 'Amit Sharma',
    gender: 'Male',
    age: 11,
    type: 'OPD',
    status: 'Discharged',
    time: '11:45 AM',
    contact: '+91 76543 21098',
    vitals: {
      bp: '110/70',
      pulse: 80,
      temp: 99.1
    },
    notes: 'Sore throat and cough. Prescribed pediatric syrup.'
  },
  {
    id: 'pat-4',
    name: 'Priyanka Verma',
    gender: 'Female',
    age: 29,
    type: 'IPD',
    status: 'Admitted',
    time: '01:15 PM',
    contact: '+91 65432 10987',
    vitals: {
      bp: '118/75',
      pulse: 64,
      temp: 98.4
    },
    notes: 'Observation post minor procedure.'
  }
];

export const initialStaffMembers: StaffMember[] = [
  {
    id: 'staff-1',
    name: 'Dr. Ashok Mehta',
    role: 'Medical Officer',
    roleHindi: 'चिकित्सक अधिकारी',
    active: true,
    phone: '+91 99988 87776',
    shift: 'Day',
    checkInTime: '08:50 AM'
  },
  {
    id: 'staff-2',
    name: 'Sister Mary Joseph',
    role: 'Staff Nurse',
    roleHindi: 'कर्मचारी नर्स',
    active: true,
    phone: '+91 88877 76665',
    shift: 'Day',
    checkInTime: '08:45 AM'
  },
  {
    id: 'staff-3',
    name: 'Pushpa Kumari',
    role: 'ANM',
    roleHindi: 'ए.एन.एम.',
    active: false,
    phone: '+91 77766 65554',
    shift: 'Day'
  },
  {
    id: 'staff-4',
    name: 'Sanjay Gupta',
    role: 'Pharmacist',
    roleHindi: 'फार्मासिस्ट',
    active: true,
    phone: '+91 66655 54443',
    shift: 'Day',
    checkInTime: '08:55 AM'
  }
];

// Seed two past daily reports for high-fidelity historical reports tab
export const initialReportsHistory: DailyReport[] = [
  {
    id: 'rep-prev-1',
    date: '2026-06-29',
    stockCounts: [
      { itemId: 'stock-1', count: 460 },
      { itemId: 'stock-2', count: 90 },
      { itemId: 'stock-3', count: 145 },
      { itemId: 'stock-4', count: 200 },
      { itemId: 'stock-5', count: 22 },
      { itemId: 'stock-6', count: 35 }
    ],
    footfall: { opd: 110, ipd: 8 },
    staffAttendance: [
      { staffId: 'staff-1', present: true },
      { staffId: 'staff-2', present: true },
      { staffId: 'staff-3', present: true },
      { staffId: 'staff-4', present: true }
    ],
    submittedBy: 'belaur2008@gmail.com',
    submittedAt: '2026-06-29T18:05:12.000Z',
    notes: 'Shift completed successfully. All critical assets accounted for.'
  },
  {
    id: 'rep-prev-2',
    date: '2026-06-30',
    stockCounts: [
      { itemId: 'stock-1', count: 450 },
      { itemId: 'stock-2', count: 82 },
      { itemId: 'stock-3', count: 140 },
      { itemId: 'stock-4', count: 195 },
      { itemId: 'stock-5', count: 18 },
      { itemId: 'stock-6', count: 32 }
    ],
    footfall: { opd: 124, ipd: 12 },
    staffAttendance: [
      { staffId: 'staff-1', present: true },
      { staffId: 'staff-2', present: true },
      { staffId: 'staff-3', present: false },
      { staffId: 'staff-4', present: true }
    ],
    submittedBy: 'belaur2008@gmail.com',
    submittedAt: '2026-06-30T18:10:44.000Z',
    notes: 'Staff nurse sister Mary filled in for missing ANM shift.'
  }
];
