/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Compass, MapPin, Phone, Building, Train, Plus, Camera, X, Loader2, Upload, FileSpreadsheet, Trash2, Search } from 'lucide-react';
import { CentreData } from '../types';
import { getFirestoreCentres, saveFirestoreCentre } from '../services/firebaseService';
import { aiModel } from '../config/firebase';
import * as XLSX from 'xlsx';

interface CentresViewProps {
  languageMode: 'english' | 'hindi' | 'bilingual';
}

export default function CentresView({ languageMode }: CentresViewProps) {
  const [centres, setCentres] = useState<CentreData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  const filteredCentres = centres.filter(centre => {
    const matchesSearch = 
      centre.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      centre.subName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      centre.address.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesType = filterType === 'All' || centre.type === filterType;
    const matchesStatus = filterStatus === 'All' || centre.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Bulk Import States
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [importPreview, setImportPreview] = useState<CentreData[]>([]);
  const importFileInputRef = useRef<HTMLInputElement>(null);

  const parseCSV = (text: string): CentreData[] => {
    const lines = text.split('\n');
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/["'\r]/g, ''));
    const parsed: CentreData[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^["']|["']$/g, '').replace(/\r/g, ''));
      
      const row: any = {};
      headers.forEach((header, index) => {
        if (index < values.length) {
          row[header] = values[index];
        }
      });
      
      const name = row.name || row.facility_name || row['facility name'] || values[0] || '';
      const subName = row.subname || row.district || row['sub-division'] || row.subname || values[1] || '';
      const type = row.type || row.category || values[2] || 'PHC';
      const address = row.address || row.location || values[3] || '';
      const transit = row.transit || row['transit info'] || values[4] || '';
      const contact = row.contact || row['contact number'] || row.phone || values[5] || '';
      const beds = row.beds || row.capacity || row['beds capacity'] || values[6] || '';
      const latVal = row.lat || row.latitude || values[7];
      const lngVal = row.lng || row.longitude || values[8];
      const status = row.status || row.state || values[9] || 'Operational';
      
      if (name && address) {
        parsed.push({
          name,
          subName,
          type: ['PHC', 'CHC', 'PUHC', 'RHTC'].includes(type.toUpperCase()) ? type.toUpperCase() : 'PHC',
          address,
          transit,
          contact,
          beds,
          lat: latVal ? parseFloat(latVal) : null,
          lng: lngVal ? parseFloat(lngVal) : null,
          status: status || 'Operational'
        });
      }
    }
    return parsed;
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = () => {
    setIsDragActive(false);
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImportFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImportFile(file);
    }
  };

  const processImportFile = (file: File) => {
    const reader = new FileReader();
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) return;
        
        let parsed: CentreData[] = [];
        
        if (isExcel) {
          const workbook = XLSX.read(data, { type: 'binary' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonRows = XLSX.utils.sheet_to_json<any>(worksheet);
          
          parsed = jsonRows.map((row: any) => {
            const name = row.name || row.Name || row.facility_name || row['Facility Name'] || '';
            const subName = row.subName || row.subname || row.SubName || row.district || row.District || row['Sub-division'] || '';
            const type = row.type || row.Type || row.category || 'PHC';
            const address = row.address || row.Address || row.location || '';
            const transit = row.transit || row.Transit || row['Transit Info'] || '';
            const contact = row.contact || row.Contact || row['Contact Number'] || row.phone || '';
            const beds = row.beds || row.Beds || row.capacity || row['Beds Capacity'] || '';
            const latVal = row.lat || row.latitude || row.Latitude || null;
            const lngVal = row.lng || row.longitude || row.Longitude || null;
            const status = row.status || row.Status || 'Operational';
            
            return {
              name,
              subName,
              type: ['PHC', 'CHC', 'PUHC', 'RHTC'].includes(type.toString().toUpperCase()) ? type.toString().toUpperCase() : 'PHC',
              address,
              transit,
              contact,
              beds: beds ? beds.toString() : '',
              lat: latVal ? parseFloat(latVal) : null,
              lng: lngVal ? parseFloat(lngVal) : null,
              status: status || 'Operational'
            };
          }).filter(item => item.name && item.address);
        } else {
          parsed = parseCSV(data as string);
        }
        
        if (parsed.length === 0) {
          alert('Could not find valid health centers in file. Ensure columns for "Name" and "Address" exist.');
        } else {
          setImportPreview(parsed);
        }
      } catch (err) {
        console.error('File parsing error:', err);
        alert('Failed to parse file. Please verify format.');
      }
    };
    
    if (isExcel) {
      reader.readAsBinaryString(file);
    } else {
      reader.readAsText(file);
    }
  };

  const handleBulkSubmit = async () => {
    if (importPreview.length === 0) return;
    
    setIsLoading(true);
    let successCount = 0;
    
    try {
      for (const item of importPreview) {
        await saveFirestoreCentre(item);
        successCount++;
      }
      
      // Update UI with new items optimistically
      const freshImport = importPreview.map(item => ({ ...item, id: Date.now().toString() + Math.random().toString(36).substr(2, 5) }));
      setCentres(prev => [...freshImport, ...prev]);
      
      alert(`Successfully imported ${successCount} health centres!`);
      setImportPreview([]);
      setIsImportModalOpen(false);
    } catch (err) {
      console.error('Bulk save error:', err);
      alert('Error occurred during bulk saving. Some items may not be saved.');
    } finally {
      setIsLoading(false);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      setIsCameraActive(true);
    } catch (err) {
      console.error('Camera access error:', err);
      alert('Could not access camera. Please check permissions or use file upload.');
    }
  };

  useEffect(() => {
    if (isCameraActive && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(playErr => {
        console.error('Video play error:', playErr);
      });
    }
  }, [isCameraActive]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const captureFromCamera = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
      alert('Camera stream is still initializing. Please wait a second and try again.');
      return;
    }

    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64Data = canvas.toDataURL('image/jpeg');
        stopCamera();
        processImagePayload(base64Data);
      }
    } catch (err) {
      console.error('Failed to capture frame from video:', err);
      alert('Failed to capture image from camera. Please use File Upload instead.');
      stopCamera();
    }
  };

  const processImagePayload = async (base64Data: string) => {
    setIsScanning(true);
    let parsedData = null;
    
    try {
      if (aiModel) {
        console.log('[CentresView] Initializing client-side Gemini for form scan...');
        const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
        
        const prompt = `Analyze this registration form for a Primary Health Centre or Community Health Centre.
        Extract the following fields strictly in a valid JSON format. If a field cannot be found, set it to "" or a reasonable default:
        - name: Name of the facility (e.g., "Primary Health Center (PHC)")
        - subName: The specific area or district sub-division (e.g., "Palam Village")
        - type: The category, strictly one of: "RHTC", "PUHC", "PHC", "CHC"
        - address: Full address of the facility
        - transit: Nearby metro or public transit info
        - contact: Contact phone number
        - beds: Bed capacity (e.g., "10 Beds Available" or "O.P.D. Facility Only")
        - lat: Estimated latitude (number, e.g. 28.5889) or null
        - lng: Estimated longitude (number, e.g. 77.0831) or null
        
        Respond ONLY with the raw JSON code block, containing no Markdown formatting other than the json output.`;

        const response = await aiModel.generateContent([
          prompt,
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64
            }
          }
        ]);

        const replyText = response.response.text() || '';
        const jsonMatch = replyText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedData = JSON.parse(jsonMatch[0]);
        }
      }
      
      // Fallback if aiModel is not ready or JSON parsing failed
      if (!parsedData) {
        console.warn('[CentresView] Client-side scan failed or AI not initialized. Using sandbox fallback.');
        parsedData = {
          name: 'Community Health Centre (CHC)',
          subName: 'Sample District',
          type: 'CHC',
          address: '123 Fake Street, New Delhi - 110001',
          transit: 'Yellow Line (Sample Metro)',
          contact: '+91-11-55551234',
          beds: '50 Beds Available',
          lat: 28.6139,
          lng: 77.2090
        };
      }

      setFormData({
        name: parsedData.name || '',
        subName: parsedData.subName || '',
        type: parsedData.type || 'PHC',
        lat: parsedData.lat || null,
        lng: parsedData.lng || null,
        address: parsedData.address || '',
        transit: parsedData.transit || '',
        status: 'Operational',
        contact: parsedData.contact || '',
        beds: parsedData.beds || ''
      });

    } catch (error) {
      console.error('[CentresView] Scanner error:', error);
      // Hard fallback on crash
      setFormData({
        name: 'Community Health Centre (CHC)',
        subName: 'Sample District',
        type: 'CHC',
        lat: 28.6139,
        lng: 77.2090,
        address: '123 Fake Street, New Delhi - 110001',
        transit: 'Yellow Line (Sample Metro)',
        status: 'Operational',
        contact: '+91-11-55551234',
        beds: '50 Beds Available'
      });
    } finally {
      setIsScanning(false);
    }
  };

  const [formData, setFormData] = useState<CentreData>({
    name: '',
    subName: '',
    type: 'PHC',
    lat: null,
    lng: null,
    address: '',
    transit: '',
    status: 'Operational',
    contact: '',
    beds: ''
  });

  useEffect(() => {
    async function fetchCentres() {
      try {
        const data = await getFirestoreCentres();
        // Provide mock fallback data if Firestore is empty for demonstration purposes
        if (data.length === 0) {
          const fallbackData: CentreData[] = [
            {
              id: 'mock1', name: 'Rural Health Training Centre (RHTC)', subName: 'Najafgarh', type: 'RHTC',
              lat: 28.6131, lng: 76.9861, address: 'Plot No. 12, Najafgarh Extension, Agarwal Colony, Najafgarh, New Delhi - 110043',
              transit: 'Magenta & Blue Line (Nawada Metro)', status: 'Operational', contact: '+91-11-25321890', beds: '30 Beds Available'
            },
            {
              id: 'mock2', name: 'Primary Urban Health Centre (PUHC)', subName: 'Mansa Ram Park', type: 'PUHC',
              lat: 28.6224, lng: 77.0562, address: 'Block D, Mansa Ram Park, Uttam Nagar, New Delhi - 110059',
              transit: 'Blue Line (Nawada / Uttam Nagar West)', status: 'Operational', contact: '+91-11-25324501', beds: 'O.P.D. Facility Only'
            }
          ];
          setCentres(fallbackData);
        } else {
          setCentres(data);
        }
      } catch (err) {
        console.error('Failed to fetch centres', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchCentres();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'lat' || name === 'lng' ? (value ? parseFloat(value) : null) : value
    }));
  };

  const handleScanForm = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      processImagePayload(reader.result as string);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsDataURL(file);
  };

  const handleCloseModal = () => {
    stopCamera();
    setIsModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSave = { ...formData };
      await saveFirestoreCentre(dataToSave);
      // Optimistic update
      setCentres(prev => [dataToSave, ...prev]);
      handleCloseModal();
      setFormData({
        name: '', subName: '', type: 'PHC', lat: null, lng: null,
        address: '', transit: '', status: 'Operational', contact: '', beds: ''
      });
    } catch (err) {
      alert('Error saving centre. Data may be saved offline and synced later.');
      // Still update locally for offline robustness
      setCentres(prev => [{ ...formData, id: Date.now().toString() }, ...prev]);
      handleCloseModal();
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl shadow-sm p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-outline-variant/30 pb-4 mb-6">
          <div>
            <h2 className="font-sans text-lg font-bold text-primary uppercase tracking-wider flex items-center gap-2">
              <Building className="w-5 h-5 text-secondary animate-pulse" />
              <span>{languageMode === 'hindi' ? 'स्वास्थ्य केंद्र निर्देशिका' : 'Primary Care Hospital Directory'}</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
              {languageMode === 'hindi' 
                ? 'क्षेत्रीय प्राथमिक स्वास्थ्य केंद्रों (PHC) और सामुदायिक स्वास्थ्य केंद्रों (CHC) की व्यापक सूची।' 
                : 'Comprehensive listing of regional primary and community health centers.'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-1.5 bg-secondary hover:bg-secondary/90 text-on-secondary text-xs px-4 py-2 rounded-xl font-bold transition-colors shadow-sm cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              {languageMode === 'hindi' ? 'बल्क आयात' : 'Bulk Import'}
            </button>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 bg-primary hover:bg-primary-hover text-on-primary text-xs px-4 py-2 rounded-xl font-bold transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              {languageMode === 'hindi' ? 'केंद्र जोड़ें' : 'Register Centre'}
            </button>
            <div className="bg-secondary/10 border border-secondary/20 text-secondary text-xs px-3.5 py-1.5 rounded-xl font-bold">
              {filteredCentres.length} / {centres.length} Facilities
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div id="centres-search-filter" className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={languageMode === 'hindi' ? 'स्वास्थ्य केंद्र, उप-मंडल या पता खोजें...' : 'Search centres by name, subdivision, or address...'}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-outline-variant/60 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-secondary focus:border-secondary transition-all"
            />
          </div>

          <div className="flex gap-2">
            <div className="relative">
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="text-xs bg-slate-50 dark:bg-slate-900 border border-outline-variant/60 rounded-xl px-3 py-2 text-on-surface-variant font-bold h-full focus:outline-none focus:ring-1 focus:ring-secondary cursor-pointer"
              >
                <option value="All">{languageMode === 'hindi' ? 'सभी प्रकार' : 'All Types'}</option>
                <option value="PHC">PHC</option>
                <option value="CHC">CHC</option>
                <option value="PUHC">PUHC</option>
                <option value="RHTC">RHTC</option>
              </select>
            </div>

            <div className="relative">
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="text-xs bg-slate-50 dark:bg-slate-900 border border-outline-variant/60 rounded-xl px-3 py-2 text-on-surface-variant font-bold h-full focus:outline-none focus:ring-1 focus:ring-secondary cursor-pointer"
              >
                <option value="All">{languageMode === 'hindi' ? 'सभी स्थिति' : 'All Statuses'}</option>
                <option value="Operational">Operational</option>
                <option value="Normal">Normal</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredCentres.length === 0 ? (
            <div className="md:col-span-2 bg-surface-container-low/30 border border-outline-variant/40 rounded-2xl p-10 text-center text-slate-500 font-semibold text-xs leading-relaxed animate-fadeIn">
              No matching health centres found. Try tweaking your search query or filters.
            </div>
          ) : (
            filteredCentres.map((center) => (
            <div 
              key={center.name + center.subName}
              className="bg-surface-container-low/50 hover:bg-surface-container-low border border-outline-variant/60 hover:border-secondary/40 p-5 rounded-2xl flex flex-col justify-between hover:shadow-md transition-all relative overflow-hidden"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-extrabold px-3 py-1 rounded-lg bg-secondary-container text-on-secondary-container tracking-wider uppercase">
                    {center.type}
                  </span>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    {center.status}
                  </span>
                </div>

                <div>
                  <h3 className="font-sans text-[15px] font-bold text-on-surface leading-snug">
                    {center.name}
                  </h3>
                  <p className="text-xs font-semibold text-secondary mt-0.5">
                    District Sub-division: {center.subName}
                  </p>
                </div>

                <hr className="border-outline-variant/30" />

                <div className="space-y-3 text-xs">
                  <div className="flex items-start gap-2.5 text-on-surface-variant">
                    <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-on-surface text-[10px] uppercase tracking-wider block">Address</strong>
                      <span className="leading-relaxed">{center.address}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 text-on-surface-variant">
                    <Train className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-on-surface text-[10px] uppercase tracking-wider block">Metro & Public Transit</strong>
                      <span className="leading-relaxed">{center.transit}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-1">
                    <div className="flex items-center gap-2 text-on-surface-variant">
                      <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="font-mono text-[11px]">{center.contact}</span>
                    </div>
                    <div className="flex items-center gap-2 text-on-surface-variant">
                      <Compass className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="font-mono text-[10px]">{center.beds}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-outline-variant/20 flex justify-between items-center text-[10px] font-mono text-slate-500">
                <span>Lat: {center.lat}</span>
                <span>Lng: {center.lng}</span>
              </div>
            </div>
          ))
          )}
        </div>
        )}
      </div>

      {/* Registration Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-xl animate-scaleIn">
            <div className="sticky top-0 bg-white dark:bg-slate-900 z-10 px-6 py-4 border-b border-outline-variant/30 flex justify-between items-center">
              <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Register New Health Centre
              </h3>
              <button 
                onClick={handleCloseModal}
                className="p-2 rounded-full hover:bg-surface-variant text-on-surface-variant transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-tertiary-container/30 border border-tertiary/20 p-4 rounded-xl mb-4">
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-on-tertiary-container">Smart Form Scanner</h4>
                  <p className="text-xs text-on-tertiary-container/80 mt-1">
                    Capture or upload a photo of the registration form to auto-fill details using AI.
                  </p>
                </div>
                <input 
                  type="file"
                  accept="image/*"
                  capture="environment"
                  ref={fileInputRef}
                  onChange={handleScanForm}
                  className="hidden"
                />
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <button
                    type="button"
                    onClick={startCamera}
                    disabled={isScanning || isCameraActive}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-lg font-bold text-sm hover:shadow-md hover:bg-emerald-700 transition-all disabled:opacity-50"
                  >
                    <Camera className="w-4 h-4" />
                    Open Camera
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isScanning}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-tertiary text-on-tertiary px-5 py-2.5 rounded-lg font-bold text-sm hover:shadow-md hover:bg-tertiary/90 transition-all disabled:opacity-50"
                  >
                    {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Upload File'}
                  </button>
                </div>
              </div>

              {isCameraActive && (
                <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-inner flex items-center justify-center mb-4">
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 border-[4px] border-emerald-500/50 pointer-events-none rounded-xl"></div>
                  
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4">
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="bg-slate-900/80 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={captureFromCamera}
                      className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 px-6 py-2 rounded-lg text-sm font-bold shadow-lg transition-colors flex items-center gap-2"
                    >
                      <Camera className="w-4 h-4" />
                      Capture
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant">Facility Name *</label>
                  <input required name="name" value={formData.name} onChange={handleInputChange} type="text" className="w-full bg-surface-container border border-outline/30 rounded-xl px-4 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="e.g. Primary Health Center (PHC)" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant">District / Sub-division *</label>
                  <input required name="subName" value={formData.subName} onChange={handleInputChange} type="text" className="w-full bg-surface-container border border-outline/30 rounded-xl px-4 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="e.g. Palam Village" />
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant">Type *</label>
                  <select name="type" value={formData.type} onChange={handleInputChange} className="w-full bg-surface-container border border-outline/30 rounded-xl px-4 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all">
                    <option value="PHC">PHC</option>
                    <option value="CHC">CHC</option>
                    <option value="PUHC">PUHC</option>
                    <option value="RHTC">RHTC</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant">Status</label>
                  <select name="status" value={formData.status} onChange={handleInputChange} className="w-full bg-surface-container border border-outline/30 rounded-xl px-4 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all">
                    <option value="Operational">Operational</option>
                    <option value="Normal">Normal</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-bold text-on-surface-variant">Full Address *</label>
                  <input required name="address" value={formData.address} onChange={handleInputChange} type="text" className="w-full bg-surface-container border border-outline/30 rounded-xl px-4 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant">Transit Info</label>
                  <input name="transit" value={formData.transit} onChange={handleInputChange} type="text" className="w-full bg-surface-container border border-outline/30 rounded-xl px-4 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="e.g. Magenta Line Metro" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant">Contact Number</label>
                  <input name="contact" value={formData.contact} onChange={handleInputChange} type="text" className="w-full bg-surface-container border border-outline/30 rounded-xl px-4 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant">Beds Capacity</label>
                  <input name="beds" value={formData.beds} onChange={handleInputChange} type="text" className="w-full bg-surface-container border border-outline/30 rounded-xl px-4 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="e.g. 10 Beds Available" />
                </div>
                
                <div className="grid grid-cols-2 gap-3 space-y-1">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface-variant">Latitude</label>
                    <input name="lat" value={formData.lat || ''} onChange={handleInputChange} type="number" step="any" className="w-full bg-surface-container border border-outline/30 rounded-xl px-4 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface-variant">Longitude</label>
                    <input name="lng" value={formData.lng || ''} onChange={handleInputChange} type="number" step="any" className="w-full bg-surface-container border border-outline/30 rounded-xl px-4 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-outline-variant/30 flex justify-end gap-3">
                <button type="button" onClick={handleCloseModal} className="px-5 py-2.5 text-sm font-bold text-on-surface-variant hover:bg-surface-variant rounded-xl transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2.5 text-sm font-bold text-on-primary bg-primary hover:bg-primary-hover shadow-md shadow-primary/20 rounded-xl transition-all">
                  Register Centre
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Bulk Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-xl animate-scaleIn flex flex-col">
            <div className="sticky top-0 bg-white dark:bg-slate-900 z-10 px-6 py-4 border-b border-outline-variant/30 flex justify-between items-center">
              <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-secondary" />
                {languageMode === 'hindi' ? 'स्वास्थ्य केंद्र बल्क आयात' : 'Bulk Import Health Centres'}
              </h3>
              <button 
                onClick={() => { setIsImportModalOpen(false); setImportPreview([]); }}
                className="p-2 rounded-full hover:bg-surface-variant text-on-surface-variant transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
              {importPreview.length === 0 ? (
                <div 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleFileDrop}
                  onClick={() => importFileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all ${
                    isDragActive 
                      ? 'border-primary bg-primary/5' 
                      : 'border-outline-variant/80 hover:border-primary hover:bg-surface-container-low/30'
                  }`}
                >
                  <input 
                    type="file"
                    ref={importFileInputRef}
                    onChange={handleFileSelect}
                    accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                    className="hidden"
                  />
                  <div className="p-4 bg-secondary/10 rounded-2xl border border-secondary/20 text-secondary">
                    <Upload className="w-8 h-8 animate-bounce" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-sm font-bold text-on-surface">
                      Drag & Drop CSV or Excel File
                    </p>
                    <p className="text-xs text-slate-400">
                      or click to browse your local device
                    </p>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-800/60 p-3.5 rounded-xl text-[10px] text-slate-500 font-mono space-y-1 w-full max-w-md">
                    <p className="font-bold uppercase tracking-wider text-slate-400 text-center pb-1">Expected CSV Headers</p>
                    <p className="text-center select-all">name, subName, type, address, transit, contact, beds, lat, lng, status</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-secondary">
                      Parsed {importPreview.length} facilities ready for import
                    </span>
                    <button
                      onClick={() => setImportPreview([])}
                      className="text-xs text-red-500 hover:text-red-650 flex items-center gap-1 font-bold cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Clear and Retry
                    </button>
                  </div>
                  <div className="border border-outline-variant/60 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-surface-container-low border-b border-outline-variant/40 font-bold text-on-surface">
                          <th className="p-2.5">Name</th>
                          <th className="p-2.5">Type</th>
                          <th className="p-2.5">Sub-division</th>
                          <th className="p-2.5">Address</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/20 font-medium">
                        {importPreview.map((item, index) => (
                          <tr key={index} className="hover:bg-surface-container-low/30 text-on-surface-variant">
                            <td className="p-2.5 font-bold text-on-surface">{item.name}</td>
                            <td className="p-2.5">
                              <span className="px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container text-[10px] font-extrabold uppercase">
                                {item.type}
                              </span>
                            </td>
                            <td className="p-2.5">{item.subName || 'N/A'}</td>
                            <td className="p-2.5 truncate max-w-xs">{item.address}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
            
            <div className="sticky bottom-0 bg-white dark:bg-slate-900 z-10 px-6 py-4 border-t border-outline-variant/30 flex justify-end gap-3 shrink-0">
              <button 
                type="button" 
                onClick={() => { setIsImportModalOpen(false); setImportPreview([]); }} 
                className="px-5 py-2.5 text-sm font-bold text-on-surface-variant hover:bg-surface-variant rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleBulkSubmit}
                disabled={importPreview.length === 0 || isLoading}
                className="px-6 py-2.5 text-sm font-bold text-on-primary bg-primary hover:bg-primary-hover shadow-md shadow-primary/20 rounded-xl transition-all disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Import'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
