import React from 'react';
import { 
  Info, BookOpen, Activity, HelpCircle, ArrowRight, ShieldCheck, 
  Sparkles, CheckCircle2, ChevronRight, MessageSquare 
} from 'lucide-react';

interface AboutViewProps {
  languageMode: 'english' | 'hindi' | 'bilingual';
}

export default function AboutView({ languageMode }: AboutViewProps) {
  const isHindi = languageMode === 'hindi';
  const isBilingual = languageMode === 'bilingual';

  const faqItems = [
    {
      q: "Does this app work offline?",
      qh: "क्या यह ऐप ऑफलाइन काम करता है?",
      a: "Yes! HealthLink Daily supports offline local caching. All patient check-ins, stock updates, and report drafts are saved locally in the browser and synchronized with Firebase once an active internet connection is restored.",
      ah: "हाँ! हेल्थलिंक डेली ऑफलाइन लोकल कैशिंग का समर्थन करता है। सभी मरीजों का पंजीकरण, स्टॉक अपडेट और रिपोर्ट ड्राफ्ट ब्राउज़र में स्थानीय रूप से सहेजे जाते हैं और इंटरनेट कनेक्शन बहाल होने पर फ़ायरबेस के साथ सिंक हो जाते हैं।"
    },
    {
      q: "How does Vertex AI Stock Forecasting work?",
      qh: "वर्टेक्स एआई स्टॉक पूर्वानुमान कैसे काम करता है?",
      a: "The AI system analyzes real-time inventory counts and historical patient footfall logs to estimate remaining days of stock, predict high/low demand thresholds, and generate smart warning suggestions for critical items.",
      ah: "एआई सिस्टम वास्तविक समय की इन्वेंट्री संख्या और ऐतिहासिक रोगी फुटफॉल लॉग का विश्लेषण करके स्टॉक के बचे हुए दिनों का अनुमान लगाता है, और महत्वपूर्ण दवाओं के लिए रीऑर्डर सुझाव देता है।"
    },
    {
      q: "Is patient data secure?",
      qh: "क्या मरीज का डेटा सुरक्षित है?",
      a: "Absolutely. All clinical logs and registries are stored using Firebase's encrypted cloud databases. Access is restricted based on system roles (Admin, Worker, Patient).",
      ah: "बिल्कुल। सभी नैदानिक ​​लॉग और रजिस्ट्रियां फ़ायरबेस के सुरक्षित क्लाउड डेटाबेस में संग्रहीत की जाती हैं। भूमिका-आधारित पहुंच (व्यवस्थापक, कार्यकर्ता, रोगी) लागू है।"
    },
    {
      q: "How do I trigger an over-the-air (OTA) update?",
      qh: "ओटीए (ओवर-द-एयर) अपडेट कैसे करें?",
      a: "Go to 'App Settings' from the menu sidebar, select the 'App Updates' tab, choose your preferred channel (Stable/Beta/Nightly), and click 'Check for OTA Core Updates' to hot-patch the app framework without losing any current data.",
      ah: "साइडबार से 'ऐप सेटिंग्स' पर जाएं, 'ऐप अपडेट' टैब चुनें, और वर्तमान डेटा को खोए बिना ऐप फ्रेमवर्क को हॉट-पैच करने के लिए 'चेक फॉर ओटीए कोर अपडेट' पर क्लिक करें।"
    }
  ];

  return (
    <div className="w-full flex-1 space-y-8 animate-fadeIn select-text pb-12">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-600 via-teal-700 to-cyan-800 p-8 text-white shadow-lg border border-teal-500/20">
        <div className="relative z-10 max-w-xl space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
            <Activity className="w-6 h-6 text-teal-300 animate-pulse" />
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight font-sans">
            {isHindi ? "हेल्थलिंक डेली के बारे में" : "About HealthLink Daily"}
          </h1>
          <p className="text-sm text-teal-100 leading-relaxed font-medium">
            {isHindi 
              ? "स्वास्थ्य केंद्रों के लिए वास्तविक समय में चिकित्सा इन्वेंट्री, रोगी रजिस्ट्री और एआई स्टॉक पूर्वानुमान का प्रबंधन करने के लिए एक आधुनिक डिजिटल समाधान।"
              : "A modern digital solution for community health centers to seamlessly manage real-time medical inventories, patient registries, and AI-driven stock forecasting."}
          </p>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-y-12 translate-x-12">
          <Activity className="w-80 h-80 text-white" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Features & Health Center Impact */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-outline-variant p-6 space-y-6 shadow-sm">
          <div className="flex items-center gap-3 border-b border-outline-variant/60 pb-3">
            <ShieldCheck className="w-5 h-5 text-teal-600" />
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
              {isHindi ? "स्वास्थ्य केंद्र पर प्रभाव" : "Health Center Impact"}
            </h2>
          </div>

          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center shrink-0 text-emerald-600">
                <Sparkles className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {isHindi ? "जीरो मेडिसिन स्टॉकआउट" : "Zero Medicine Stockouts"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                  {isHindi 
                    ? "वर्टेक्स एआई (Vertex AI) मांग में बदलाव और संभावित स्टॉक की कमी को पहले ही भांप लेता है ताकि समय पर दवाओं का ऑर्डर दिया जा सके।"
                    : "Vertex AI demand projections accurately flag potential shortages before they impact clinical care, ensuring uninterrupted patient access."}
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-950 flex items-center justify-center shrink-0 text-teal-600">
                <CheckCircle2 className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {isHindi ? "सटीक डेटा रिपोर्टिंग" : "Accurate Data Reporting"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                  {isHindi 
                    ? "रोगी फुटफॉल (Patient Footfall), स्टाफ उपस्थिति और इन्वेंट्री सिंक की दैनिक डिजिटल रिपोर्ट सीधे क्लाउड डेटाबेस में जमा की जाती है।"
                    : "Digitized daily shift logs summarize patient visits, staff attendance, and stock updates, eliminating manual registry paperwork."}
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-950 flex items-center justify-center shrink-0 text-cyan-600">
                <BookOpen className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {isHindi ? "सरलीकृत रोगी प्रबंधन" : "Simplified Patient Flow"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                  {isHindi 
                    ? "ओपीडी (OPD) और आईपीडी (IPD) रोगियों की आसान ट्रैकिंग, रेफरल और त्वरित डिस्चार्ज प्रबंधन।"
                    : "Instantly registers, discharges, or transfers OPD/IPD patients while providing a clear live snapshot of clinic operations."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Usage Guide */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-outline-variant p-6 space-y-6 shadow-sm">
          <div className="flex items-center gap-3 border-b border-outline-variant/60 pb-3">
            <BookOpen className="w-5 h-5 text-teal-600" />
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
              {isHindi ? "उपयोगकर्ता मार्गदर्शिका" : "App Usage Guide"}
            </h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-teal-600 shrink-0 mt-0.5">1</span>
              <div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {isHindi ? "इन्वेंट्री अपडेट करें (Update Inventory)" : "Update Daily Medical Stock"}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal mt-0.5">
                  Go to "Medical Store", use the camera scanner to log barcodes, or manually add items. Low-stock medicines are auto-flagged in red.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-teal-600 shrink-0 mt-0.5">2</span>
              <div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {isHindi ? "मरीजों का पंजीकरण (Register Patients)" : "Manage Patient Flow"}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal mt-0.5">
                  Register new OPD/IPD cases under the "Patient Registry" tab. Update clinical records, transfer to wards, or mark as discharged.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-teal-600 shrink-0 mt-0.5">3</span>
              <div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {isHindi ? "दैनिक सारांश रिपोर्ट (Submit Shift Report)" : "Submit Shift Summary Report"}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal mt-0.5">
                  Navigate to "Reports", double-check active staff roster count, add notes, and submit. The report automatically locks for the day.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQs */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-outline-variant p-6 space-y-6 shadow-sm">
        <div className="flex items-center gap-3 border-b border-outline-variant/60 pb-3">
          <HelpCircle className="w-5 h-5 text-teal-600" />
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
            {isHindi ? "अक्सर पूछे जाने वाले प्रश्न" : "Frequently Asked Questions (FAQ)"}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {faqItems.map((item, idx) => (
            <div key={idx} className="space-y-2 p-4 bg-slate-50/50 dark:bg-slate-950/40 rounded-2xl border border-outline-variant/50">
              <div className="flex items-start gap-2">
                <MessageSquare className="w-4.5 h-4.5 text-teal-600 shrink-0 mt-0.5" />
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-snug">
                  {isHindi ? item.qh : (isBilingual ? `${item.q} / ${item.qh}` : item.q)}
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed pl-6.5">
                {isHindi ? item.ah : item.a}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center text-[10px] text-slate-400 dark:text-slate-500 font-mono">
        <p>HealthLink Daily • Smart Logistics Management Software</p>
        <p className="mt-0.5">Powered by Google Vertex AI & Firebase Cloud Services</p>
      </div>
    </div>
  );
}
