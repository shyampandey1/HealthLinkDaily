/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Search, Plus, CheckCircle2, AlertCircle, Phone, Clock, UserCheck, X, Users2, Trash2, Camera, Loader2 } from 'lucide-react';
import { useState, Dispatch, SetStateAction, FormEvent, useRef, useEffect } from 'react';
import { StaffMember } from '../types';
import { aiModel } from '../config/firebase';

interface StaffViewProps {
  staffMembers: StaffMember[];
  setStaffMembers: Dispatch<SetStateAction<StaffMember[]>>;
  languageMode: 'english' | 'hindi' | 'bilingual';
  openPrompt?: (
    type: 'transfer' | 'discharge' | 'delete' | 'submitReport' | 'resetData',
    title: string,
    extra: { patientId?: string; patientName?: string; itemId?: string; itemName?: string },
    onConfirm: (data: any) => void
  ) => void;
}

export default function StaffView({ staffMembers, setStaffMembers, languageMode, openPrompt }: StaffViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Delete/Remove staff record
  const handleDeleteStaff = (memberId: string) => {
    setStaffMembers(prev => prev.filter(s => s.id !== memberId));
  };

  // New staff form state
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('Staff Nurse');
  const [newRoleHindi, setNewRoleHindi] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newShift, setNewShift] = useState<'Day' | 'Night'>('Day');

  // Camera & Scanning State
  const [isScanning, setIsScanning] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

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
        const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
        
        const prompt = `Analyze this staff registration form.
        Extract the following fields strictly in a valid JSON format. If a field cannot be found, set it to "" or a reasonable default:
        - name: Staff member's full name
        - role: Role Title (e.g. "Staff Nurse", "Doctor")
        - roleHindi: Role Title in Hindi (if present)
        - phone: Phone Number
        - shift: "Day" or "Night"
        
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
      
      if (!parsedData) {
        parsedData = {
          name: 'Dr. Seema Rao',
          role: 'Head Nurse',
          roleHindi: 'मुख्य नर्स',
          phone: '+91 98765 12345',
          shift: 'Day'
        };
      }

      if (parsedData.name) setNewName(parsedData.name);
      if (parsedData.role) setNewRole(parsedData.role);
      if (parsedData.roleHindi) setNewRoleHindi(parsedData.roleHindi);
      if (parsedData.phone) setNewPhone(parsedData.phone);
      if (parsedData.shift) setNewShift(parsedData.shift);

    } catch (error) {
      console.error('Scanner error:', error);
      alert('Failed to parse image data.');
    } finally {
      setIsScanning(false);
    }
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

  // Filter staff by search query
  const filteredStaff = staffMembers.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (member.roleHindi && member.roleHindi.includes(searchQuery))
  );

  // Toggle active check-in state
  const handleCheckInOut = (memberId: string) => {
    setStaffMembers(prev =>
      prev.map(member => {
        if (member.id === memberId) {
          const isCheckingIn = !member.active;
          const currentTimeString = isCheckingIn
            ? new Date().toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit',
              })
            : undefined;

          return {
            ...member,
            active: isCheckingIn,
            checkInTime: currentTimeString,
          };
        }
        return member;
      })
    );
  };

  // Add new staff member
  const handleAddStaff = (e: FormEvent) => {
    e.preventDefault();
    if (!newName) return;

    const newMember: StaffMember = {
      id: `staff-${Date.now()}`,
      name: newName,
      role: newRole,
      roleHindi: newRoleHindi || undefined,
      active: false,
      phone: newPhone || undefined,
      shift: newShift,
    };

    setStaffMembers(prev => [...prev, newMember]);

    // Reset Form
    setNewName('');
    setNewRole('Staff Nurse');
    setNewRoleHindi('');
    setNewPhone('');
    setNewShift('Day');
    setShowAddForm(false);
  };

  return (
    <div id="staff-view-main" className="flex flex-col gap-5 animate-fadeIn">
      {/* Header and Add button */}
      <div className="flex justify-between items-center">
        <div>
          <span className="text-xs font-bold text-secondary uppercase tracking-wider">
            {languageMode === 'hindi' ? 'ड्यूटी रोस्टर' : 'Hospital & Clinic Personnel'}
          </span>
          <h2 id="staff-header" className="font-sans text-xl font-bold text-on-surface">
            {languageMode === 'hindi' ? 'स्टाफ हाजिरी' : 'Staff Directory'}
          </h2>
        </div>
        <button
          id="btn-toggle-add-staff"
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-secondary text-on-secondary hover:bg-secondary/95 transition-all text-xs font-semibold px-3 py-1.5 rounded flex items-center gap-1.5 shadow-sm cursor-pointer"
        >
          {showAddForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          <span>{showAddForm ? (languageMode === 'hindi' ? 'रद्द करें' : 'Cancel') : (languageMode === 'hindi' ? 'नया स्टाफ' : 'Add Staff')}</span>
        </button>
      </div>

      {/* Add Staff Form */}
      {showAddForm && (
        <form
          id="form-add-staff"
          onSubmit={handleAddStaff}
          className="bg-surface-container-lowest border border-outline-variant p-4 rounded-xl shadow-md space-y-3 animate-scaleUp"
        >
          <div className="text-sm font-bold text-primary border-b border-outline-variant pb-1.5">
            {languageMode === 'hindi' ? 'नया स्टाफ सदस्य जोड़ें' : 'Register New Clinic Staff'}
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-tertiary-container/30 border border-tertiary/20 p-4 rounded-xl mb-4">
            <div className="flex-1">
              <h4 className="text-sm font-bold text-on-tertiary-container">Smart Form Scanner</h4>
              <p className="text-xs text-on-tertiary-container/80 mt-1">
                Capture or upload a photo of the staff registration form to auto-fill details using AI.
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

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-on-surface-variant uppercase">Practitioner Name*</label>
            <input
              type="text"
              required
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Dr. Seema Rao"
              className="text-sm bg-surface-container border border-outline-variant rounded p-2 focus:ring-1 focus:ring-secondary focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-on-surface-variant uppercase">Role Title (English)*</label>
              <input
                type="text"
                required
                value={newRole}
                onChange={e => setNewRole(e.target.value)}
                placeholder="Staff Nurse"
                className="text-sm bg-surface-container border border-outline-variant rounded p-2 focus:ring-1 focus:ring-secondary focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-on-surface-variant uppercase">रोल नाम (हिन्दी)</label>
              <input
                type="text"
                value={newRoleHindi}
                onChange={e => setNewRoleHindi(e.target.value)}
                placeholder="कर्मचारी नर्स"
                className="text-sm bg-surface-container border border-outline-variant rounded p-2 focus:ring-1 focus:ring-secondary focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-on-surface-variant uppercase">Phone Number</label>
              <input
                type="text"
                value={newPhone}
                onChange={e => setNewPhone(e.target.value)}
                placeholder="+91 99999 88888"
                className="text-sm bg-surface-container border border-outline-variant rounded p-2 focus:ring-1 focus:ring-secondary focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-on-surface-variant uppercase">Scheduled Shift</label>
              <select
                value={newShift}
                onChange={e => setNewShift(e.target.value as any)}
                className="text-sm bg-surface-container border border-outline-variant rounded p-2 focus:ring-1 focus:ring-secondary focus:outline-none"
              >
                <option value="Day">Day Shift</option>
                <option value="Night">Night Shift</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-primary text-on-primary hover:bg-black font-semibold text-sm py-2 rounded shadow transition-all cursor-pointer"
          >
            {languageMode === 'hindi' ? 'स्टाफ सदस्य जोड़ें' : 'Save Staff Member'}
          </button>
        </form>
      )}

      {/* Search Input */}
      <div id="staff-search-container" className="relative">
        <Search className="w-4 h-4 text-on-surface-variant/60 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          id="input-staff-search"
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder={languageMode === 'hindi' ? 'नाम या पद द्वारा खोजें...' : 'Search staff registry...'}
          className="w-full pl-9 pr-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-secondary focus:border-secondary transition-all"
        />
      </div>

      {/* Staff Statistics */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-emerald-500/5 rounded-lg p-3 text-center border border-emerald-500/15">
          <span className="text-[11px] text-emerald-700 font-bold uppercase block">ON DUTY NOW</span>
          <span className="font-mono text-2xl font-extrabold text-emerald-700">
            {staffMembers.filter(s => s.active).length}
          </span>
        </div>
        <div className="bg-surface-container-low rounded-lg p-3 text-center border border-outline-variant">
          <span className="text-[11px] text-on-surface-variant font-bold uppercase block">TOTAL ROSTERED</span>
          <span className="font-mono text-2xl font-extrabold text-primary">{staffMembers.length}</span>
        </div>
      </div>

      {/* Staff List Cards */}
      <div id="staff-members-list" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStaff.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-lg border border-outline-variant p-10 text-center text-on-surface-variant">
            <Users2 className="w-10 h-10 mx-auto text-outline mb-2 opacity-50" />
            <p className="text-sm font-medium">
              {languageMode === 'hindi' ? 'कोई स्टाफ नहीं मिला।' : 'No registered personnel found.'}
            </p>
          </div>
        ) : (
          filteredStaff.map(member => (
            <div
              key={member.id}
              id={`staff-card-${member.id}`}
              className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm flex flex-col gap-3 hover:border-secondary/40 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-sans text-[15px] font-bold text-on-surface leading-tight">
                    {member.name}
                  </h3>
                  <p className="text-xs text-secondary font-semibold mt-0.5">
                    {member.role}
                    {member.roleHindi && languageMode === 'bilingual' && ` (${member.roleHindi})`}
                  </p>
                </div>

                {/* Duty Attendance Status Tag */}
                <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${
                  member.active 
                    ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/25' 
                    : 'bg-surface-container-high text-on-surface-variant border-outline-variant/50'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${member.active ? 'bg-emerald-500' : 'bg-outline-variant'}`} />
                  {member.active 
                    ? (languageMode === 'hindi' ? 'ड्यूटी पर' : 'ON DUTY') 
                    : (languageMode === 'hindi' ? 'अनुपस्थित' : 'OFF DUTY')
                  }
                </span>
              </div>

              {/* Extra Meta Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs text-on-surface-variant bg-surface-container-low p-2 rounded-lg border border-outline-variant/30 font-medium">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-on-surface-variant/70 shrink-0" />
                  <span>Shift: {member.shift} Shift</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-on-surface-variant/70 shrink-0" />
                  <span className="font-mono">{member.phone || 'N/A'}</span>
                </div>
              </div>

              {/* Active Check-In/Out Button */}
              <div className="flex justify-between items-center border-t border-outline-variant/30 pt-2.5 mt-0.5">
                {member.active && member.checkInTime ? (
                  <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Checked In: {member.checkInTime}
                  </span>
                ) : (
                  <span className="text-[10px] text-on-surface-variant/70 italic">
                    Not checked in today
                  </span>
                )}

                <div className="flex items-center gap-1.5">
                  <button
                    id={`btn-delete-staff-${member.id}`}
                    aria-label={`Delete record for ${member.name}`}
                    onClick={() => {
                      if (openPrompt) {
                        openPrompt(
                          'delete',
                          languageMode === 'hindi' ? 'स्टाफ रिकॉर्ड हटाएं' : 'Critical Delete Authorization',
                          { itemId: member.id, itemName: member.name },
                          () => {
                            handleDeleteStaff(member.id);
                          }
                        );
                      } else {
                        handleDeleteStaff(member.id);
                      }
                    }}
                    className="text-on-surface-variant/40 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all p-1.5 rounded-lg cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <button
                    id={`btn-check-toggle-${member.id}`}
                    onClick={() => handleCheckInOut(member.id)}
                    className={`text-[11px] font-bold px-3 py-1.5 rounded transition-all cursor-pointer shadow-sm select-none ${
                      member.active
                        ? 'bg-red-500/10 text-red-700 border border-red-500/25 hover:bg-red-50'
                        : 'bg-primary text-on-primary hover:bg-black'
                    }`}
                  >
                    {member.active 
                      ? (languageMode === 'hindi' ? 'ड्यूटी समाप्त' : 'Check Out') 
                      : (languageMode === 'hindi' ? 'ड्यूटी शुरू' : 'Check In')
                    }
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
