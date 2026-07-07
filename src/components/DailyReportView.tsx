/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Plus, Minus, Check, ClipboardCheck, History, AlertCircle } from 'lucide-react';
import { useState, Dispatch, SetStateAction } from 'react';
import { StockItem, Patient, StaffMember, DailyReport } from '../types';

interface DailyReportViewProps {
  stockItems: StockItem[];
  setStockItems: Dispatch<SetStateAction<StockItem[]>>;
  patients: Patient[];
  staffMembers: StaffMember[];
  setStaffMembers: Dispatch<SetStateAction<StaffMember[]>>;
  reportsHistory: DailyReport[];
  onSubmitReport: (notes?: string) => void;
  languageMode: 'english' | 'hindi' | 'bilingual';
  openPrompt?: (
    type: 'transfer' | 'discharge' | 'delete' | 'submitReport' | 'resetData',
    title: string,
    extra: { patientId?: string; patientName?: string; itemId?: string; itemName?: string },
    onConfirm: (data: any) => void
  ) => void;
  notes: string;
  setNotes: (notes: string) => void;
  manualOPDOffset: number;
  setManualOPDOffset: Dispatch<SetStateAction<number>>;
  manualIPDOffset: number;
  setManualIPDOffset: Dispatch<SetStateAction<number>>;
}

