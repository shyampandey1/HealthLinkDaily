/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Search, Plus, Trash2, Shield, HeartPulse, UserPlus, X, HelpCircle } from 'lucide-react';
import { useState, Dispatch, SetStateAction, FormEvent } from 'react';
import { Patient } from '../types';

interface PatientsViewProps {
  patients: Patient[];
  setPatients: Dispatch<SetStateAction<Patient[]>>;
  languageMode: 'english' | 'hindi' | 'bilingual';
  openPrompt?: (
    type: 'transfer' | 'discharge' | 'delete' | 'submitReport' | 'resetData',
    title: string,
    extra: { patientId?: string; patientName?: string; itemId?: string; itemName?: string },
    onConfirm: (data: any) => void
  ) => void;
}

export default function PatientsView({ patients, setPatients, languageMode, openPrompt }: PatientsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // New patient registration form state
  const [newName, setNewName] = useState('');
  const [newAge, setNewAge] = useState<number>(30);
  const [newGender, setNewGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [newType, setNewType] = useState<'OPD' | 'IPD'>('OPD');
  const [newContact, setNewContact] = useState('');
  const [newBp, setNewBp] = useState('120/80');
  const [newPulse, setNewPulse] = useState<number>(72);
  const [newTemp, setNewTemp] = useState<number>(98.6);
  const [newNotes, setNewNotes] = useState('');

  // Search filter
  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (patient.contact && patient.contact.includes(searchQuery))
  );

  // Register Patient
  const handleRegisterPatient = (e: FormEvent) => {
    e.preventDefault();
    if (!newName) return;

    const currentTimeString = new Date().toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });

    const newPatient: Patient = {
      id: `pat-${Date.now()}`,
      name: newName,
      gender: newGender,
      age: newAge,
      type: newType,
      status: 'Admitted',
      time: currentTimeString,
      contact: newContact || undefined,
      vitals: {
        bp: newBp || undefined,
        pulse: newPulse || undefined,
        temp: newTemp || undefined,
      },
      notes: newNotes || undefined
    };

    setPatients(prev => [newPatient, ...prev]);

    // Reset Form
    setNewName('');
    setNewAge(30);
    setNewGender('Male');
    setNewType('OPD');
    setNewContact('');
    setNewBp('120/80');
    setNewPulse(72);
    setNewTemp(98.6);
    setNewNotes('');
    setShowAddForm(false);
  };

  // Change patient status
  const handleUpdateStatus = (patientId: string, status: 'Admitted' | 'Discharged' | 'Transferred') => {
    setPatients(prev =>
      prev.map(p => {
        if (p.id === patientId) {
          return { ...p, status };
        }
        return p;
      })
    );
  };

  // Delete/Remove patient record
  const handleDeletePatient = (patientId: string) => {
    setPatients(prev => prev.filter(p => p.id !== patientId));
  };

  return (
    <div id="patients-view-main" className="flex flex-col gap-5 animate-fadeIn">
      {/* Header and Add button */}
      <div className="flex justify-between items-center">
        <div>
          <span className="text-xs font-bold text-secondary uppercase tracking-wider">
            {languageMode === 'hindi' ? 'रोगी सूची' : 'Admissions & Registries'}
          </span>
          <h2 id="patients-header" className="font-sans text-xl font-bold text-on-surface">
            {languageMode === 'hindi' ? 'मरीज रजिस्टर' : 'Patient Register'}
          </h2>
        </div>
        <button
          id="btn-toggle-add-patient"
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-secondary text-on-secondary hover:bg-secondary/95 transition-all text-xs font-semibold px-3 py-1.5 rounded flex items-center gap-1.5 shadow-sm cursor-pointer"
        >
          {showAddForm ? <X className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
          <span>{showAddForm ? (languageMode === 'hindi' ? 'रद्द करें' : 'Cancel') : (languageMode === 'hindi' ? 'नया मरीज' : 'Register')}</span>
        </button>
      </div>

      {/* Register Patient Form */}
      {showAddForm && (
        <form
          id="form-register-patient"
          onSubmit={handleRegisterPatient}
          className="bg-surface-container-lowest border border-outline-variant p-4 rounded-xl shadow-md space-y-3 animate-scaleUp"
        >
          <div className="text-sm font-bold text-primary border-b border-outline-variant pb-1.5">
            {languageMode === 'hindi' ? 'नया मरीज पंजीकृत करें' : 'Admit & Register New Patient'}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2 flex flex-col gap-1">
              <label className="text-[11px] font-bold text-on-surface-variant uppercase">Full Name*</label>
              <input
                type="text"
                required
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Ramesh Lal"
                className="text-sm bg-surface-container border border-outline-variant rounded p-2 focus:ring-1 focus:ring-secondary focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-on-surface-variant uppercase">Age*</label>
              <input
                type="number"
                required
                min="0"
                max="125"
                value={newAge}
                onChange={e => setNewAge(parseInt(e.target.value) || 0)}
                className="text-sm bg-surface-container border border-outline-variant rounded p-2 focus:ring-1 focus:ring-secondary focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-on-surface-variant uppercase">Gender</label>
              <select
                value={newGender}
                onChange={e => setNewGender(e.target.value as any)}
                className="text-sm bg-surface-container border border-outline-variant rounded p-2 focus:ring-1 focus:ring-secondary focus:outline-none"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-on-surface-variant uppercase">Clinic Department</label>
              <select
                value={newType}
                onChange={e => setNewType(e.target.value as any)}
                className="text-sm bg-surface-container border border-outline-variant rounded p-2 focus:ring-1 focus:ring-secondary focus:outline-none"
              >
                <option value="OPD">OPD (Out-Patient)</option>
                <option value="IPD">IPD (In-Patient)</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-on-surface-variant uppercase">Contact Phone</label>
            <input
              type="text"
              value={newContact}
              onChange={e => setNewContact(e.target.value)}
              placeholder="+91 99999 88888"
              className="text-sm bg-surface-container border border-outline-variant rounded p-2 focus:ring-1 focus:ring-secondary focus:outline-none"
            />
          </div>

          <div className="bg-surface-container-low p-2 rounded-lg border border-outline-variant space-y-2">
            <span className="text-[10px] font-bold text-secondary flex items-center gap-1">
              <HeartPulse className="w-3.5 h-3.5" /> PHYSICAL VITALS (शारीरिक लक्षण)
            </span>
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-on-surface-variant uppercase">Blood Pres (BP)</label>
                <input
                  type="text"
                  value={newBp}
                  onChange={e => setNewBp(e.target.value)}
                  placeholder="120/80"
                  className="text-xs bg-surface-container-lowest border border-outline-variant rounded p-1.5 focus:outline-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-on-surface-variant uppercase">Pulse (BPM)</label>
                <input
                  type="number"
                  value={newPulse}
                  onChange={e => setNewPulse(parseInt(e.target.value) || 0)}
                  className="text-xs bg-surface-container-lowest border border-outline-variant rounded p-1.5 focus:outline-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-on-surface-variant uppercase">Temp (°F)</label>
                <input
                  type="number"
                  step="0.1"
                  value={newTemp}
                  onChange={e => setNewTemp(parseFloat(e.target.value) || 0)}
                  className="text-xs bg-surface-container-lowest border border-outline-variant rounded p-1.5 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-on-surface-variant uppercase">Clinical Case Notes</label>
            <textarea
              value={newNotes}
              onChange={e => setNewNotes(e.target.value)}
              placeholder="Fever symptoms, coughing, allergy alerts..."
              rows={1.5}
              className="text-sm bg-surface-container border border-outline-variant rounded p-2 focus:ring-1 focus:ring-secondary focus:outline-none resize-none"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-primary text-on-primary hover:bg-black font-semibold text-sm py-2 rounded shadow transition-all cursor-pointer"
          >
            {languageMode === 'hindi' ? 'मरीज सहेजें' : 'Admit & Sync Record'}
          </button>
        </form>
      )}

      {/* Search Input */}
      <div id="patient-search-container" className="relative">
        <Search className="w-4 h-4 text-on-surface-variant/60 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          id="input-patient-search"
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder={languageMode === 'hindi' ? 'नाम या फोन द्वारा खोजें...' : 'Search clinical registries...'}
          className="w-full pl-9 pr-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-secondary focus:border-secondary transition-all"
        />
      </div>

      {/* Patients List */}
      <div id="patients-list" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPatients.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-lg border border-outline-variant p-10 text-center text-on-surface-variant">
            <HelpCircle className="w-10 h-10 mx-auto text-outline mb-2 opacity-50" />
            <p className="text-sm font-medium">
              {languageMode === 'hindi' ? 'कोई मरीज नहीं मिला।' : 'No active admissions recorded.'}
            </p>
          </div>
        ) : (
          filteredPatients.map(patient => (
            <div
              key={patient.id}
              id={`patient-card-${patient.id}`}
              className="bg-surface-container-lowest border border-outline-variant rounded-xl p-3.5 shadow-sm flex flex-col gap-2.5 hover:border-secondary/40 transition-colors"
            >
              {/* Patient Basic Header */}
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-sans text-[15px] font-bold text-on-surface leading-tight flex items-center gap-1.5">
                    {patient.name}
                    <span className="text-xs font-normal text-on-surface-variant">
                      ({patient.gender[0]}, {patient.age} yrs)
                    </span>
                  </h3>
                  <p className="text-[10px] font-mono text-on-surface-variant/80 mt-1">
                    Admitted: {patient.time}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {/* OPD/IPD Badge */}
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                    patient.type === 'IPD' ? 'bg-indigo-500/10 text-indigo-700' : 'bg-teal-500/10 text-teal-700'
                  }`}>
                    {patient.type}
                  </span>

                  {/* Status Badge */}
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    patient.status === 'Discharged' 
                      ? 'bg-emerald-500/10 text-emerald-700' 
                      : patient.status === 'Transferred'
                      ? 'bg-amber-500/10 text-amber-700'
                      : 'bg-blue-500/10 text-blue-700'
                  }`}>
                    {patient.status}
                  </span>
                </div>
              </div>

              {/* Vitals Readout Box */}
              {patient.vitals && (
                <div className="grid grid-cols-3 gap-1 bg-surface-container-low rounded p-2 text-center text-xs font-medium border border-outline-variant/30">
                  <div>
                    <span className="text-[9px] text-on-surface-variant uppercase block">BLOOD PRESS</span>
                    <span className="font-mono text-primary font-semibold">{patient.vitals.bp || '--'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-on-surface-variant uppercase block">PULSE RATE</span>
                    <span className="font-mono text-primary font-semibold">{patient.vitals.pulse ? `${patient.vitals.pulse} bpm` : '--'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-on-surface-variant uppercase block">BODY TEMP</span>
                    <span className="font-mono text-primary font-semibold">{patient.vitals.temp ? `${patient.vitals.temp} °F` : '--'}</span>
                  </div>
                </div>
              )}

              {/* Notes display */}
              {patient.notes && (
                <div className="text-xs bg-surface-container-low/50 rounded p-2 border-l-2 border-secondary/45 text-on-surface-variant italic">
                  &ldquo;{patient.notes}&rdquo;
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-between items-center border-t border-outline-variant/30 pt-2.5 mt-0.5">
                {patient.contact ? (
                  <span className="text-[10px] font-mono text-on-surface-variant">
                    Ph: {patient.contact}
                  </span>
                ) : (
                  <span />
                )}

                <div className="flex gap-2">
                  {patient.status === 'Admitted' && (
                    <>
                      <button
                        id={`btn-discharge-${patient.id}`}
                        onClick={() => {
                          if (openPrompt) {
                            openPrompt(
                              'discharge',
                              languageMode === 'hindi' ? 'रोगी छुट्टी फॉर्म' : 'Patient Discharge Form',
                              { patientId: patient.id, patientName: patient.name },
                              (data) => {
                                setPatients(prev =>
                                  prev.map(p => {
                                    if (p.id === patient.id) {
                                      const logMsg = `Discharged: Condition: ${data.condition}. Follow-up: ${data.followUp}. Presc: ${data.prescription}`;
                                      return {
                                        ...p,
                                        status: 'Discharged' as const,
                                        notes: p.notes ? `${p.notes} | ${logMsg}` : logMsg
                                      };
                                    }
                                    return p;
                                  })
                                );
                              }
                            );
                          } else {
                            handleUpdateStatus(patient.id, 'Discharged');
                          }
                        }}
                        className="text-[10px] font-bold bg-emerald-500 text-white hover:bg-emerald-600 transition-colors px-2 py-1 rounded cursor-pointer animate-pulse-slow"
                      >
                        {languageMode === 'hindi' ? 'छुट्टी' : 'Discharge'}
                      </button>
                      <button
                        id={`btn-transfer-${patient.id}`}
                        onClick={() => {
                          if (openPrompt) {
                            openPrompt(
                              'transfer',
                              languageMode === 'hindi' ? 'रोगी स्थानांतरण लॉग' : 'Patient Referral & Transfer Log',
                              { patientId: patient.id, patientName: patient.name },
                              (data) => {
                                setPatients(prev =>
                                  prev.map(p => {
                                    if (p.id === patient.id) {
                                      const logMsg = `Transferred to ${data.destination} via ${data.transport}. Reason: ${data.reason}`;
                                      return {
                                        ...p,
                                        status: 'Transferred' as const,
                                        notes: p.notes ? `${p.notes} | ${logMsg}` : logMsg
                                      };
                                    }
                                    return p;
                                  })
                                );
                              }
                            );
                          } else {
                            handleUpdateStatus(patient.id, 'Transferred');
                          }
                        }}
                        className="text-[10px] font-bold bg-amber-500 text-white hover:bg-amber-600 transition-colors px-2 py-1 rounded cursor-pointer"
                      >
                        {languageMode === 'hindi' ? 'रेफर' : 'Transfer'}
                      </button>
                    </>
                  )}
                  <button
                    id={`btn-delete-patient-${patient.id}`}
                    aria-label={`Delete record for ${patient.name}`}
                    onClick={() => {
                      if (openPrompt) {
                        openPrompt(
                          'delete',
                          languageMode === 'hindi' ? 'मरीज रिकॉर्ड हटाएं' : 'Critical Delete Authorization',
                          { patientId: patient.id, patientName: patient.name },
                          () => {
                            handleDeletePatient(patient.id);
                          }
                        );
                      } else {
                        handleDeletePatient(patient.id);
                      }
                    }}
                    className="text-on-surface-variant/40 hover:text-red-500 transition-colors p-1 rounded hover:bg-red-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
