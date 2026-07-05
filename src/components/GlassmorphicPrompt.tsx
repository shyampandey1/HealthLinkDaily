/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  AlertTriangle, 
  ArrowRightLeft, 
  FileCheck, 
  Trash2, 
  ClipboardCheck, 
  RefreshCw, 
  Sparkles,
  Info
} from 'lucide-react';

export type PromptType = 'transfer' | 'discharge' | 'delete' | 'submitReport' | 'resetData';

export interface PromptConfig {
  isOpen: boolean;
  type: PromptType;
  title: string;
  patientId?: string;
  patientName?: string;
  itemId?: string;
  itemName?: string;
  onConfirm: (data: any) => void;
  onCancel: () => void;
}

interface GlassmorphicPromptProps {
  config: PromptConfig;
  languageMode: 'english' | 'hindi' | 'bilingual';
}

export default function GlassmorphicPrompt({ config, languageMode }: GlassmorphicPromptProps) {
  const { isOpen, type, title, patientName, itemName, onConfirm, onCancel } = config;

  // Form State variables
  const [transferDest, setTransferDest] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [transportType, setTransportType] = useState('Ambulance (ALS)');
  
  const [dischargeCondition, setDischargeCondition] = useState('Stable / Medically Fit');
  const [dischargeFollowUp, setDischargeFollowUp] = useState('In 1 Week');
  const [dischargePrescription, setDischargePrescription] = useState('');

  const [deleteReason, setDeleteReason] = useState('Accidental duplicates');
  const [deleteAuthorized, setDeleteAuthorized] = useState(false);

  const [shiftPIN, setShiftPIN] = useState('');
  const [shiftCertified, setShiftCertified] = useState(false);
  const [shiftVerifier, setShiftVerifier] = useState('');
  const [pinError, setPinError] = useState(false);

  const [resetInput, setResetInput] = useState('');

  // Reset form states when config opens
  useEffect(() => {
    if (isOpen) {
      setTransferDest('');
      setTransferReason('');
      setTransportType('Ambulance (ALS)');
      setDischargeCondition('Stable / Medically Fit');
      setDischargeFollowUp('In 1 Week');
      setDischargePrescription('');
      setDeleteReason('Accidental duplicates');
      setDeleteAuthorized(false);
      setShiftPIN('');
      setShiftCertified(false);
      setShiftVerifier('');
      setPinError(false);
      setResetInput('');
    }
  }, [isOpen, type]);

  if (!isOpen) return null;

  const handleConfirmAction = (e: FormEvent) => {
    e.preventDefault();

    if (type === 'submitReport') {
      if (shiftPIN !== '1234') {
        setPinError(true);
        return;
      }
      if (!shiftCertified) return;
      onConfirm({
        verifier: shiftVerifier || 'Operator',
        pin: shiftPIN,
        notes: `Verified sign-off by ${shiftVerifier || 'Operator'}.`
      });
    } else if (type === 'transfer') {
      onConfirm({
        destination: transferDest || 'General Hospital',
        reason: transferReason || 'Referred for critical treatment',
        transport: transportType
      });
    } else if (type === 'discharge') {
      onConfirm({
        condition: dischargeCondition,
        followUp: dischargeFollowUp,
        prescription: dischargePrescription || 'None'
      });
    } else if (type === 'delete') {
      if (!deleteAuthorized) return;
      onConfirm({ reason: deleteReason });
    } else if (type === 'resetData') {
      if (resetInput.trim().toUpperCase() !== 'RESET') return;
      onConfirm({});
    }
  };

  // Autocomplete helpers
  const quickHospitals = ["District General", "Apex ICU Care", "Sadar Hospital", "Max Emergency"];
  const quickReasons = ["Critical ICU Beds", "Cardiac ICU Care", "Trauma Neurology", "Diagnostic MRI"];

  const t = {
    cancel: languageMode === 'hindi' ? 'रद्द करें' : 'Cancel',
    confirm: languageMode === 'hindi' ? 'पुष्टि करें' : 'Confirm & Log',
    authText: languageMode === 'hindi' ? 'अधिकृत करें' : 'Authorize Shift Sign-off',
  };

  return (
    <AnimatePresence>
      <div 
        id="glassmorphic-modal-overlay"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/55 select-none animate-fadeIn"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.93, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          id="glassmorphic-dialog"
          className="w-full max-w-md bg-surface-container-lowest/95 dark:bg-surface-container-low/95 border border-outline-variant/50 shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[90vh] md:max-w-sm"
        >
          {/* Frosted Header Area */}
          <div className="px-5 py-4 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-low/60 dark:bg-surface-container-high/40">
            <div className="flex items-center gap-2">
              {type === 'transfer' && <ArrowRightLeft className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
              {type === 'discharge' && <FileCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
              {type === 'delete' && <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />}
              {type === 'submitReport' && <ClipboardCheck className="w-5 h-5 text-secondary" />}
              {type === 'resetData' && <RefreshCw className="w-5 h-5 text-red-700 dark:text-red-400 animate-spin-slow" />}
              <h3 className="font-sans text-sm font-bold text-on-surface leading-tight">
                {title}
              </h3>
            </div>
            <button
              id="btn-close-prompt"
              onClick={onCancel}
              className="w-7 h-7 rounded-full bg-surface-container-high hover:bg-surface-container-highest flex items-center justify-center transition-colors cursor-pointer text-on-surface-variant"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Scrollable Area */}
          <form 
            id="prompt-form"
            onSubmit={handleConfirmAction}
            className="flex-1 overflow-y-auto p-5 space-y-4"
          >
            {/* TRANSFER VIEW PROMPTS */}
            {type === 'transfer' && (
              <div className="space-y-3.5">
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2.5">
                  <Info className="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Referral Transfer:</span> You are authorizing medical transfer for patient <strong className="text-black">{patientName}</strong>. This locks their record status as "Transferred" and files details into current shift registries.
                  </div>
                </div>

                {/* Referral Hospital Destination */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                    Destination Hospital / अस्पताल का नाम *
                  </label>
                  <input
                    type="text"
                    required
                    value={transferDest}
                    onChange={e => setTransferDest(e.target.value)}
                    placeholder="Enter district hospital or specialist unit"
                    className="text-xs bg-surface-container border border-outline-variant rounded-lg p-2.5 focus:ring-1 focus:ring-secondary focus:outline-none focus:bg-surface-container-lowest transition-all text-on-surface font-medium"
                  />
                  {/* Autocomplete Suggestion Chips */}
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {quickHospitals.map(h => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setTransferDest(h)}
                        className="text-[10px] font-bold text-secondary bg-secondary/15 hover:bg-secondary/25 px-2 py-0.5 rounded transition-all cursor-pointer"
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reason for Transfer */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                    Reason for Refer / रेफर करने का कारण *
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={transferReason}
                    onChange={e => setTransferReason(e.target.value)}
                    placeholder="E.g., Requires ICU support, specialist cardiologist review..."
                    className="text-xs bg-surface-container border border-outline-variant rounded-lg p-2.5 focus:ring-1 focus:ring-secondary focus:outline-none focus:bg-surface-container-lowest transition-all resize-none text-on-surface"
                  />
                  {/* Autocomplete Suggestion Chips */}
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {quickReasons.map(r => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setTransferReason(r)}
                        className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-500/15 hover:bg-amber-500/25 px-2 py-0.5 rounded transition-all cursor-pointer"
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Ambulance Selection */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                    Emergency Dispatch Vehicle / वाहन प्रकार
                  </label>
                  <select
                    value={transportType}
                    onChange={e => setTransportType(e.target.value)}
                    className="text-xs bg-surface-container border border-outline-variant rounded-lg p-2.5 focus:ring-1 focus:ring-secondary focus:outline-none text-on-surface cursor-pointer"
                  >
                    <option value="Ambulance (ALS)">Ambulance (ALS - Advanced Life Support)</option>
                    <option value="Ambulance (BLS)">Ambulance (BLS - Basic Life Support)</option>
                    <option value="Critical ICU Transport">Critical ICU Transport Unit</option>
                    <option value="Private Vehicle">Private Vehicle / Referred Card Issued</option>
                  </select>
                </div>
              </div>
            )}

            {/* DISCHARGE VIEW PROMPTS */}
            {type === 'discharge' && (
              <div className="space-y-3.5">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-xs text-emerald-900 dark:text-emerald-300 flex items-start gap-2.5">
                  <FileCheck className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Discharge Record:</span> You are completing clinical discharge for <strong className="text-on-surface">{patientName}</strong>. This changes status to "Discharged" and generates local summary records.
                  </div>
                </div>

                {/* Condition on Discharge */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                    Patient Discharge Condition / छुट्टी के समय स्थिति
                  </label>
                  <select
                    value={dischargeCondition}
                    onChange={e => setDischargeCondition(e.target.value)}
                    className="text-xs bg-surface-container border border-outline-variant rounded-lg p-2.5 focus:ring-1 focus:ring-secondary focus:outline-none text-on-surface cursor-pointer"
                  >
                    <option value="Fully Recovered">Fully Recovered (पूर्ण रूप से स्वस्थ)</option>
                    <option value="Stable / Medically Fit">Stable / Medically Fit (स्थिर/तनावमुक्त)</option>
                    <option value="Home Isolation with Medication">Home Isolation with Medication (गृह संगरोध)</option>
                    <option value="Referred to OPD Care">Referred to Clinic OPD Care (ओ.पी.डी. परामर्श)</option>
                  </select>
                </div>

                {/* Follow-up Required */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                    Scheduled Follow-up Date / पुनः जांच की आवश्यकता
                  </label>
                  <select
                    value={dischargeFollowUp}
                    onChange={e => setDischargeFollowUp(e.target.value)}
                    className="text-xs bg-surface-container border border-outline-variant rounded-lg p-2.5 focus:ring-1 focus:ring-secondary focus:outline-none text-on-surface cursor-pointer"
                  >
                    <option value="In 3 Days">In 3 Days (३ दिनों में)</option>
                    <option value="In 1 Week">In 1 Week (१ सप्ताह में)</option>
                    <option value="In 2 Weeks">In 2 Weeks (२ सप्ताह में)</option>
                    <option value="No follow-up needed">No follow-up needed (कोई आवश्यकता नहीं)</option>
                  </select>
                </div>

                {/* Discharge Medications */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                    Post-Discharge Prescriptions / आवश्यक दवाएं व निर्देश
                  </label>
                  <textarea
                    rows={3}
                    value={dischargePrescription}
                    onChange={e => setDischargePrescription(e.target.value)}
                    placeholder="Enter prescribed paracetamol dosage, ORS fluid intake, rest schedule..."
                    className="text-xs bg-surface-container border border-outline-variant rounded-lg p-2.5 focus:ring-1 focus:ring-secondary focus:outline-none focus:bg-surface-container-lowest transition-all resize-none text-on-surface"
                  />
                </div>
              </div>
            )}

            {/* DELETE VIEW PROMPTS */}
            {type === 'delete' && (
              <div className="space-y-3.5">
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3.5 text-xs text-red-900 dark:text-red-300 flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-red-800 dark:text-red-400 mb-0.5">PERMANENT FILE DELETION</span>
                    You are permanently removing the clinical file for <strong className="text-on-surface">{itemName || patientName}</strong>. This action is irreversible and deletes records from local cache databases.
                  </div>
                </div>

                {/* Deletion Reason */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                    Select Deletion Motive / हटाने का कारण
                  </label>
                  <select
                    value={deleteReason}
                    onChange={e => setDeleteReason(e.target.value)}
                    className="text-xs bg-surface-container border border-outline-variant rounded-lg p-2.5 focus:ring-1 focus:ring-secondary focus:outline-none text-on-surface cursor-pointer"
                  >
                    <option value="Accidental duplicates">Accidental Duplication / दोबारा प्रविष्टि</option>
                    <option value="Incorrect details/data entry">Incorrect clinical record / गलत जानकारी</option>
                    <option value="Patient left before register completed">Patient left before admission completed</option>
                    <option value="Test / Mock entry dataset">Test record / परीक्षण डेटा</option>
                  </select>
                </div>

                {/* Authorizing Permanent delete */}
                <div className="bg-surface-container border border-outline-variant rounded-lg p-3 flex items-start gap-3">
                  <input
                    id="checkbox-auth-delete"
                    type="checkbox"
                    checked={deleteAuthorized}
                    onChange={e => setDeleteAuthorized(e.target.checked)}
                    className="w-4 h-4 text-red-600 focus:ring-red-500 border-outline-variant rounded mt-0.5 cursor-pointer"
                  />
                  <label htmlFor="checkbox-auth-delete" className="text-xs text-on-surface-variant leading-tight cursor-pointer font-semibold select-none">
                    I verify and authorize permanent removal of this clinical file.
                  </label>
                </div>
              </div>
            )}

            {/* SUBMIT SHIFT REPORT PROMPTS */}
            {type === 'submitReport' && (
              <div className="space-y-3.5">
                <div className="bg-secondary/15 border border-secondary/25 rounded-xl p-3 text-xs text-on-surface space-y-2">
                  <span className="font-bold text-secondary flex items-center gap-1">
                    <Sparkles className="w-4 h-4 text-secondary shrink-0" />
                    Shift Log Metrics Review
                  </span>
                  <p className="text-[11px] text-on-surface-variant leading-relaxed">
                    Review metrics before compiling secure report payload. Submitting publishes report in localized databases.
                  </p>
                </div>

                {/* Operator Signature Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                    On-duty Medical Officer Name / प्रभारी नाम *
                  </label>
                  <input
                    type="text"
                    required
                    value={shiftVerifier}
                    onChange={e => setShiftVerifier(e.target.value)}
                    placeholder="E.g., Dr. Ashok Mehta"
                    className="text-xs bg-surface-container border border-outline-variant rounded-lg p-2.5 focus:ring-1 focus:ring-secondary focus:outline-none focus:bg-surface-container-lowest transition-all text-on-surface font-semibold"
                  />
                </div>

                {/* Security PIN Authorization */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                    Clinical Authorization PIN / सहेजा गया पिन *
                  </label>
                  <input
                    type="password"
                    required
                    value={shiftPIN}
                    onChange={e => {
                      setShiftPIN(e.target.value);
                      setPinError(false);
                    }}
                    placeholder="Enter Security PIN (Try: 1234)"
                    className={`text-xs bg-surface-container border rounded-lg p-2.5 focus:ring-1 focus:outline-none focus:bg-surface-container-lowest transition-all text-on-surface font-mono tracking-widest ${
                      pinError ? 'border-red-500 focus:ring-red-500 bg-red-950/20 text-red-600 dark:text-red-400' : 'border-outline-variant focus:ring-secondary'
                    }`}
                  />
                  {pinError ? (
                    <span className="text-[10px] text-red-600 dark:text-red-400 font-bold flex items-center gap-1 mt-0.5">
                      <AlertTriangle className="w-3 h-3" /> Security PIN verification failed! Use default: 1234
                    </span>
                  ) : (
                    <span className="text-[10px] text-on-surface-variant/70 italic font-medium">
                      Enter local system authorization passcode. (Default: 1234)
                    </span>
                  )}
                </div>

                {/* Attestation Certify Checkbox */}
                <div className="bg-surface-container border border-outline-variant rounded-lg p-3 flex items-start gap-3">
                  <input
                    id="checkbox-certify-report"
                    type="checkbox"
                    required
                    checked={shiftCertified}
                    onChange={e => setShiftCertified(e.target.checked)}
                    className="w-4 h-4 text-secondary focus:ring-secondary border-outline-variant rounded mt-0.5 cursor-pointer"
                  />
                  <label htmlFor="checkbox-certify-report" className="text-xs text-on-surface-variant leading-tight cursor-pointer font-semibold select-none">
                    I certify that stock counts, footfall levels, and attendance logs are validated and correct.
                  </label>
                </div>
              </div>
            )}

            {/* RESET MOCK DATA PROMPTS */}
            {type === 'resetData' && (
              <div className="space-y-3.5">
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3.5 text-xs text-red-900 dark:text-red-300 flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-red-800 dark:text-red-400 mb-0.5">RESTORE ORIGINAL DATASET</span>
                    This resets the hospital cache database to original initial seeds. Custom patient admissions, newly entered medication stock counts, and shift logs history will be permanently wiped.
                  </div>
                </div>

                {/* Challenge input to make sure they intend to do this */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                    Type 'RESET' in uppercase to authorize / "RESET" लिखें
                  </label>
                  <input
                    type="text"
                    required
                    value={resetInput}
                    onChange={e => setResetInput(e.target.value)}
                    placeholder="Type RESET"
                    className="text-xs bg-surface-container border border-outline-variant rounded-lg p-2.5 focus:ring-1 focus:ring-red-500 focus:outline-none focus:bg-surface-container-lowest transition-all text-on-surface font-mono font-bold uppercase tracking-wider"
                  />
                </div>
              </div>
            )}
          </form>

          {/* Frosted Action Footer */}
          <div className="px-5 py-4 border-t border-outline-variant/30 bg-surface-container-low/80 dark:bg-surface-container-high/30 flex gap-2.5">
            <button
              id="btn-prompt-cancel"
              type="button"
              onClick={onCancel}
              className="flex-1 bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant/60 font-bold text-xs py-2.5 px-3 rounded-lg transition-all active:scale-[0.97] cursor-pointer"
            >
              {t.cancel}
            </button>
            <button
              id="btn-prompt-confirm"
              type="submit"
              onClick={handleConfirmAction}
              disabled={
                (type === 'delete' && !deleteAuthorized) ||
                (type === 'submitReport' && (!shiftCertified || shiftPIN.length === 0)) ||
                (type === 'resetData' && resetInput.trim().toUpperCase() !== 'RESET')
              }
              className={`flex-1 text-white font-bold text-xs py-2.5 px-3 rounded-lg transition-all shadow-md cursor-pointer select-none active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed ${
                type === 'delete' 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : type === 'resetData'
                  ? 'bg-red-700 hover:bg-red-800'
                  : 'bg-secondary hover:opacity-95'
              }`}
            >
              {t.confirm}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