export default function DailyReportView({
  stockItems,
  setStockItems,
  patients,
  staffMembers,
  setStaffMembers,
  reportsHistory,
  onSubmitReport,
  languageMode,
  openPrompt,
  notes,
  setNotes,
  manualOPDOffset,
  setManualOPDOffset,
  manualIPDOffset,
  setManualIPDOffset,
}: DailyReportViewProps) {
  const [showHistory, setShowHistory] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Derive Patient Footfall from the registered patients list + manual adjusters
  const baseOPD = patients.filter(p => p.type === 'OPD').length;
  const baseIPD = patients.filter(p => p.type === 'IPD').length;
  
  const opdCount = Math.max(0, baseOPD + manualOPDOffset);
  const ipdCount = Math.max(0, baseIPD + manualIPDOffset);

  // Change individual stock items
  const handleStockChange = (itemId: string, increment: boolean) => {
    setStockItems(prev =>
      prev.map(item => {
        if (item.id === itemId) {
          const newCount = increment ? item.count + 1 : Math.max(0, item.count - 1);
          return { ...item, count: newCount };
        }
        return item;
      })
    );
  };

  // Toggle staff attendance
  const handleStaffToggle = (staffId: string) => {
    setStaffMembers(prev =>
      prev.map(member => {
        if (member.id === staffId) {
          return { ...member, active: !member.active };
        }
        return member;
      })
    );
  };

  // Handle Submit Action
  const handleFormSubmit = () => {
    if (openPrompt) {
      openPrompt(
        'submitReport',
        languageMode === 'hindi' ? 'रिपोर्ट जमा करने का सत्यापन' : 'Shift Submission Verification',
        {},
        (data) => {
          const finalNotes = data.notes ? `${data.notes} | ${notes}` : notes;
          onSubmitReport(finalNotes);
          setSubmitSuccess(true);
          setNotes('');
          setTimeout(() => {
            setSubmitSuccess(false);
          }, 4000);
        }
      );
    } else {
      onSubmitReport(notes);
      setSubmitSuccess(true);
      setNotes('');
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 4000);
    }
  };

  // Translation helpers
  const t = {
    stockCount: languageMode === 'hindi' ? 'स्टॉक गणना' : 'Stock Count',
    stockCountSub: languageMode === 'english' ? 'Live medical item counts' : 'स्टॉक गणना',
    tablets: languageMode === 'hindi' ? 'गोलियाँ' : 'Tablets',
    bottles: languageMode === 'hindi' ? 'बोतलें' : 'Bottles',
    footfall: languageMode === 'hindi' ? 'रोगी संख्या' : 'Patient Footfall',
    opd: languageMode === 'hindi' ? 'ओ.पी.डी. (बाहरी)' : 'OPD',
    ipd: languageMode === 'hindi' ? 'आई.पी.डी. (भर्ती)' : 'IPD',
    attendance: languageMode === 'hindi' ? 'कर्मचारी उपस्थिति' : 'Staff Attendance',
    notesLabel: languageMode === 'hindi' ? 'विशेष टिप्पणी' : 'Shift Notes (Optional)',
    notesPlaceholder: languageMode === 'hindi' ? 'यहाँ टिप्पणी लिखें...' : 'Enter any notes about equipment shortages, emergency referrals, etc.',
    submitBtn: languageMode === 'hindi' ? 'आज की रिपोर्ट जमा करें' : "Submit Today's Report",
    submitBtnSub: languageMode === 'hindi' ? 'आज की रिपोर्ट जमा करें' : "आज की रिपोर्ट जमा करें",
    successMsg: languageMode === 'hindi' ? 'रिपोर्ट सफलतापूर्वक जमा की गई!' : 'Shift Report Saved Successfully!',
    successSub: languageMode === 'hindi' ? 'यह रिपोर्ट इतिहास टैब में रिकॉर्ड कर दी गई है।' : 'Logged locally in report database history.',
    historyTitle: languageMode === 'hindi' ? 'सहेजी गई रिपोर्टें' : 'Report Submissions',
    backBtn: languageMode === 'hindi' ? 'वापस जाएँ' : 'Back to Form',
  };

  if (showHistory) {
    return (
      <div id="reports-history-container" className="flex flex-col gap-5 animate-fadeIn">
        <div className="flex justify-between items-center">
          <h2 id="history-header-title" className="font-sans text-xl font-bold text-on-surface">
            {t.historyTitle}
          </h2>
          <button
            id="btn-back-to-form"
            onClick={() => setShowHistory(false)}
            className="text-sm font-semibold text-secondary hover:underline flex items-center gap-1 cursor-pointer"
          >
            &larr; {t.backBtn}
          </button>
        </div>

        {reportsHistory.length === 0 ? (
          <div id="no-history-alert" className="bg-surface-container rounded-lg p-8 text-center text-on-surface-variant border border-outline-variant">
            <ClipboardCheck className="w-12 h-12 mx-auto text-outline mb-2 opacity-60" />
            <p className="font-medium text-sm">
              {languageMode === 'hindi' ? 'कोई रिपोर्ट जमा नहीं की गई है।' : 'No reports filed yet.'}
            </p>
          </div>
        ) : (
          <div id="reports-history-list" className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reportsHistory.map((report) => (
              <div
                key={report.id}
                id={`history-card-${report.id}`}
                className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 shadow-sm"
              >
                <div className="flex justify-between items-start border-b border-outline-variant pb-2 mb-3">
                  <div>
                    <span className="font-mono text-sm font-semibold text-primary">
                      {new Date(report.date).toLocaleDateString(undefined, {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      By: {report.submittedBy}
                    </p>
                  </div>
                  <span className="bg-secondary-container text-on-secondary-container text-[11px] font-bold px-2 py-0.5 rounded-full">
                    SUBMITTED
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-surface-container-low rounded p-2 text-center">
                    <span className="text-[11px] text-on-surface-variant font-bold block">OPD FOOTFALL</span>
                    <span className="font-mono text-lg font-bold text-primary">{report.footfall.opd}</span>
                  </div>
                  <div className="bg-surface-container-low rounded p-2 text-center">
                    <span className="text-[11px] text-on-surface-variant font-bold block">IPD FOOTFALL</span>
                    <span className="font-mono text-lg font-bold text-primary">{report.footfall.ipd}</span>
                  </div>
                </div>

                {report.notes && (
                  <div className="bg-surface-container-low rounded p-2 text-xs text-on-surface-variant">
                    <strong className="text-on-surface">Notes:</strong> {report.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div id="daily-report-form" className="flex flex-col gap-6">
      {/* Alert Banner if any stock is critical */}
      {stockItems.some(i => i.count <= i.criticalThreshold) && (
        <div id="critical-stock-alert-banner" className="bg-error-container text-on-error-container border border-error/20 p-3 rounded-lg flex items-start gap-3 shadow-sm">
          <AlertCircle className="w-5 h-5 text-error mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-bold">
              {languageMode === 'hindi' ? 'चेतावनी: आवश्यक चिकित्सा आपूर्ति कम है!' : 'Alert: Critical medical supplies running low!'}
            </p>
            <p className="text-[11px] opacity-90 mt-0.5">
              {languageMode === 'hindi' ? 'कृपया स्टॉक टैब में लाल चेतावनी वाले सामानों की जांच करें।' : 'Check items in red alerts under the Inventory tab.'}
            </p>
          </div>
        </div>
      )}

      {/* Header section with quick access to history */}
      <div className="flex justify-between items-center">
        <div>
          <span className="text-xs font-bold text-secondary tracking-wider uppercase">
            {languageMode === 'hindi' ? 'दैनिक पारी रिपोर्ट' : 'Daily Shift Log'}
          </span>
          <h2 className="font-sans text-xl font-bold text-on-surface">
            {languageMode === 'hindi' ? 'आज का फॉर्म' : 'Today\'s Summary'}
          </h2>
        </div>
        <button
          id="btn-view-history"
          onClick={() => setShowHistory(true)}
          className="bg-surface-container-low hover:bg-surface-container-high transition-colors border border-outline-variant px-3 py-1.5 rounded-lg text-xs font-semibold text-on-surface-variant flex items-center gap-1.5 cursor-pointer"
        >
          <History className="w-3.5 h-3.5" />
          <span>{languageMode === 'hindi' ? 'इतिहास' : 'History'} ({reportsHistory.length})</span>
        </button>
      </div>

      {/* Stock Count Module */}
      <section id="stock-count-card" className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-4">
        <h2 className="font-sans text-lg font-bold text-on-surface leading-tight mb-4">
          {languageMode !== 'hindi' && <span>{t.stockCount}</span>}
          {languageMode === 'bilingual' && <br />}
          {languageMode !== 'english' && <span className="font-medium text-base text-on-surface-variant">{languageMode === 'hindi' ? t.stockCount : 'स्टॉक गणना'}</span>}
        </h2>

        <div className="space-y-4">
          {stockItems.slice(0, 3).map((item, index) => (
            <div key={item.id} id={`stock-row-${item.id}`}>
              {index > 0 && <hr className="border-outline-variant opacity-40 my-3" />}
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-sans text-[15px] font-semibold text-on-surface leading-tight">
                    {languageMode === 'hindi' && item.nameHindi ? item.nameHindi : item.name}
                  </div>
                  <div className="text-xs text-on-surface-variant mt-0.5">
                    {languageMode === 'bilingual' && item.nameHindi ? `${item.nameHindi} • ` : ''}
                    {item.category}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    id={`btn-dec-stock-${item.id}`}
                    aria-label={`Decrease ${item.name}`}
                    onClick={() => handleStockChange(item.id, false)}
                    className="w-11 h-11 rounded-full border border-secondary text-secondary flex items-center justify-center hover:bg-secondary/5 active:bg-secondary-container active:scale-95 transition-all cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    value={item.count}
                    onChange={(e) => {
                      const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                      setStockItems(prev =>
                        prev.map(i => i.id === item.id ? { ...i, count: val } : i)
                      );
                    }}
                    className="font-mono text-base font-bold w-14 text-center text-primary bg-transparent focus:outline-none border-b border-outline-variant/30 focus:border-secondary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    id={`btn-inc-stock-${item.id}`}
                    aria-label={`Increase ${item.name}`}
                    onClick={() => handleStockChange(item.id, true)}
                    className="w-11 h-11 rounded-full bg-secondary text-on-secondary flex items-center justify-center hover:bg-secondary/95 active:scale-95 transition-all cursor-pointer shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Patient Footfall Module */}
      <section id="patient-footfall-card" className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-4">
        <h2 className="font-sans text-lg font-bold text-on-surface leading-tight mb-4">
          {languageMode !== 'hindi' && <span>{t.footfall}</span>}
          {languageMode === 'bilingual' && <br />}
          {languageMode !== 'english' && <span className="font-medium text-base text-on-surface-variant">{languageMode === 'hindi' ? t.footfall : 'रोगी संख्या'}</span>}
        </h2>

        <div className="grid grid-cols-2 gap-4">
          {/* OPD Count Card */}
          <div className="bg-surface-container-low rounded-lg p-3 text-center border border-outline-variant relative group">
            <div className="text-[11px] font-bold text-on-surface-variant tracking-wider uppercase mb-1">{t.opd}</div>
            <div className="font-mono text-3xl font-extrabold text-primary select-none my-1">{opdCount}</div>
            
            {/* Fine controls for manual adjustments */}
            <div className="flex justify-center gap-3 mt-2">
              <button
                id="btn-dec-opd-manual"
                onClick={() => setManualOPDOffset(prev => prev - 1)}
                className="w-10 h-10 rounded-full border border-outline-variant hover:bg-surface-container-high flex items-center justify-center text-on-surface text-sm font-bold active:scale-90 transition-all cursor-pointer shadow-sm"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                id="btn-inc-opd-manual"
                onClick={() => setManualOPDOffset(prev => prev + 1)}
                className="w-10 h-10 rounded-full border border-outline-variant hover:bg-surface-container-high flex items-center justify-center text-on-surface text-sm font-bold active:scale-90 transition-all cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* IPD Count Card */}
          <div className="bg-surface-container-low rounded-lg p-3 text-center border border-outline-variant relative group">
            <div className="text-[11px] font-bold text-on-surface-variant tracking-wider uppercase mb-1">{t.ipd}</div>
            <div className="font-mono text-3xl font-extrabold text-primary select-none my-1">{ipdCount}</div>
            
            {/* Fine controls for manual adjustments */}
            <div className="flex justify-center gap-3 mt-2">
              <button
                id="btn-dec-ipd-manual"
                onClick={() => setManualIPDOffset(prev => prev - 1)}
                className="w-10 h-10 rounded-full border border-outline-variant hover:bg-surface-container-high flex items-center justify-center text-on-surface text-sm font-bold active:scale-90 transition-all cursor-pointer shadow-sm"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                id="btn-inc-ipd-manual"
                onClick={() => setManualIPDOffset(prev => prev + 1)}
                className="w-10 h-10 rounded-full border border-outline-variant hover:bg-surface-container-high flex items-center justify-center text-on-surface text-sm font-bold active:scale-90 transition-all cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-on-surface-variant text-center mt-3">
          {languageMode === 'hindi' 
            ? 'मरीजों को जोड़ने / छुट्टी देने पर ये नंबर अपने आप अपडेट हो जाते हैं।' 
            : 'Synchronized with active patient registries. Adjust manually as needed.'}
        </p>
      </section>

      {/* Staff Attendance Module */}
      <section id="staff-attendance-card" className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-4">
        <h2 className="font-sans text-lg font-bold text-on-surface leading-tight mb-4">
          {languageMode !== 'hindi' && <span>{t.attendance}</span>}
          {languageMode === 'bilingual' && <br />}
          {languageMode !== 'english' && <span className="font-medium text-base text-on-surface-variant">{languageMode === 'hindi' ? t.attendance : 'कर्मचारी उपस्थिति'}</span>}
        </h2>

        <div className="space-y-3">
          {staffMembers.map((member, index) => (
            <div key={member.id} id={`staff-toggle-row-${member.id}`}>
              {index > 0 && <hr className="border-outline-variant opacity-40 my-2.5" />}
              <label className="flex items-center justify-between cursor-pointer py-1 select-none">
                <div>
                  <span className="font-sans text-[15px] font-semibold text-on-surface">
                    {member.role}
                  </span>
                  <div className="text-xs text-on-surface-variant">
                    {member.name}
                    {member.roleHindi && languageMode === 'bilingual' && ` • ${member.roleHindi}`}
                  </div>
                </div>

                <div className="relative">
                  <input
                    id={`toggle-input-${member.id}`}
                    type="checkbox"
                    checked={member.active}
                    onChange={() => handleStaffToggle(member.id)}
                    className="sr-only peer"
                  />
                  <div className="w-14 h-8 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-outline-variant after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-secondary"></div>
                </div>
              </label>
            </div>
          ))}
        </div>
      </section>

      {/* Shift Notes Field */}
      <div id="notes-field-container" className="flex flex-col gap-1.5">
        <label id="lbl-shift-notes" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
          {t.notesLabel}
        </label>
        <textarea
          id="textarea-shift-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t.notesPlaceholder}
          rows={2}
          className="w-full text-sm bg-surface-container-lowest border border-outline-variant rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary placeholder:text-on-surface-variant/50 transition-all resize-none"
        />
      </div>

      {/* Submit Button */}
      <div className="pt-2">
        {submitSuccess ? (
          <div id="submit-success-banner" className="w-full bg-secondary-container text-on-secondary-container border border-secondary/20 p-4 rounded-xl flex items-center gap-3 shadow-md animate-scaleUp">
            <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center shrink-0">
              <Check className="w-5 h-5 text-on-secondary" />
            </div>
            <div>
              <p className="text-sm font-bold">{t.successMsg}</p>
              <p className="text-xs opacity-90">{t.successSub}</p>
            </div>
          </div>
        ) : (
          <button
            id="btn-submit-daily-report"
            onClick={handleFormSubmit}
            className="w-full h-15 bg-secondary text-white hover:bg-secondary/90 active:scale-[0.97] transition-all rounded-xl flex flex-col items-center justify-center leading-tight shadow-md cursor-pointer select-none"
          >
            <span className="font-sans text-base font-bold">{t.submitBtn}</span>
            {languageMode === 'bilingual' && (
              <span className="font-sans text-xs font-normal opacity-85 mt-0.5">
                {t.submitBtnSub}
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
