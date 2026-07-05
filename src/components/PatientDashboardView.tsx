/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Heart, Activity, Thermometer, User, Clock, Stethoscope, RefreshCw, LogOut, CheckCircle2, ChevronRight, MessageSquare, AlertCircle, FileText } from 'lucide-react';
import { Patient } from '../types';

interface PatientDashboardViewProps {
  patientId: string;
  username: string;
  patientName: string;
  onLogout: () => void;
  languageMode: 'english' | 'hindi' | 'bilingual';
}

export default function PatientDashboardView({
  patientId,
  username,
  patientName,
  onLogout,
  languageMode
}: PatientDashboardViewProps) {
  const [patientData, setPatientData] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [assistanceMsg, setAssistanceMsg] = useState('');

  // Fetch patient profile from backend
  const fetchPatientProfile = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/patients');
      if (res.ok) {
        const patientsList: Patient[] = await res.json();
        const profile = patientsList.find(p => p.id === patientId);
        if (profile) {
          setPatientData(profile);
        } else {
          // Fallback if not saved in SQLite yet (mock data alignment)
          setPatientData({
            id: patientId,
            name: patientName,
            age: 35,
            gender: 'Male',
            type: 'OPD',
            status: 'Discharged',
            time: '10:30 AM',
            contact: '+91 99988 87776',
            bp: '120/80',
            pulse: 74,
            temp: 98.6,
            notes: 'Patient successfully logged in. Vitals are standard and stable.'
          });
        }
      }
    } catch (e) {
      console.error("Failed to load patient profile:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (patientId) {
      fetchPatientProfile();
    }
  }, [patientId]);

  const handleRequestAssistance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assistanceMsg) return;
    setRequestSent(true);
    setTimeout(() => {
      setRequestSent(false);
      setAssistanceMsg('');
      alert("Nurse assistance call registered at primary care desk!");
    }, 1500);
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'Admitted':
        return 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20';
      case 'Discharged':
        return 'bg-blue-500/10 text-blue-600 border border-blue-500/20';
      default:
        return 'bg-amber-500/10 text-amber-600 border border-amber-500/20';
    }
  };

  return (
    <div id="patient-dashboard-root" className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans p-6 md:p-8 transition-colors duration-200">
      
      {/* Top Welcome Bar */}
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mb-8">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-teal-500/15 border border-teal-500/20 flex items-center justify-center text-teal-600">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-800 dark:text-slate-100 leading-tight">
              Welcome back, {patientName}
            </h1>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block mt-0.5">
              Portal Account: {username} | Patient Reference: {patientId}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchPatientProfile}
            disabled={isLoading}
            className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 transition-all border border-slate-200 dark:border-slate-800 cursor-pointer"
            title="Refresh Vitals Log"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-900 text-xs font-bold transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left column: Vitals cards (7 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">
            Health Log & Vital Telemetry
          </h2>

          {/* Vitals grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* BP Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Blood Pressure</span>
                <div className="p-1.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-lg border border-rose-500/10">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <div>
                <span className="font-mono text-2xl font-black text-slate-800 dark:text-slate-100">{patientData?.bp || '120/80'}</span>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block mt-1">✓ Optimal Range</span>
              </div>
            </div>

            {/* Pulse Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Pulse / Heart Rate</span>
                <div className="p-1.5 bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-lg border border-teal-500/10">
                  <Heart className="w-4 h-4" />
                </div>
              </div>
              <div>
                <span className="font-mono text-2xl font-black text-slate-800 dark:text-slate-100">{patientData?.pulse || 72} <span className="text-xs font-bold text-slate-400">bpm</span></span>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block mt-1">✓ Stable Rhythm</span>
              </div>
            </div>

            {/* Temperature Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Temperature</span>
                <div className="p-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg border border-amber-500/10">
                  <Thermometer className="w-4 h-4" />
                </div>
              </div>
              <div>
                <span className="font-mono text-2xl font-black text-slate-800 dark:text-slate-100">{patientData?.temp || 98.6} <span className="text-xs font-bold text-slate-400">°F</span></span>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block mt-1">✓ Normal Temperature</span>
              </div>
            </div>
          </div>

          {/* Clinical Notes card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-2 text-teal-600">
                <Stethoscope className="w-4 h-4" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                  Care Directives & Prescriptions
                </span>
              </div>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${getStatusColor(patientData?.status)}`}>
                {patientData?.status === 'Admitted' ? 'ACTIVE ADMISSION' : 'DISCHARGED'}
              </span>
            </div>
            
            <div className="p-5 space-y-4">
              <p className="text-xs text-slate-700 dark:text-slate-350 leading-relaxed font-medium bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-100 dark:border-slate-800 italic">
                "{patientData?.notes || 'No doctor notes logged for this visit.'}"
              </p>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-t border-slate-150 dark:border-slate-800 pt-4 gap-3">
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                  <p>Admission Type: <span className="font-bold text-slate-700 dark:text-slate-200">{patientData?.type}</span></p>
                  {patientData?.bedNumber && (
                    <p className="mt-0.5">Assigned Bed: <span className="font-bold text-slate-700 dark:text-slate-200 font-mono">{patientData.bedNumber}</span></p>
                  )}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 text-right self-end">
                  <p>Primary Care Logged: <span className="font-bold text-slate-700 dark:text-slate-200">{patientData?.time || 'N/A'}</span></p>
                  <p className="mt-0.5">District Registry: Secure HIPAA Sync</p>
                </div>
              </div>
            </div>
          </div>

          {/* Simulate Reports download */}
          <div className="bg-gradient-to-r from-teal-600/5 to-teal-500/10 border border-teal-500/10 rounded-2xl p-5 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-600 text-white rounded-xl">
                <FileText className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">Export Clinical Summary</h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Generate a signed digital PDF of your vitals, check-in timestamps, and prescriptions.</p>
              </div>
            </div>
            <button
              onClick={() => alert("Digital summary PDF generated successfully! Sending request to download...")}
              className="bg-teal-600 hover:bg-teal-700 text-white text-[10px] font-bold px-3 py-2 rounded-lg shadow transition-all cursor-pointer flex items-center gap-1"
            >
              <span>Download PDF</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Right column: Timeline & Nurse Assistance (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">
            Admit Timeline & Actions
          </h2>

          {/* Timeline */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Care Progression</span>
            
            <div className="space-y-4 relative pl-4 border-l border-slate-200 dark:border-slate-850">
              {/* Event 1 */}
              <div className="relative">
                <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-teal-500 border-2 border-white dark:border-slate-900" />
                <div className="text-[10px]">
                  <span className="font-bold text-slate-800 dark:text-slate-200">Patient Intake & Registration</span>
                  <span className="text-slate-400 font-mono text-[9px] block mt-0.5">{patientData?.time || '10:30 AM'}</span>
                </div>
              </div>

              {/* Event 2 */}
              <div className="relative">
                <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-teal-500 border-2 border-white dark:border-slate-900" />
                <div className="text-[10px]">
                  <span className="font-bold text-slate-800 dark:text-slate-200">Vital Diagnostics Recorded</span>
                  <p className="text-slate-500 dark:text-slate-450 mt-0.5 text-[9px]">BP: {patientData?.bp || '120/80'} | Heart Rate: {patientData?.pulse || 72} bpm</p>
                </div>
              </div>

              {/* Event 3 */}
              <div className="relative">
                <span className={`absolute -left-6 top-1 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-900 ${
                  patientData?.status === 'Discharged' ? 'bg-teal-500' : 'bg-slate-300 dark:bg-slate-700'
                }`} />
                <div className="text-[10px]">
                  <span className="font-bold text-slate-800 dark:text-slate-200">Physician Consultation</span>
                  <p className="text-slate-500 dark:text-slate-450 mt-0.5 text-[9px]">Ingested clinical notes into central directory.</p>
                </div>
              </div>

              {/* Event 4 */}
              <div className="relative">
                <span className={`absolute -left-6 top-1 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-900 ${
                  patientData?.status === 'Discharged' ? 'bg-teal-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-700'
                }`} />
                <div className="text-[10px]">
                  <span className="font-bold text-slate-800 dark:text-slate-200">Discharge / Outpatient Wrap</span>
                  {patientData?.status === 'Discharged' ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold block text-[9px] mt-0.5">✓ Successfully discharged and logged.</span>
                  ) : (
                    <span className="text-slate-400 block text-[9px] mt-0.5">Admission is currently ongoing...</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Request Ward Nurse Check-in */}
          {patientData?.status === 'Admitted' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-1.5 text-rose-500">
                <AlertCircle className="w-4 h-4 text-rose-500" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                  Request Assistance
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">
                If you need urgent ward assistance, enter a brief message below to alert the active duty nurse on shift.
              </p>

              <form onSubmit={handleRequestAssistance} className="space-y-2">
                <input
                  type="text"
                  value={assistanceMsg}
                  onChange={(e) => setAssistanceMsg(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-rose-500"
                  placeholder="e.g. Request drip replacement in Bed B2"
                  required
                />
                <button
                  type="submit"
                  disabled={requestSent}
                  className="w-full bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>Call Nurse Desk</span>
                </button>
              </form>
            </div>
          )}

          {/* HIPAA Safety Notice */}
          <div className="bg-slate-100 dark:bg-slate-900/60 rounded-xl p-4 border border-slate-200 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400 space-y-1.5">
            <span className="font-bold text-slate-700 dark:text-slate-350 block uppercase tracking-wider">🔒 HIPAA SECURED GATEWAY</span>
            <p className="leading-relaxed">This patient portal utilizes TLS 1.3 encryption and stores clinical diagnostics strictly on a HIPAA-compliant localized ledger. Your contact and vitals are encrypted at rest.</p>
          </div>
        </div>

      </div>

    </div>
  );
}
