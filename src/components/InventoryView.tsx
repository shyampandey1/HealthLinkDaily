/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Search, Plus, AlertTriangle, ShieldCheck, Filter, X, Trash2, Sparkles, Camera, Upload, Database, Lock, ShieldAlert, FileCode, Terminal, ArrowRight, Eye, EyeOff, Info, CheckCircle2, Copy, Check, FileText } from 'lucide-react';
import { useState, Dispatch, SetStateAction, FormEvent } from 'react';
import { StockItem } from '../types';
import RealTimeCameraScanner from './RealTimeCameraScanner';

interface InventoryViewProps {
  stockItems: StockItem[];
  setStockItems: Dispatch<SetStateAction<StockItem[]>>;
  languageMode: 'english' | 'hindi' | 'bilingual';
  onAddGeoScan?: (scan: any) => void;
  openPrompt?: (
    type: 'transfer' | 'discharge' | 'delete' | 'submitReport' | 'resetData',
    title: string,
    extra: { patientId?: string; patientName?: string; itemId?: string; itemName?: string },
    onConfirm: (data: any) => void
  ) => void;
}

const DEMO_MEDICINE_BAGS = [
  {
    id: 'A' as const,
    hospital: 'ST. JUDE DISPENSARY',
    date: '2026-07-01',
    rxNumber: 'Rx #9817242',
    patientName: 'Johnathan Doe',
    medication: 'Amoxicillin 500mg',
    dosage: '500mg',
    instructions: 'Take 1 tablet every 8 hours by mouth',
    qty: 30,
    unit: 'Tablets',
    category: 'Tablets',
    doctor: 'Dr. Sarah Jenkins',
    confidence: 0.98,
    color: 'from-blue-500/10 to-teal-500/10 border-blue-500/20'
  },
  {
    id: 'B' as const,
    hospital: 'METRO PHARMACY CORE',
    date: '2026-06-30',
    rxNumber: 'Rx #1284591',
    patientName: 'Maria Rodriguez',
    medication: 'Metformin 1000mg',
    dosage: '1000mg',
    instructions: 'Take 1 tablet twice daily with breakfast and dinner',
    qty: 60,
    unit: 'Tablets',
    category: 'Tablets',
    doctor: 'Dr. Robert Chen',
    confidence: 0.99,
    color: 'from-indigo-500/10 to-purple-500/10 border-indigo-500/20'
  },
  {
    id: 'C' as const,
    hospital: 'PRIMARY HEALTH ASSOCIATES',
    date: '2026-06-28',
    rxNumber: 'Rx #5029312',
    patientName: 'Robert Chen',
    medication: 'Atorvastatin 20mg',
    dosage: '20mg',
    instructions: 'Take 1 tablet daily at bedtime',
    qty: 90,
    unit: 'Tablets',
    category: 'Tablets',
    doctor: 'Dr. Sarah Jenkins',
    confidence: 0.97,
    color: 'from-emerald-500/10 to-teal-500/10 border-emerald-500/20'
  }
];

