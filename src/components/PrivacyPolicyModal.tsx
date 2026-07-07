import React from 'react';
import { X, Shield, Scale, ScrollText } from 'lucide-react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PrivacyPolicyModal({ isOpen, onClose }: PrivacyPolicyModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 md:p-6 animate-fadeIn select-text">
      <div className="w-full max-w-3xl h-[85vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center border border-teal-500/20">
              <Shield className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 dark:text-slate-100">Legal & Compliance Framework</h1>
              <p className="text-[10px] text-slate-500 dark:text-slate-450 font-semibold uppercase tracking-wider mt-0.5">Privacy Policy & Terms of Service</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-450 dark:hover:text-slate-200 transition-colors border border-slate-200 dark:border-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 text-slate-650 dark:text-slate-350 text-xs leading-relaxed font-sans">
          
          <div className="bg-teal-50/50 dark:bg-teal-950/10 border border-teal-500/10 rounded-2xl p-4 space-y-1">
            <p className="font-bold text-teal-700 dark:text-teal-400 font-mono text-[10px] tracking-wider uppercase">HealthLink Daily — Legal Document</p>
            <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">Effective Date: July 7, 2026</p>
            <p className="text-slate-500 dark:text-slate-400 text-[11px]">Version: 1.0.0 (Production Release)</p>
          </div>

          {/* PRIVACY POLICY */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <Shield className="w-4 h-4 text-teal-600" />
              <h2 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">PART 1: PRIVACY POLICY</h2>
            </div>

            <div className="space-y-3 pl-1">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-[13px]">1. Introduction & Commitment to Data Protection</h3>
              <p>
                HealthLink Daily (hereafter referred to as "the App," "the Platform," "we," "us," or "our") is designed to optimize public health logistics, facility operations, and administrative coordination at Primary Health Centres (PHCs) and Community Health Centres (CHCs).
              </p>
              <p>
                We respect your privacy and are committed to safeguarding institutional data. This Privacy Policy outlines how we collect, process, secure, and share information when you register an account and interact with the App.
              </p>
            </div>

            <div className="space-y-3 pl-1">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-[13px]">2. The Principle of Data Minimization & No Patient PII</h3>
              <p className="font-semibold text-slate-900 dark:text-slate-100 bg-slate-100/50 dark:bg-slate-800/30 p-3 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
                Unlike typical healthcare software, HealthLink Daily does not collect or process patient-specific Personally Identifiable Information (PII) or Protected Health Information (PHI). We do not ask for, store, or process patient names, government identity numbers, biological sex, precise addresses, or personal medical histories.
              </p>
              <p>
                Our AI-driven demand forecasting models (such as Prophet) and optimization routines process only aggregated, de-identified operational metrics (e.g., total count of malaria cases, paracetamol consumption rates, aggregate bed occupancy).
              </p>
            </div>

            <div className="space-y-3 pl-1">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-[13px]">3. Information We Collect</h3>
              <p>To maintain institutional security and optimize operations, we collect the following categories of data:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong className="text-slate-800 dark:text-slate-200">User Registration & Administrative Data:</strong> Account Credentials (full name, official facility email, phone number, secure password) and Professional Attributes (facility name/ID, district, role).
                </li>
                <li>
                  <strong className="text-slate-800 dark:text-slate-200">Operational & Ingestion Telemetry:</strong> Inventory logs (medicine stock, supplies, expirations), capacity metrics (aggregate OPD, bed occupancy, staff attendance), and voice/text inputs (transcribed via WhatsApp strictly for operational data).
                </li>
                <li>
                  <strong className="text-slate-800 dark:text-slate-200">System Telemetry:</strong> Usage records (device logs, IP addresses, browser types, and timestamped audit actions).
                </li>
              </ul>
            </div>

            <div className="space-y-3 pl-1">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-[13px]">4. How We Use the Data</h3>
              <p>We process collected metrics exclusively for operational enhancement and administrative intelligence:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Demand Forecasting: Predicting local supply stock-outs and medical equipment shortfalls.</li>
                <li>Redistribution Logic: Calculating optimal transit routes to transfer surplus inventory to clinics in deficit.</li>
                <li>Notification and Alerting: Generating automated SMS, WhatsApp, and dashboard notifications.</li>
                <li>Audit Trails: Maintaining chronological history of stock adjustments to prevent theft and mismanagement.</li>
              </ul>
            </div>

            <div className="space-y-3 pl-1">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-[13px]">5. Security & Technical Safeguards</h3>
              <p>To secure all institutional and operational telemetry, the App implements standard enterprise security protocols:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Data in Transit: Encrypted utilizing Transport Layer Security (TLS 1.3).</li>
                <li>Data at Rest: Secured using Advanced Encryption Standard (AES-256).</li>
                <li>Access Control: Governed by strict Role-Based Access Control (RBAC).</li>
                <li>Isolation of Backups: Encrypted backups are stored in isolated cloud environments.</li>
              </ul>
            </div>

            <div className="space-y-3 pl-1">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-[13px]">6. Information Sharing & Third Parties</h3>
              <p>
                <strong className="text-slate-800 dark:text-slate-200">No Commercialization:</strong> We do not sell, rent, lease, or monetize your institutional data, contact information, or usage telemetry to third parties.
              </p>
              <p>
                <strong className="text-slate-800 dark:text-slate-200">Operational Integrations:</strong> We share data with third-party providers (e.g., Twilio, Whisper, Google Cloud APIs) strictly under contract to support active system utilities.
              </p>
              <p>
                <strong className="text-slate-800 dark:text-slate-200">Legal Mandates:</strong> Disclosed only if required under regional health laws, judicial subpoenas, or national security emergencies.
              </p>
            </div>
          </div>

          {/* TERMS AND CONDITIONS */}
          <div className="space-y-4 pt-4 border-t border-slate-150 dark:border-slate-800">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <Scale className="w-4 h-4 text-teal-600" />
              <h2 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">PART 2: TERMS AND CONDITIONS</h2>
            </div>

            <div className="space-y-3 pl-1">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-[13px]">1. Agreement to Terms</h3>
              <p>
                By registering an account, installing the App, or configuring edge integration scripts, you represent that you are an authorized representative of your healthcare institution and that you agree to be bound by these Terms and Conditions. If you do not agree to these terms, you must not use or access the Platform.
              </p>
            </div>

            <div className="space-y-3 pl-1">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-[13px]">2. User Accounts & Eligibility</h3>
              <p>
                <strong className="text-slate-800 dark:text-slate-200">Institutional Verification:</strong> Access is restricted to certified public health professionals, authorized NGO ground teams, and designated district administrators.
              </p>
              <p>
                <strong className="text-slate-800 dark:text-slate-200">Account Security:</strong> You are responsible for password confidentiality. Report any breach immediately.
              </p>
              <p>
                <strong className="text-slate-800 dark:text-slate-200">Account Accuracy:</strong> Maintain accurate, truthful, and up-to-date professional/facility details.
              </p>
            </div>

            <div className="space-y-3 pl-1">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-[13px]">3. Acceptable Use Guidelines</h3>
              <p>The App must be used strictly for legitimate health operations. You agree NOT to:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Submit false, corrupted, or manipulated stock logs, patient footfall metrics, or attendance markers.</li>
                <li>Attempt to reverse-engineer, decompile, or bypass the predictive forecasting or optimization models.</li>
                <li>Use voice/text interfaces to submit patient names, clinical notes, or external PII.</li>
                <li>Conduct penetration testing or load testing without explicit written consent.</li>
              </ul>
            </div>

            <div className="space-y-3 pl-1">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-[13px]">4. Operational Disclaimer & Limitation of Liability</h3>
              <p>
                <strong className="text-slate-800 dark:text-slate-200">Predictions are Estimates:</strong> Forecasts represent statistical estimates and do not guarantee future inventory levels.
              </p>
              <p>
                <strong className="text-slate-800 dark:text-slate-200">The Override Mandate:</strong> Generated plans are clinical recommendations. Local medical officers and supply chain personnel retain final authority.
              </p>
              <p>
                <strong className="text-slate-800 dark:text-slate-200">Service Availability:</strong> Provided on an "as-is" and "as-available" basis without uninterrupted uptime guarantees during power/network dropouts.
              </p>
            </div>

            <div className="space-y-3 pl-1">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-[13px]">5. Intellectual Property Rights</h3>
              <p>
                All platform IP (including database structures, serialization methods, forecasting algorithms, backend API paths, frontend interface design elements, and logos) remains the exclusive property of HealthLink Daily. Users have a limited, non-transferable license to access the system for operational health tasks.
              </p>
            </div>

            <div className="space-y-3 pl-1">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-[13px]">6. Account Deletion & Data Retention</h3>
              <p>
                <strong className="text-slate-800 dark:text-slate-200">Account Deletion:</strong> Terminate anytime by contacting administrators.
              </p>
              <p>
                <strong className="text-slate-800 dark:text-slate-200">Data Retention:</strong> Following account deactivation, operational telemetry will remain inside our secure databases to ensure historical model accuracy.
              </p>
            </div>

            <div className="space-y-3 pl-1">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-[13px]">7. Governing Law</h3>
              <p>
                Governed by and construed in accordance with the national and local healthcare information privacy laws of your deploying jurisdiction.
              </p>
            </div>
          </div>

          {/* CONTACT INFO */}
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-2">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-[13px] flex items-center gap-1.5">
              <ScrollText className="w-4 h-4 text-teal-650" />
              <span>Contact & Compliance Information</span>
            </h3>
            <p>
              For security questions, data modification requests, or system integration compliance details, please reach out to your designated District Health Information Officer or contact us directly at <a href="mailto:support@healthlinkdaily.org" className="text-teal-650 dark:text-teal-400 font-semibold hover:underline">support@healthlinkdaily.org</a>.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end shrink-0">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-colors"
          >
            I Understand
          </button>
        </div>

      </div>
    </div>
  );
}