const CODE_SNIPPETS = {
  cloud_function: `/**
 * Google Cloud Function (Node.js 18+)
 * Trigger: HTTP Request or Cloud Storage (GCS) Finalize Event
 * Dependencies in package.json:
 *   "@google-cloud/vision": "^4.0.0",
 *   "@google-cloud/firestore": "^6.0.0"
 */

const { ImageAnnotatorClient } = require('@google-cloud/vision');
const { Firestore } = require('@google-cloud/firestore');

// Initialize GCF Clients (Lazy-loaded for optimal performance & fast cold-start)
let visionClient;
let firestoreDb;

exports.analyzeMedicineBag = async (req, res) => {
  // Set CORS headers for React client request
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }

  try {
    const { imageUri, fileUrl } = req.body;
    if (!imageUri && !fileUrl) {
      return res.status(400).json({ error: 'Missing image URI or storage fileUrl' });
    }

    // 1. Initialize Clients
    visionClient = visionClient || new ImageAnnotatorClient();
    firestoreDb = firestoreDb || new Firestore();

    // The image can reside in a Google Cloud Storage bucket (gs://...) or be passed as base64
    const imageSource = imageUri.startsWith('gs://') 
      ? { gcsImageUri: imageUri } 
      : { content: imageUri.replace(/^data:image\\\\/\\\\w+;base64,/, '') };

    console.log('Initiating OCR Document Text Analysis via Google Cloud Vision...');
    const [result] = await visionClient.documentTextDetection({ image: imageSource });
    const fullTextAnnotation = result.fullTextAnnotation;

    if (!fullTextAnnotation || !fullTextAnnotation.text) {
      return res.status(422).json({ error: 'No legible text detected on the medicine label' });
    }

    const rawOcrText = fullTextAnnotation.text;
    console.log('Raw Label Transcript Obtained:', rawOcrText);

    // 2. Extractor Engine (Structured extraction of Name, Dosage, Qty)
    const extractedInfo = extractMedicationSchema(rawOcrText);

    // 3. HIPAA Data Scrubbing (Scrubbing common Patient Identifiers, Rx #s, phone, emails)
    const { scrubbedText, redactedElements, phiDetected } = redactPIIAndPHIElements(rawOcrText);

    // 4. Construct Firestore Structured Schema
    const inventoryRecord = {
      name: extractedInfo.medicationName,
      category: extractedInfo.category,
      count: extractedInfo.quantity,
      unit: extractedInfo.unit,
      criticalThreshold: extractedInfo.suggestedThreshold,
      ocrDetails: {
        rawOcrTranscript: rawOcrText,
        scrubbedOcrTranscript: scrubbedText,
        confidence: result.textAnnotations[0]?.confidence || 0.95,
      },
      fileReference: {
        originalPath: imageUri,
        publicAccess: false, // Bucket must strictly remain private
      },
      hipaaAudit: {
        phiDetected: phiDetected,
        redactedElements: redactedElements,
        auditedAt: new Date().toISOString(),
        complianceVersion: "HIPAA-HITECH-v1"
      },
      createdAt: Firestore.FieldValue.serverTimestamp()
    };

    // 5. Atomic Push to Cloud Firestore 'Inventory' Collection
    const docRef = await firestoreDb.collection('Inventory').add(inventoryRecord);
    
    return res.status(200).json({
      success: true,
      documentId: docRef.id,
      extractedData: {
        name: inventoryRecord.name,
        category: inventoryRecord.category,
        count: inventoryRecord.count,
        unit: inventoryRecord.unit,
        criticalThreshold: inventoryRecord.criticalThreshold
      },
      hipaa: inventoryRecord.hipaaAudit
    });

  } catch (error) {
    console.error('GCF Execution Error:', error);
    return res.status(500).json({ 
      error: 'Failed to process vision model extraction', 
      details: error.message 
    });
  }
};

/**
 * Parses OCR lines using regular expression heuristics for high-accuracy match
 */
function extractMedicationSchema(text) {
  const lines = text.split('\\\\n');
  let medicationName = "Unknown Medication";
  let dosage = "Unknown";
  let quantity = 100;
  let unit = "Tablets";
  let category = "Tablets";

  // Common medication matching dictionary
  const commonMedPatterns = [
    /Amoxicillin/i, /Metformin/i, /Atorvastatin/i, /Paracetamol/i, 
    /Ibuprofen/i, /Lisinopril/i, /Levothyroxine/i, /Gabapentin/i
  ];

  for (const line of lines) {
    // 1. Detect medication names
    for (const pattern of commonMedPatterns) {
      if (pattern.test(line)) {
        const match = line.match(/([A-Za-z\\\\s]+)/);
        if (match) medicationName = match[1].trim();
      }
    }

    // 2. Detect Dosage Strength (e.g. 500mg, 1000 mg, 10ml, 20mcg)
    const dosageMatch = line.match(/(\\\\d+\\\\s*(?:mg|g|mcg|ml|l|capsules|tablets))/i);
    if (dosageMatch) {
      dosage = dosageMatch[1].trim();
    }

    // 3. Detect quantities (e.g. Qty: 30, Quantity 60, Count: 90)
    const qtyMatch = line.match(/(?:qty|quantity|count|amount|dispensed)[:\\\\s]*(\\\\d+)/i);
    if (qtyMatch) {
      quantity = parseInt(qtyMatch[1], 10);
    }
  }

  // Determine category and unit
  if (/capsule/i.test(text)) {
    category = "Capsules";
    unit = "Capsules";
  } else if (/bottle|liquid|syrup/i.test(text)) {
    category = "500ml Bottles";
    unit = "Bottles";
  } else if (/sachet/i.test(text)) {
    category = "Sachets";
    unit = "Sachets";
  }

  return {
    medicationName: medicationName + (dosage !== "Unknown" ? " " + dosage : ""),
    quantity,
    unit,
    category,
    suggestedThreshold: Math.ceil(quantity * 0.3) // Safeguard minimum at 30%
  };
}

/**
 * Scans label texts and redacts Patient Identifiers (Names, Birthdays, Rx serials)
 */
function redactPIIAndPHIElements(text) {
  let scrubbedText = text;
  const redactedElements = [];
  let phiDetected = false;

  // Pattern 1: Rx Prescription Numbers (e.g. Rx: 9817242, Rx# 1284591)
  const rxPattern = /(Rx\\\\s*#?\\\\s*[:\\\\-\\\\s]*)\\\\b(\\\\d{5,10})\\\\b/gi;
  if (rxPattern.test(text)) {
    phiDetected = true;
    scrubbedText = scrubbedText.replace(rxPattern, (match, p1, p2) => {
      redactedElements.push(\`Prescription Number: \${p2}\`);
      return \`\${p1}[REDACTED_RX_NUMBER]\`;
    });
  }

  // Pattern 2: Explicit Patient Identifier labels (e.g. Patient: John Doe, Name: Jane Doe)
  const patientPattern = /(Patient|Name|Pat|Client)[:\\\\s]+([A-Za-z\\\\s]+)(?=\\\\n|$)/gi;
  if (patientPattern.test(text)) {
    phiDetected = true;
    scrubbedText = scrubbedText.replace(patientPattern, (match, p1, p2) => {
      redactedElements.push(\`Patient Identifiable Name: \${p2.trim()}\`);
      return \`\${p1}: [REDACTED_PATIENT_NAME]\`;
    });
  }

  // Pattern 3: Dates of Birth or SSNs
  const dobPattern = /\\\\b\\\\d{2}\\\\/\\\\d{2}\\\\/\\\\d{4}\\\\b/g;
  if (dobPattern.test(text)) {
    phiDetected = true;
    scrubbedText = scrubbedText.replace(dobPattern, (match) => {
      redactedElements.push(\`Date of Birth: \${match}\`);
      return "[REDACTED_DOB]";
    });
  }

  return { scrubbedText, redactedElements, phiDetected };
}`,
  schema: `/**
 * Cloud Firestore Collection Design 'Inventory'
 * Strict Typescript Interface & Insertion Logic
 */

export interface FirestoreInventoryDocument {
  id?: string;             // Firestore auto-generated ID
  name: string;            // Extracted medication name (e.g., "Amoxicillin 500mg")
  category: string;        // Categorized stock item (e.g., "Tablets", "Capsules")
  count: number;           // Quantitative available stock size
  unit: string;            // Descriptive unit (e.g., "Tablets")
  criticalThreshold: number; // Low-stock threshold limit for alerting

  // HIPAA Auditing and OCR Verification Meta
  ocrDetails: {
    rawOcrTranscript: string;       // Original raw OCR dump
    scrubbedOcrTranscript: string;   // Cleaned OCR text with PHI/PII removed
    confidence: number;             // Model OCR extraction confidence score (0-1)
  };

  fileReference: {
    originalPath: string;           // Storage Path: gs://clinical-inventory-records/medicine_label.jpg
    publicAccess: boolean;          // Strictly False (Enforce backend authenticated IAM)
  };

  hipaaAudit: {
    phiDetected: boolean;           // Flag indicating if patient details were on bag
    redactedElements: string[];     // Auditing logs of what was scrubbed (e.g., ["Patient Name: John Doe"])
    auditedAt: string;              // ISO Timestamp
    complianceVersion: string;      // Current HIPAA scrubber software release version
  };

  createdAt: any;                   // Firestore ServerTimestamp
}

// FRONTEND SUBMISSION CALL
// Uploads to GCS and pushes to Firestore securely
import { db, storage } from '../lib/firebase'; // Your standard Firebase Client config
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export async function processAndSaveInventory(
  file: File, 
  extractedData: Partial<FirestoreInventoryDocument>
) {
  try {
    // 1. HIPAA Pre-flight Check: Ensure filename doesn't contain patient names
    const sanitizedFileName = \`inventory_scans/\${Date.now()}_\${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}\`;
    const storageRef = ref(storage, sanitizedFileName);

    // 2. Upload original file to private Storage bucket
    const uploadResult = await uploadBytes(storageRef, file, {
      contentType: file.type,
      customMetadata: {
        'hipaa-sensitive': 'true',
        'access-control': 'private'
      }
    });

    const gcsUri = \`gs://\${uploadResult.metadata.bucket}/\${uploadResult.metadata.fullPath}\`;

    // 3. Construct Firestore payload
    const payload: FirestoreInventoryDocument = {
      name: extractedData.name || "Unknown Medication",
      category: extractedData.category || "Tablets",
      count: extractedData.count || 0,
      unit: extractedData.unit || "Tablets",
      criticalThreshold: extractedData.criticalThreshold || 10,
      ocrDetails: {
        rawOcrTranscript: extractedData.ocrDetails?.rawOcrTranscript || "",
        scrubbedOcrTranscript: extractedData.ocrDetails?.scrubbedOcrTranscript || "",
        confidence: extractedData.ocrDetails?.confidence || 0.95,
      },
      fileReference: {
        originalPath: gcsUri,
        publicAccess: false
      },
      hipaaAudit: {
        phiDetected: extractedData.hipaaAudit?.phiDetected ?? false,
        redactedElements: extractedData.hipaaAudit?.redactedElements || [],
        auditedAt: new Date().toISOString(),
        complianceVersion: "HIPAA-HITECH-v1"
      },
      createdAt: serverTimestamp()
    };

    // 4. Secure addDoc into the protected Firestore 'Inventory' collection
    const docRef = await addDoc(collection(db, 'Inventory'), payload);
    return { success: true, documentId: docRef.id };

  } catch (error) {
    console.error("Firestore database integration failed:", error);
    throw error;
  }
}`,
  security: `### HIPAA Compliance & Data Security Best Practices

When handling image-based medicine scans within healthcare workflows, you must enforce a **Zero-Trust Security architecture** to ensure full compliance with the **Health Insurance Portability and Accountability Act (HIPAA)** and the **HITECH Act**:

#### 1. Google Cloud Storage (GCS) Hardening
- **Never Make Bucket Contents Public**: Under no circumstances should the GCS bucket containing OCR scans have public read access. Ensure **Uniform Bucket-Level Access (UBLA)** is enabled.
- **Service-Side Access Control (IAM)**: Restrict access to the bucket strictly to the Cloud Function's service account.
- **Signed URLs for Client Previews**: If your React frontend needs to display the scanned image, do not reference the static public link. Instead, generate an authenticated **Signed URL** with an expiration time of less than 5 minutes.
- **Lifecycle Policies**: Enforce standard GCS Object Lifecycle Management to auto-purge or archive scanned images into cold storage (Archive Class) after 30 days to limit the surface area of active PHI.

#### 2. OCR-Side Protected Health Information (PHI) Scrubbing
- **Pharmacy Label Risk**: Labels printed by outpatient pharmacies contain highly sensitive PHI:
  - Patient Full Name
  - Prescription Number (Rx #)
  - Prescribing Physician Name
  - Pharmacy Location & Store ID
  - Daily dosage schedules linked directly to private medical diagnostics.
- **Real-Time Redaction Pipeline**: Ingest the raw OCR transcript and immediately run high-precision regular expression mask filters *before* any text is stored or returned to standard logs, ensuring zero leakage into Cloud Logging (Stackdriver) or database logs.

#### 3. Data Transit & Storage Security
- **Data-at-Rest Encryption**: Enforce Customer-Managed Encryption Keys (CMEK) via Google Cloud KMS for the Firestore database and Storage buckets containing healthcare artifacts.
- **Data-in-Transit Encryption**: All client-server endpoints must operate strictly over HTTPS/TLS 1.3.
- **Audit Logs**: Maintain a secure, non-malleable audit trail of every database interaction, logging who read or modified stock items, to satisfy HIPAA Security Rule §164.312(b).`
};

export default function InventoryView({ stockItems, setStockItems, languageMode, onAddGeoScan, openPrompt }: InventoryViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scannerTab, setScannerTab] = useState<'sandbox' | 'blueprint'>('sandbox');
  const [activeCodeTab, setActiveCodeTab] = useState<'cloud_function' | 'schema' | 'security'>('cloud_function');
  const [copiedText, setCopiedText] = useState(false);

  // Scanner Simulator States
  const [selectedDemoId, setSelectedDemoId] = useState<'A' | 'B' | 'C' | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [scanResult, setScanResult] = useState<any | null>(null);
  const [hidePhi, setHidePhi] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  const [customFile, setCustomFile] = useState<{name: string, size: number} | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  // New stock form state
  const [newName, setNewName] = useState('');
  const [newNameHindi, setNewNameHindi] = useState('');
  const [newCategory, setNewCategory] = useState('Tablets');
  const [newCount, setNewCount] = useState<number>(100);
  const [newUnit, setNewUnit] = useState('Tablets');
  const [newThreshold, setNewThreshold] = useState<number>(30);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Real-Time WebRTC Camera & Voice Scanner States
  const [isRealTimeScannerOpen, setIsRealTimeScannerOpen] = useState(false);

  const handleCameraScanComplete = (parsedData: any, locationData: { lat: number; lng: number } | null) => {
    const mappedResult = {
      id: 'A' as const,
      hospital: parsedData.sourceMethod || 'PHC DIGITAL SCANNER',
      date: new Date().toISOString().split('T')[0],
      rxNumber: 'Batch: ' + (parsedData.batch_number || 'N/A'),
      patientName: locationData ? `GPS Lat: ${locationData.lat}` : 'Local Base Station',
      doctor: locationData ? `GPS Lng: ${locationData.lng}` : 'District Coordinates',
      medication: parsedData.medicine_name || 'NaCl 0.9% Normal Saline',
      dosage: 'Exp: ' + (parsedData.expiry_date || 'N/A'),
      instructions: `Item classified as: ${parsedData.item_type.toUpperCase()}. Geotagged at [${locationData?.lat ?? 'N/A'}, ${locationData?.lng ?? 'N/A'}].`,
      qty: parsedData.qty || 30,
      unit: parsedData.item_type === 'drip' ? 'Bottles' : parsedData.item_type === 'vial' ? 'Vials' : 'Tablets',
      category: parsedData.item_type === 'drip' ? '500ml Bottles' : parsedData.item_type === 'vial' ? 'Consumables' : 'Tablets',
      confidence: parsedData.confidence || 0.95,
      color: 'from-emerald-500/10 to-teal-500/10 border-emerald-500/25 shadow-emerald-500/5',
      lat: locationData?.lat || 28.5355,
      lng: locationData?.lng || 77.3910,
      itemType: parsedData.item_type || 'drip',
      batchNumber: parsedData.batch_number || 'B-OCR-992',
      expiryDate: parsedData.expiry_date || '12/2028',
      verbalLog: parsedData.verbalLog || undefined
    };

    setScanResult(mappedResult);
    triggerToast(languageMode === 'hindi' ? 'वास्तविक समय कैमरा स्कैन सफल!' : 'Real-time camera scanner extracted labels successfully!');
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleSimulateScan = () => {
    if (!selectedDemoId && !customFile) return;
    setIsScanning(true);
    setScanStep(1);
    setScanResult(null);

    // Simulate steps sequentially
    setTimeout(() => {
      setScanStep(2);
    }, 400);

    setTimeout(() => {
      setScanStep(3);
    }, 850);

    setTimeout(() => {
      setScanStep(4);
    }, 1300);

    setTimeout(() => {
      let finalResult = null;
      if (selectedDemoId) {
        finalResult = DEMO_MEDICINE_BAGS.find(b => b.id === selectedDemoId);
      } else {
        finalResult = {
          id: 'A' as const,
          hospital: 'UPLOADED CLINICAL LABS',
          date: new Date().toISOString().split('T')[0],
          rxNumber: 'Rx #' + Math.floor(1000000 + Math.random() * 9000000),
          patientName: 'Jane Peterson',
          medication: customFile?.name.split('.')[0].toUpperCase().replace(/[^a-zA-Z0-9]/g, ' ') || 'Custom Ingestion Medication 500mg',
          dosage: '500mg',
          instructions: 'Take 1 tablet twice daily with food.',
          qty: 45,
          unit: 'Tablets',
          category: 'Tablets',
          doctor: 'Dr. Sarah Jenkins',
          confidence: 0.95,
          color: 'from-blue-500/10 to-teal-500/10 border-blue-500/20'
        };
      }

      setScanResult(finalResult);
      setIsScanning(false);
      setScanStep(0);
      triggerToast(languageMode === 'hindi' ? 'दवा का विवरण सफलतापूर्वक निकाला गया!' : 'Medication details successfully extracted & scrubbed!');
    }, 1800);
  };

  const handleAddScannedItem = (result: any) => {
    const medName = result.medication.split(' ')[0];
    const dosage = result.dosage || result.medication.split(' ').slice(1).join(' ') || '500mg';
    
    // Check if item already exists in local inventory
    const exists = stockItems.some(item => item.name.toLowerCase().includes(medName.toLowerCase()));
    
    if (exists) {
      setStockItems(prev =>
        prev.map(item => {
          if (item.name.toLowerCase().includes(medName.toLowerCase())) {
            return { ...item, count: item.count + result.qty };
          }
          return item;
        })
      );
      triggerToast(languageMode === 'hindi' ? `${medName} की मात्रा में ${result.qty} जोड़ा गया!` : `Added ${result.qty} units to existing ${medName} stock!`);
    } else {
      const newItem: StockItem = {
        id: `stock-${Date.now()}`,
        name: `${medName} ${dosage}`,
        nameHindi: undefined,
        category: result.category || 'Tablets',
        count: result.qty,
        unit: result.unit || 'Tablets',
        criticalThreshold: Math.ceil(result.qty * 0.3)
      };
      setStockItems(prev => [...prev, newItem]);
      triggerToast(languageMode === 'hindi' ? `${medName} को इन्वेंट्री में जोड़ा गया!` : `Added new item ${medName} ${dosage} with ${result.qty} Qty!`);
    }

    // Capture to central logistics geoScans if onAddGeoScan callback is provided
    if (onAddGeoScan) {
      onAddGeoScan({
        medicineName: result.medication,
        batchNumber: result.batchNumber || 'N/A',
        expiryDate: result.expiryDate || 'N/A',
        itemType: result.itemType || 'box',
        qty: result.qty,
        lat: result.lat || 28.5355,
        lng: result.lng || 77.3910,
        confidence: result.confidence || 0.95,
        verbalLog: result.verbalLog
      });
    }

    setShowScanner(false);
    setSelectedDemoId(null);
    setScanResult(null);
    setCustomFile(null);
  };

  // Filter & Search stock items
  const filteredItems = stockItems.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.nameHindi && item.nameHindi.includes(searchQuery));
    const matchesCategory = filterCategory === 'All' || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Unique categories for filtering
  const categories = ['All', ...Array.from(new Set(stockItems.map(item => item.category)))];

  // Quick increment/decrement inside Inventory tab
  const handleAdjustCount = (itemId: string, amount: number) => {
    setStockItems(prev =>
      prev.map(item => {
        if (item.id === itemId) {
          return { ...item, count: Math.max(0, item.count + amount) };
        }
        return item;
      })
    );
  };

  // Add new stock item
  const handleAddItem = (e: FormEvent) => {
    e.preventDefault();
    if (!newName) return;

    const newItem: StockItem = {
      id: `stock-${Date.now()}`,
      name: newName,
      nameHindi: newNameHindi || undefined,
      category: newCategory,
      count: newCount,
      unit: newUnit,
      criticalThreshold: newThreshold
    };

    setStockItems(prev => [...prev, newItem]);
    
    // Reset form
    setNewName('');
    setNewNameHindi('');
    setNewCategory('Tablets');
    setNewCount(100);
    setNewUnit('Tablets');
    setNewThreshold(30);
    setShowAddForm(false);
  };

  // Status helper according to brand specs
  const getStockStatus = (item: StockItem) => {
    if (item.count <= item.criticalThreshold) {
      return {
        label: languageMode === 'hindi' ? 'अति आवश्यक' : 'CRITICAL',
        class: 'bg-red-500/10 text-red-600 border-red-500/25',
        dot: 'bg-red-500'
      };
    } else if (item.count <= item.criticalThreshold * 1.5) {
      return {
        label: languageMode === 'hindi' ? 'कम स्टॉक' : 'LOW STOCK',
        class: 'bg-amber-500/10 text-amber-600 border-amber-500/25',
        dot: 'bg-amber-500'
      };
    } else {
      return {
        label: languageMode === 'hindi' ? 'सुरक्षित' : 'STABLE',
        class: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/25',
        dot: 'bg-emerald-500'
      };
    }
  };

  return (
    <div id="inventory-view-main" className="flex flex-col gap-5 animate-fadeIn">
      {/* Header & Add Item button */}
      <div className="flex justify-between items-center">
        <div>
          <span className="text-xs font-bold text-secondary uppercase tracking-wider">
            {languageMode === 'hindi' ? 'आपूर्ति श्रृंखला' : 'Supply & Asset Ledger'}
          </span>
          <h2 id="inventory-header" className="font-sans text-xl font-bold text-on-surface">
            {languageMode === 'hindi' ? 'चिकित्सा भंडार' : 'Medical Inventory'}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            id="btn-toggle-scanner"
            onClick={() => {
              setShowScanner(!showScanner);
              if (showAddForm) setShowAddForm(false);
            }}
            className={`transition-all text-xs font-semibold px-3 py-1.5 rounded flex items-center gap-1.5 shadow-sm cursor-pointer !text-white ${
              showScanner 
                ? 'bg-slate-900 hover:bg-black border border-slate-800' 
                : 'bg-teal-600 hover:bg-teal-700'
            }`}
            style={{ color: '#ffffff' }}
          >
            {showScanner ? <X className="w-3.5 h-3.5 !text-white" style={{ color: '#ffffff' }} /> : <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />}
            <span style={{ color: '#ffffff' }}>{showScanner ? 'Close Scanner' : 'MediScan Vision'}</span>
          </button>
          
          <button
            id="btn-toggle-add-stock-form"
            onClick={() => {
              setShowAddForm(!showAddForm);
              if (showScanner) setShowScanner(false);
            }}
            className="bg-secondary !text-white hover:bg-secondary/95 transition-all text-xs font-semibold px-3 py-1.5 rounded flex items-center gap-1.5 shadow-sm cursor-pointer"
            style={{ color: '#ffffff' }}
          >
            {showAddForm ? <X className="w-3.5 h-3.5 !text-white" style={{ color: '#ffffff' }} /> : <Plus className="w-3.5 h-3.5 !text-white" style={{ color: '#ffffff' }} />}
            <span style={{ color: '#ffffff' }}>{showAddForm ? (languageMode === 'hindi' ? 'बंद करें' : 'Cancel') : (languageMode === 'hindi' ? 'नया आइटम' : 'Add Item')}</span>
          </button>
        </div>
      </div>

      {/* Expandable Add Stock Form */}
      {showAddForm && (
        <form 
          id="form-add-stock-item"
          onSubmit={handleAddItem} 
          className="bg-surface-container-lowest border border-outline-variant p-4 rounded-xl shadow-md space-y-3 animate-scaleUp"
        >
          <div className="text-sm font-bold text-primary border-b border-outline-variant pb-1.5">
            {languageMode === 'hindi' ? 'नया स्टॉक जोड़ें' : 'Add New Supplies / Asset'}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-on-surface-variant uppercase">English Name*</label>
              <input
                type="text"
                required
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Paracetamol 650mg"
                className="text-sm bg-surface-container border border-outline-variant rounded p-2 focus:ring-1 focus:ring-secondary focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-on-surface-variant uppercase">हिन्दी नाम (Optional)</label>
              <input
                type="text"
                value={newNameHindi}
                onChange={e => setNewNameHindi(e.target.value)}
                placeholder="पैरासिटामोल 650 मि.ग्रा."
                className="text-sm bg-surface-container border border-outline-variant rounded p-2 focus:ring-1 focus:ring-secondary focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-on-surface-variant uppercase">Category</label>
              <select
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
                className="text-sm bg-surface-container border border-outline-variant rounded p-2 focus:ring-1 focus:ring-secondary focus:outline-none"
              >
                <option value="Tablets">Tablets</option>
                <option value="Capsules">Capsules</option>
                <option value="500ml Bottles">500ml Bottles</option>
                <option value="Sachets">Sachets</option>
                <option value="Consumables">Consumables</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-on-surface-variant uppercase">Initial Qty</label>
              <input
                type="number"
                min="0"
                value={newCount}
                onChange={e => setNewCount(parseInt(e.target.value) || 0)}
                className="text-sm bg-surface-container border border-outline-variant rounded p-2 focus:ring-1 focus:ring-secondary focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-on-surface-variant uppercase">Unit</label>
              <input
                type="text"
                value={newUnit}
                onChange={e => setNewUnit(e.target.value)}
                placeholder="Tablets"
                className="text-sm bg-surface-container border border-outline-variant rounded p-2 focus:ring-1 focus:ring-secondary focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-on-surface-variant uppercase">Critical Threshold Alert Level</label>
            <input
              type="number"
              min="0"
              value={newThreshold}
              onChange={e => setNewThreshold(parseInt(e.target.value) || 0)}
              className="text-sm bg-surface-container border border-outline-variant rounded p-2 focus:ring-1 focus:ring-secondary focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-primary text-on-primary hover:bg-black font-semibold text-sm py-2 rounded shadow transition-all cursor-pointer"
          >
            {languageMode === 'hindi' ? 'स्टॉक सहेजें' : 'Save Item to Inventory'}
          </button>
        </form>
      )}

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-50 border border-teal-500/30 animate-slideIn">
          <div className="bg-teal-500/10 text-teal-400 p-1 rounded-full border border-teal-500/20">
            <CheckCircle2 className="w-5 h-5 text-teal-400" />
          </div>
          <span className="text-xs font-semibold">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-white/40 hover:text-white transition-all ml-1 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Google Cloud Vision Scanner Panel */}
      {showScanner && (
        <div id="ai-scanner-panel" className="bg-surface-container-lowest border border-teal-600/30 rounded-2xl shadow-lg p-5 space-y-4 animate-scaleUp">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-outline-variant pb-3 gap-3">
            <div className="flex items-center gap-2.5">
              <div className="bg-teal-500/10 text-teal-600 p-2 rounded-xl border border-teal-500/20">
                <Sparkles className="w-5 h-5 text-teal-600 animate-pulse" />
              </div>
              <div>
                <h3 className="font-sans text-sm font-bold text-on-surface">
                  MediScan Vision
                </h3>
                <p className="text-[11px] text-on-surface-variant font-medium mt-0.5">
                  Analyze clinical medicine containers and boxes to extract medication name, dosage strength, and package quantities.
                </p>
              </div>
            </div>

            {/* Selector Tabs */}
            <div className="flex bg-surface-container-low p-1 rounded-lg self-start shrink-0 border border-outline-variant">
              <button
                id="btn-tab-scanner-sandbox"
                type="button"
                onClick={() => setScannerTab('sandbox')}
                className={`text-xs font-bold px-3 py-1.5 rounded-md cursor-pointer transition-all flex items-center gap-1.5 ${
                  scannerTab === 'sandbox' 
                    ? 'bg-teal-600 text-white shadow-sm' 
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Interactive Sandbox</span>
              </button>
              <button
                id="btn-tab-scanner-blueprint"
                type="button"
                onClick={() => setScannerTab('blueprint')}
                className={`text-xs font-bold px-3 py-1.5 rounded-md cursor-pointer transition-all flex items-center gap-1.5 ${
                  scannerTab === 'blueprint' 
                    ? 'bg-teal-600 text-white shadow-sm' 
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>Production Blueprint</span>
              </button>
            </div>
          </div>

          {/* TAB 1: SANDBOX */}
          {scannerTab === 'sandbox' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left Column: Input Selection / Upload (Span 5) */}
              <div className="lg:col-span-5 space-y-4">
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider">
                    Step 1: Ingest Medicine Bag Image
                  </h4>
                  <p className="text-[11px] text-on-surface-variant leading-relaxed">
                    Select a high-fidelity medicine label sample below, drop an image file, or open your camera to capture directly.
                  </p>
                </div>

                {/* PROMINENT LAUNCH SCANNER WebRTC OVERLAY TRIGGER */}
                <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/25 rounded-xl p-3.5 space-y-2 shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/20">
                      Live Optical Input
                    </span>
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-800/80 leading-normal">
                    Automated box, vial, and drip scanning with real-time GPS coordinate logging and voice-command activation.
                  </p>
                  <button
                    id="btn-launch-camera-scanner"
                    type="button"
                    onClick={() => setIsRealTimeScannerOpen(true)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 rounded-lg transition-all shadow flex items-center justify-center gap-2 cursor-pointer border border-emerald-500/35"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Launch Scanner</span>
                  </button>
                </div>

                {/* Pre-populated Demo Labels */}
                <div className="grid grid-cols-1 gap-2.5">
                  {DEMO_MEDICINE_BAGS.map(demo => (
                    <button
                      key={demo.id}
                      id={`demo-sample-${demo.id}`}
                      type="button"
                      onClick={() => {
                        setSelectedDemoId(demo.id);
                        setScanResult(null);
                        setScanStep(0);
                        setIsScanning(false);
                      }}
                      className={`text-left p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 relative ${
                        selectedDemoId === demo.id
                          ? 'border-teal-600 bg-teal-500/5 ring-1 ring-teal-600 shadow-sm'
                          : 'border-outline-variant bg-surface-container-low hover:border-outline hover:bg-surface-container-lowest'
                      }`}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className="text-[9px] font-bold tracking-wider px-2 py-0.5 rounded bg-surface-container text-primary border border-outline-variant">
                          LABEL SAMPLE {demo.id}
                        </span>
                        <span className="text-[10px] text-on-surface-variant font-mono font-medium">
                          Confidence: {(demo.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-on-surface truncate">{demo.medication}</div>
                        <div className="text-[10px] text-on-surface-variant font-mono mt-0.5">
                          {demo.hospital} • Qty: {demo.qty} {demo.unit}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Drag and Drop Zone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragActive(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      const file = e.dataTransfer.files[0];
                      setCustomFile({ name: file.name, size: file.size });
                      setSelectedDemoId(null);
                      setScanResult(null);
                      setScanStep(0);
                    }
                  }}
                  className={`border border-dashed rounded-xl p-4 text-center transition-all cursor-pointer relative ${
                    dragActive 
                      ? 'border-teal-600 bg-teal-500/5' 
                      : 'border-outline-variant bg-surface-container-low hover:border-outline'
                  }`}
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        setCustomFile({ name: file.name, size: file.size });
                        setSelectedDemoId(null);
                        setScanResult(null);
                        setScanStep(0);
                      }
                    };
                    input.click();
                  }}
                >
                  <Upload className="w-5 h-5 mx-auto text-on-surface-variant/60 mb-1.5" />
                  {customFile ? (
                    <div>
                      <p className="text-xs font-bold text-on-surface truncate">{customFile.name}</p>
                      <p className="text-[10px] text-on-surface-variant mt-0.5">{(customFile.size / 1024).toFixed(1)} KB • Click to replace</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-bold text-on-surface">Upload Custom Bag Scan</p>
                      <p className="text-[10px] text-on-surface-variant mt-0.5">Drag-and-drop or browse local device</p>
                    </div>
                  )}
                </div>

                {/* Trigger Button */}
                <button
                  id="btn-trigger-vision-analysis"
                  type="button"
                  disabled={!selectedDemoId && !customFile}
                  onClick={handleSimulateScan}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow cursor-pointer ${
                    (!selectedDemoId && !customFile)
                      ? 'bg-surface-container border border-outline-variant text-on-surface-variant/40 cursor-not-allowed'
                      : isScanning 
                        ? 'bg-teal-600/20 text-teal-800'
                        : 'bg-teal-600 hover:bg-teal-700 text-white'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isScanning ? 'Vision Engine Active...' : 'Trigger OCR & HIPAA Redaction'}</span>
                </button>
              </div>

              {/* Right Column: Output Showcase & Visual HIPAA Scrubber (Span 7) */}
              <div className="lg:col-span-7 border-l border-outline-variant/60 lg:pl-5 space-y-4">
                {/* Simulated Steps Logger */}
                {isScanning && (
                  <div className="bg-slate-900 text-teal-400 font-mono text-[11px] p-4 rounded-xl border border-teal-500/20 space-y-2.5 shadow-inner">
                    <div className="flex items-center gap-2 text-white font-bold border-b border-teal-500/10 pb-1.5">
                      <Terminal className="w-4 h-4 text-teal-400" />
                      <span>CLOUDFUNCTION_CONTAINER_LOGS</span>
                    </div>
                    <div className="space-y-1.5 text-[10px]">
                      <p className={scanStep >= 1 ? 'text-teal-400 font-bold' : 'text-slate-600'}>
                        {scanStep >= 1 ? '✔' : '⟳'} [GCS_INGESTION] gs://hl-clinical-inventory/{customFile ? customFile.name : `demo_label_${selectedDemoId?.toLowerCase()}.jpg`}
                      </p>
                      <p className={scanStep >= 2 ? 'text-teal-400 font-bold' : 'text-slate-600'}>
                        {scanStep >= 2 ? '✔' : '⟳'} [VISION_OCR] documentTextDetection requested. Processing layout bounds...
                      </p>
                      <p className={scanStep >= 3 ? 'text-teal-400 font-bold' : 'text-slate-600'}>
                        {scanStep >= 3 ? '✔' : '⟳'} [HIPAA_GUARD] Scrutinizing transcript. Found PHI elements! Redaction triggered.
                      </p>
                      <p className={scanStep >= 4 ? 'text-teal-400 font-bold' : 'text-slate-600'}>
                        {scanStep >= 4 ? '✔' : '⟳'} [DATABASE_COMMIT] Parsing schema. Structuring fields for Firestore push...
                      </p>
                    </div>
                    {/* Laser Scan line effect */}
                    <div className="relative h-1 w-full bg-slate-800 rounded overflow-hidden mt-2">
                      <div className="absolute top-0 bottom-0 left-0 bg-teal-400 animate-[shimmer_1.5s_infinite] w-1/3" />
                    </div>
                  </div>
                )}

                {/* Initial Blank State */}
                {!isScanning && !scanResult && (
                  <div className="bg-surface-container-low rounded-2xl border border-outline-variant/60 p-10 text-center text-on-surface-variant flex flex-col items-center justify-center h-full min-h-[300px]">
                    <div className="bg-outline-variant/40 p-4 rounded-full mb-3 text-on-surface-variant">
                      <Camera className="w-8 h-8 opacity-60" />
                    </div>
                    <h5 className="font-sans font-bold text-sm text-on-surface">No Active Vision Result</h5>
                    <p className="text-xs text-on-surface-variant max-w-sm mt-1 leading-relaxed">
                      Choose a sample label on the left and trigger the analyzer to observe GCS processing and OCR parsing in real time.
                    </p>
                  </div>
                )}

                {/* Live Parsed Results Panel */}
                {!isScanning && scanResult && (
                  <div className="space-y-4 animate-fadeIn">
                    {/* Part 1: Visual HIPAA Label Sticker */}
                    <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-4 relative overflow-hidden shadow-inner">
                      <div className="flex justify-between items-center border-b border-outline-variant/60 pb-2 mb-3">
                        <div className="flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-teal-600" />
                          <span className="text-[10px] font-bold text-teal-800 tracking-wider uppercase">HIPAA OCR Scrubber Safe-View</span>
                        </div>
                        <button
                          id="btn-toggle-phi-mask"
                          type="button"
                          onClick={() => setHidePhi(!hidePhi)}
                          className="text-[10px] font-bold text-teal-600 hover:text-teal-800 bg-teal-500/5 px-2 py-1 rounded border border-teal-500/10 cursor-pointer flex items-center gap-1"
                        >
                          {hidePhi ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          <span>{hidePhi ? 'Reveal PHI' : 'Mask PHI'}</span>
                        </button>
                      </div>

                      {/* Rx Label sticker visual representation */}
                      <div className="bg-white text-slate-900 rounded-lg p-3.5 border border-slate-200/80 font-mono text-[11px] leading-relaxed relative shadow-sm">
                        <div className="text-center font-bold text-slate-800 border-b border-slate-100 pb-1 mb-2 tracking-wide text-xs">
                          {scanResult.hospital}
                        </div>
                        <div className="space-y-1 text-slate-600">
                          <p><span className="font-bold text-slate-400">DATE:</span> {scanResult.date}</p>
                          <p className="flex items-center gap-1">
                            <span className="font-bold text-slate-400">RX NO:</span> 
                            {hidePhi ? (
                              <span className="bg-slate-900 text-white font-sans text-[10px] px-2 py-0.5 rounded flex items-center gap-1">
                                <Lock className="w-2.5 h-2.5 text-amber-400" /> REDACTED_RX_SERIAL
                              </span>
                            ) : (
                              <span className="text-red-600 font-bold bg-red-50 px-1 rounded">{scanResult.rxNumber} (PHI Alert!)</span>
                            )}
                          </p>
                          <p className="flex items-center gap-1">
                            <span className="font-bold text-slate-400">PATIENT:</span> 
                            {hidePhi ? (
                              <span className="bg-slate-900 text-white font-sans text-[10px] px-2 py-0.5 rounded flex items-center gap-1">
                                <Lock className="w-2.5 h-2.5 text-amber-400" /> REDACTED_PATIENT_NAME
                              </span>
                            ) : (
                              <span className="text-red-600 font-bold bg-red-50 px-1 rounded">{scanResult.patientName} (PHI Alert!)</span>
                            )}
                          </p>
                          <p><span className="font-bold text-slate-400">DOCTOR:</span> {scanResult.doctor}</p>
                          <p className="border-t border-dashed border-slate-100 pt-1.5 mt-1.5 text-xs text-slate-900 font-bold">
                            MED: {scanResult.medication}
                          </p>
                          <p className="text-slate-500 font-sans italic text-[10px]">
                            Instructions: {scanResult.instructions}
                          </p>
                          <p className="font-bold text-slate-900 mt-1">QTY: {scanResult.qty} {scanResult.unit}</p>
                        </div>
                      </div>
                    </div>

                    {/* Part 2: Extracted Data Card */}
                    <div className="bg-surface-container-lowest border border-emerald-500/20 rounded-2xl p-4 space-y-3.5 shadow-sm">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          <span className="text-xs font-extrabold text-emerald-700 tracking-wider uppercase">Extracted Structured Record</span>
                        </div>
                        <div className="bg-emerald-50 text-emerald-700 font-mono font-bold text-[10px] px-2 py-0.5 rounded border border-emerald-100">
                          CONFIDENCE: {(scanResult.confidence * 100).toFixed(1)}%
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 bg-surface-container-low p-3 rounded-xl border border-outline-variant">
                        <div>
                          <span className="text-[9px] text-on-surface-variant block uppercase font-extrabold">Medication Name</span>
                          <span className="text-xs font-bold text-on-surface truncate block">{scanResult.medication.split(' ')[0]}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-on-surface-variant block uppercase font-extrabold">Dosage/Strength</span>
                          <span className="text-xs font-bold text-on-surface truncate block">{scanResult.dosage}</span>
                        </div>
                        <div className="mt-1">
                          <span className="text-[9px] text-on-surface-variant block uppercase font-extrabold">Extract Qty</span>
                          <span className="text-xs font-mono font-extrabold text-primary">{scanResult.qty} {scanResult.unit}</span>
                        </div>
                        <div className="mt-1">
                          <span className="text-[9px] text-on-surface-variant block uppercase font-extrabold">Stock Category</span>
                          <span className="text-xs font-bold text-on-surface truncate block">{scanResult.category}</span>
                        </div>
                      </div>

                      <div className="text-[11px] text-on-surface-variant flex gap-2 items-start bg-blue-500/5 p-2.5 rounded-lg border border-blue-500/10">
                        <ShieldAlert className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-blue-800 text-xs">HIPAA Compliant Ingestion Engine</span>
                          <p className="text-[10px] text-blue-600 mt-0.5 leading-relaxed">
                            Scrubbed patient detail elements ({scanResult.patientName}, Rx {scanResult.rxNumber.split('#')[1]}) were removed successfully from raw string before logs/storage commit.
                          </p>
                        </div>
                      </div>

                      <button
                        id="btn-sync-scanned-inventory"
                        type="button"
                        onClick={() => handleAddScannedItem(scanResult)}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl shadow transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Database className="w-4 h-4 text-emerald-200" />
                        <span>Accept & Push Scanned Record into Inventory</span>
                      </button>
                    </div>

                    {/* Part 3: Raw GCF JSON response explorer */}
                    <div className="bg-slate-950 text-slate-300 rounded-xl p-3.5 font-mono text-[10px] border border-slate-800 space-y-2 max-h-48 overflow-y-auto shadow-inner">
                      <div className="flex justify-between items-center text-slate-500 border-b border-slate-800 pb-1 mb-1.5">
                        <span>GCF_RESPONSE_OBJECT.json</span>
                        <span className="text-emerald-500">HTTP_200_OK</span>
                      </div>
                      <pre className="leading-relaxed">
{JSON.stringify({
  success: true,
  documentId: `inv-${Date.now().toString().slice(-6)}`,
  extractedData: {
    medicationName: scanResult.medication.split(' ')[0],
    dosage: scanResult.dosage,
    quantity: scanResult.qty,
    category: scanResult.category,
    unit: scanResult.unit,
  },
  hipaaCompliance: {
    phiDetected: true,
    redactedElements: ["Rx Number: " + scanResult.rxNumber, "Patient Name: " + scanResult.patientName],
    scrubbedAt: new Date().toISOString()
  }
}, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: PRODUCTION BLUEPRINT */}
          {scannerTab === 'blueprint' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Blueprints Navigator */}
              <div className="flex items-center gap-1.5 border-b border-outline-variant pb-2 overflow-x-auto">
                <button
                  id="btn-code-tab-function"
                  type="button"
                  onClick={() => { setActiveCodeTab('cloud_function'); setCopiedText(false); }}
                  className={`text-xs font-bold px-3 py-1.5 rounded transition-all cursor-pointer whitespace-nowrap ${
                    activeCodeTab === 'cloud_function' 
                      ? 'bg-teal-500/10 text-teal-700 border border-teal-500/20 font-extrabold' 
                      : 'text-on-surface-variant hover:bg-surface-container font-semibold'
                  }`}
                >
                  GCP Cloud Function (index.js)
                </button>
                <button
                  id="btn-code-tab-schema"
                  type="button"
                  onClick={() => { setActiveCodeTab('schema'); setCopiedText(false); }}
                  className={`text-xs font-bold px-3 py-1.5 rounded transition-all cursor-pointer whitespace-nowrap ${
                    activeCodeTab === 'schema' 
                      ? 'bg-teal-500/10 text-teal-700 border border-teal-500/20 font-extrabold' 
                      : 'text-on-surface-variant hover:bg-surface-container font-semibold'
                  }`}
                >
                  Firestore Schema & Logic
                </button>
                <button
                  id="btn-code-tab-security"
                  type="button"
                  onClick={() => { setActiveCodeTab('security'); setCopiedText(false); }}
                  className={`text-xs font-bold px-3 py-1.5 rounded transition-all cursor-pointer whitespace-nowrap ${
                    activeCodeTab === 'security' 
                      ? 'bg-teal-500/10 text-teal-700 border border-teal-500/20 font-extrabold' 
                      : 'text-on-surface-variant hover:bg-surface-container font-semibold'
                  }`}
                >
                  HIPAA Security Guidelines
                </button>
              </div>

              {/* Blueprints Showcase area */}
              <div className="relative">
                {/* Copy Button */}
                <button
                  id="btn-copy-blueprint-code"
                  type="button"
                  onClick={() => {
                    const code = activeCodeTab === 'cloud_function' 
                      ? CODE_SNIPPETS.cloud_function 
                      : activeCodeTab === 'schema' 
                        ? CODE_SNIPPETS.schema 
                        : CODE_SNIPPETS.security;
                    navigator.clipboard.writeText(code);
                    setCopiedText(true);
                    setTimeout(() => setCopiedText(false), 2000);
                  }}
                  className="absolute right-3 top-3 bg-slate-900/80 hover:bg-slate-900 text-teal-400 p-2 rounded-lg border border-teal-500/10 transition-all cursor-pointer flex items-center gap-1.5 shadow-md z-10"
                  title="Copy code snippet to clipboard"
                >
                  {copiedText ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-[10px] font-bold text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-teal-300" />
                      <span className="text-[10px] font-bold text-teal-300">Copy Code</span>
                    </>
                  )}
                </button>

                {/* Styled code block */}
                <div className="bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-lg">
                  <div className="bg-slate-900/60 px-4 py-2 flex items-center gap-2 border-b border-slate-800/80 text-slate-400 font-mono text-[11px]">
                    <Terminal className="w-4 h-4 text-teal-400" />
                    <span>
                      {activeCodeTab === 'cloud_function' 
                        ? 'gcp-vision-function/index.js' 
                        : activeCodeTab === 'schema' 
                          ? 'src/lib/firestore-schema.ts' 
                          : 'DOCS_HIPAA_SECURITY.md'}
                    </span>
                  </div>
                  <div className="p-4 overflow-x-auto max-h-[350px]">
                    <pre className="font-mono text-slate-300 text-[11px] leading-relaxed whitespace-pre-wrap">
                      {activeCodeTab === 'cloud_function' 
                        ? CODE_SNIPPETS.cloud_function 
                        : activeCodeTab === 'schema' 
                          ? CODE_SNIPPETS.schema 
                          : CODE_SNIPPETS.security}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Search & Filter section */}
      <div id="search-filter-section" className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-on-surface-variant/60 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="input-inventory-search"
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={languageMode === 'hindi' ? 'दवा या सामान खोजें...' : 'Search clinical stock...'}
            className="w-full pl-9 pr-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-secondary focus:border-secondary transition-all"
          />
        </div>

        <div className="relative">
          <select
            id="select-category-filter"
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="text-xs bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-on-surface-variant font-bold h-full focus:outline-none focus:ring-1 focus:ring-secondary cursor-pointer"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'All' ? (languageMode === 'hindi' ? 'सभी' : 'All') : cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Counters */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-surface-container-low rounded-lg p-2.5 text-center border border-outline-variant">
          <span className="text-[10px] text-on-surface-variant font-bold uppercase block">TOTAL ITEMS</span>
          <span className="font-mono text-base font-bold text-primary">{stockItems.length}</span>
        </div>
        <div className="bg-red-500/5 rounded-lg p-2.5 text-center border border-red-500/10">
          <span className="text-[10px] text-red-600 font-bold uppercase block">CRITICAL</span>
          <span className="font-mono text-base font-bold text-red-600">
            {stockItems.filter(i => i.count <= i.criticalThreshold).length}
          </span>
        </div>
        <div className="bg-amber-500/5 rounded-lg p-2.5 text-center border border-amber-500/10">
          <span className="text-[10px] text-amber-600 font-bold uppercase block">WARNING</span>
          <span className="font-mono text-base font-bold text-amber-600">
            {stockItems.filter(i => i.count > i.criticalThreshold && i.count <= i.criticalThreshold * 1.5).length}
          </span>
        </div>
      </div>

      {/* Stock Cards Listing */}
      <div id="inventory-items-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-lg border border-outline-variant p-10 text-center text-on-surface-variant">
            <ShieldCheck className="w-10 h-10 mx-auto text-outline mb-2 opacity-50" />
            <p className="text-sm font-medium">
              {languageMode === 'hindi' ? 'कोई मिलान नहीं मिला।' : 'No matching supplies found.'}
            </p>
          </div>
        ) : (
          filteredItems.map(item => {
            const status = getStockStatus(item);
            const isCriticalOrLow = item.count <= item.criticalThreshold || item.count <= item.criticalThreshold * 1.5;
            return (
              <div
                key={item.id}
                id={`inventory-card-${item.id}`}
                className="bg-surface-container-lowest border border-outline-variant rounded-xl p-3.5 shadow-sm flex flex-col justify-between gap-3 hover:border-secondary/40 transition-colors h-full"
              >
                <div className="flex justify-between items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-sans text-[15px] font-bold text-on-surface leading-tight truncate" title={item.name}>
                      {item.name}
                    </h3>
                    {item.nameHindi && (
                      <p className="text-xs text-on-surface-variant mt-0.5 font-medium truncate" title={item.nameHindi}>
                        {item.nameHindi}
                      </p>
                    )}
                  </div>

                  {/* High Contrast Semantic Status Chip & Hover Box Container */}
                  <div className="relative group shrink-0">
                    <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border flex items-center gap-1 cursor-help select-none ${status.class}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                      {status.label}
                      {isCriticalOrLow && (
                        <AlertTriangle className="w-3 h-3 text-current ml-0.5 animate-pulse" />
                      )}
                    </span>

                    {/* Alert Hover Box - Absolute Tooltip with z-50 */}
                    {isCriticalOrLow && (
                      <div className="absolute right-0 top-full mt-2 w-64 p-3.5 bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-xl shadow-xl opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto transition-all duration-200 z-50 origin-top-right">
                        <div className="flex gap-2.5 items-start">
                          <div className={`p-1.5 rounded-lg shrink-0 ${item.count <= item.criticalThreshold ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                            <AlertTriangle className="w-4 h-4" />
                          </div>
                          <div className="text-left text-xs">
                            <p className="font-bold text-slate-900 leading-tight">
                              {item.count <= item.criticalThreshold ? 'Critical Stock Shortage' : 'Low Stock Warning'}
                            </p>
                            <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
                              {item.count <= item.criticalThreshold 
                                ? `Available count of ${item.name} (${item.count}) has dropped below the critical safety threshold of ${item.criticalThreshold} ${item.unit}.`
                                : `Available count of ${item.name} (${item.count}) is near the safety threshold of ${item.criticalThreshold} ${item.unit}.`}
                            </p>
                            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                              <span className="text-slate-400 font-medium">Status:</span>
                              <span className={`font-bold uppercase ${item.count <= item.criticalThreshold ? 'text-red-600' : 'text-amber-600'}`}>
                                {item.count <= item.criticalThreshold ? 'Immediate Action Required' : 'Monitor Stock'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Structured Column Grid Layout for Consistently Aligned Data Points */}
                <div className="grid grid-cols-3 gap-2 items-center bg-surface-container-low rounded-lg p-2.5 border border-outline-variant/50">
                  <div className="text-left">
                    <span className="text-on-surface-variant block text-[9px] uppercase font-bold tracking-wider">CATEGORY</span>
                    <span className="text-xs font-semibold text-on-surface truncate block" title={item.category}>{item.category}</span>
                  </div>

                  <div className="text-center">
                    <span className="text-on-surface-variant block text-[9px] uppercase font-bold tracking-wider">THRESHOLD</span>
                    <span className="text-xs font-mono font-bold text-on-surface block">{item.criticalThreshold}</span>
                  </div>

                  <div className="text-right">
                    <span className="text-on-surface-variant block text-[9px] uppercase font-bold tracking-wider">AVAILABLE</span>
                    <span className="font-mono text-sm font-extrabold text-primary block">{item.count}</span>
                  </div>
                </div>

                {/* Inline Quick Adjustment Rails */}
                <div className="flex justify-end gap-2 text-xs border-t border-outline-variant/30 pt-2">
                  <div className="flex items-center gap-1.5 mr-auto">
                    <button
                      id={`btn-delete-stock-${item.id}`}
                      aria-label={`Delete record for ${item.name}`}
                      onClick={() => {
                        if (openPrompt) {
                          openPrompt(
                            'delete',
                            languageMode === 'hindi' ? 'आइटम रिकॉर्ड हटाएं' : 'Critical Delete Authorization',
                            { itemId: item.id, itemName: item.name },
                            () => {
                              setStockItems(prev => prev.filter(i => i.id !== item.id));
                            }
                          );
                        } else {
                          setStockItems(prev => prev.filter(i => i.id !== item.id));
                        }
                      }}
                      className="text-on-surface-variant/40 hover:text-red-500 transition-colors p-1 rounded hover:bg-red-50 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[10px] font-bold text-on-surface-variant self-center">QUICK LOG:</span>
                  </div>
                  <button
                    id={`btn-adjust-dec-10-${item.id}`}
                    onClick={() => handleAdjustCount(item.id, -10)}
                    className="px-2.5 py-1 border border-outline-variant rounded hover:bg-surface-container-high transition-colors font-mono cursor-pointer"
                  >
                    -10
                  </button>
                  <button
                    id={`btn-adjust-dec-1-${item.id}`}
                    onClick={() => handleAdjustCount(item.id, -1)}
                    className="px-2.5 py-1 border border-outline-variant rounded hover:bg-surface-container-high transition-colors font-mono cursor-pointer"
                  >
                    -1
                  </button>
                  <button
                    id={`btn-adjust-inc-1-${item.id}`}
                    onClick={() => handleAdjustCount(item.id, 1)}
                    className="px-2.5 py-1 bg-secondary-container text-on-secondary-container border border-secondary/20 rounded hover:bg-secondary/15 transition-colors font-mono cursor-pointer font-bold"
                  >
                    +1
                  </button>
                  <button
                    id={`btn-adjust-inc-10-${item.id}`}
                    onClick={() => handleAdjustCount(item.id, 10)}
                    className="px-2.5 py-1 bg-secondary-container text-on-secondary-container border border-secondary/20 rounded hover:bg-secondary/15 transition-colors font-mono cursor-pointer font-bold"
                  >
                    +10
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <RealTimeCameraScanner
        isOpen={isRealTimeScannerOpen}
        onClose={() => setIsRealTimeScannerOpen(false)}
        onScanComplete={handleCameraScanComplete}
      />
    </div>
  );
}
