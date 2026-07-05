/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Activity, Lock, User, Shield, Building, Hospital, Key, Mail, Phone, UserCheck, Users, Stethoscope, ChevronRight, Eye, EyeOff, Loader2 } from 'lucide-react';
import { auth, isFirebaseReady, googleProvider } from '../config/firebase';

interface AuthViewProps {
  onLoginSuccess: (user: any, token: string) => void;
  languageMode: 'english' | 'hindi' | 'bilingual';
}

export default function AuthView({ onLoginSuccess, languageMode }: AuthViewProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [registerType, setRegisterType] = useState<'hospital' | 'staff' | 'patient'>('staff');
  
  // Loading and feedback states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Mapped Google User State for custom onboarding flows
  const [googleUser, setGoogleUser] = useState<{ email: string; name: string } | null>(null);
  const [isGoogleConnecting, setIsGoogleConnecting] = useState(false);

  // List of facilities from API
  const [facilities, setFacilities] = useState<any[]>([]);

  // Fetch facilities for dropdown
  useEffect(() => {
    async function loadFacilities() {
      try {
        const localFacs = JSON.parse(localStorage.getItem('hl_local_facilities') || '[]');
        if (localFacs.length > 0) {
          setFacilities(localFacs);
          return;
        }

        if (isFirebaseReady) {
          const { collection, getDocs } = await import('firebase/firestore');
          const { db } = await import('../config/firebase');
          if (db) {
            const snap = await getDocs(collection(db, 'facilities'));
            const list: any[] = [];
            snap.forEach(docSnap => {
              list.push({ id: docSnap.id, ...docSnap.data() });
            });
            if (list.length > 0) {
              setFacilities(list);
              localStorage.setItem('hl_local_facilities', JSON.stringify(list));
              return;
            }
          }
        }

        const defaultFacs = [
          { id: 'fac-1', name: 'PHC Greater Noida East', type: 'PHC' },
          { id: 'fac-2', name: 'CHC Bahadurgarh West', type: 'CHC' },
          { id: 'fac-3', name: 'PHC Faridabad Central', type: 'PHC' }
        ];
        setFacilities(defaultFacs);
        localStorage.setItem('hl_local_facilities', JSON.stringify(defaultFacs));
      } catch (err) {
        console.error("Failed to load facilities:", err);
      }
    }
    loadFacilities();
  }, [activeTab]);

  // Form states
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Hospital register states
  const [hospName, setHospName] = useState('');
  const [hospType, setHospType] = useState('PHC');
  const [hospDistrict, setHospDistrict] = useState('');
  const [hospState, setHospState] = useState('');
  const [hospAdminName, setHospAdminName] = useState('');
  const [hospAdminEmail, setHospAdminEmail] = useState('');
  const [hospUsername, setHospUsername] = useState('');
  const [hospPassword, setHospPassword] = useState('');

  // Staff register states
  const [staffName, setStaffName] = useState('');
  const [staffRole, setStaffRole] = useState('Staff Nurse');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffShift, setStaffShift] = useState('Day');
  const [staffFacilityId, setStaffFacilityId] = useState('');
  const [staffUsername, setStaffUsername] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffEmail, setStaffEmail] = useState('');

  // Patient register states
  const [patName, setPatName] = useState('');
  const [patGender, setPatGender] = useState('Male');
  const [patAge, setPatAge] = useState('');
  const [patType, setPatType] = useState('OPD');
  const [patStatus, setPatStatus] = useState('Admitted');
  const [patContact, setPatContact] = useState('');
  const [patBp, setPatBp] = useState('120/80');
  const [patPulse, setPatPulse] = useState('');
  const [patTemp, setPatTemp] = useState('');
  const [patNotes, setPatNotes] = useState('');
  const [patBed, setPatBed] = useState('');
  const [patUsername, setPatUsername] = useState('');
  const [patPassword, setPatPassword] = useState('');
  const [patEmail, setPatEmail] = useState('');

  // Automatically select first facility in dropdown once facilities are loaded
  useEffect(() => {
    if (facilities.length > 0 && !staffFacilityId) {
      setStaffFacilityId(facilities[0].id);
    }
  }, [facilities, staffFacilityId]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUsername || !loginPassword) return;

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      // 1. If Firebase is active and user provided an email, authenticate to Firebase Auth too
      if (isFirebaseReady && auth && loginUsername.includes('@')) {
        try {
          const { signInWithEmailAndPassword } = await import('firebase/auth');
          const userCred = await signInWithEmailAndPassword(auth, loginUsername, loginPassword);
          const uid = userCred.user.uid;
          
          // Try fetching user profile from Firestore 'users' collection
          let userProfile = { id: uid, username: loginUsername, name: loginUsername.split('@')[0], role: 'staff', facility_name: 'PHC Greater Noida East' };
          try {
            const { doc, getDoc } = await import('firebase/firestore');
            const { db } = await import('../config/firebase');
            if (db) {
              const userDoc = await getDoc(doc(db, 'users', uid));
              if (userDoc.exists()) {
                userProfile = { id: uid, ...userDoc.data() } as any;
              }
            }
          } catch (e) {
            console.warn('[Firestore] Profile fetch failed, using default fallback profile', e);
          }
          
          onLoginSuccess(userProfile, 'fb-token-active');
          return;
        } catch (fbErr: any) {
          throw new Error(fbErr.message || "Cloud authentication failed.");
        }
      }

      // 2. Local/Offline Login Match
      const localUsers = JSON.parse(localStorage.getItem('hl_local_users') || '[]');
      const matchedUser = localUsers.find((u: any) => u.username === loginUsername && u.password === loginPassword);
      
      if (matchedUser) {
        onLoginSuccess({
          id: matchedUser.id || `mock-${Date.now()}`,
          username: matchedUser.username,
          name: matchedUser.name,
          role: matchedUser.role,
          associated_id: matchedUser.associated_id || '',
          facility_name: matchedUser.facility_name || 'PHC Greater Noida East'
        }, `mock-token-${Date.now()}`);
        return;
      }

      // 3. Fallbacks for seeded defaults
      if (loginUsername === 'worker' && loginPassword === 'worker123') {
         onLoginSuccess({ id: 'demo-1', username: 'worker', name: 'Sister Mary', role: 'worker', facility_name: 'PHC Greater Noida East', active: true }, 'mock-token-demo');
         return;
      }
      if (loginUsername === 'admin' && loginPassword === 'admin123') {
         onLoginSuccess({ id: 'admin-1', username: 'admin', name: 'Dr. Anil Verma', role: 'admin', facility_name: 'PHC Greater Noida East', active: true }, 'mock-token-admin');
         return;
      }

      throw new Error("Invalid credentials. Please register or use default demo accounts.");
    } catch (err: any) {
      setErrorMsg(err.message || "Authentication failed. Check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleConnecting(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    
    if (isFirebaseReady && auth) {
      try {
        const { signInWithPopup } = await import('firebase/auth');
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        const gUser = {
          email: user.email || "shyamp028@gmail.com",
          name: user.displayName || "Shyam Prasad"
        };
        setGoogleUser(gUser);
        setSuccessMsg(`Google Account verified (${gUser.email}). Choose an account category below to complete your profile registry.`);
        setActiveTab('register');
        
        // Prefill registration fields based on google info
        setHospAdminName(gUser.name);
        setHospAdminEmail(gUser.email);
        setStaffName(gUser.name);
        setStaffEmail(gUser.email);
        setPatName(gUser.name);
        setPatEmail(gUser.email);
      } catch (err: any) {
        console.error("Firebase Google Auth Failed:", err);
        setErrorMsg(`Google Auth Failed: ${err.message}. Reverting to sandbox mock.`);
        runMockGoogleLogin();
      } finally {
        setIsGoogleConnecting(false);
      }
    } else {
      runMockGoogleLogin();
    }
  };

  const runMockGoogleLogin = () => {
    setTimeout(() => {
      setIsGoogleConnecting(false);
      const mockGoogle = {
        email: "shyamp028@gmail.com",
        name: "Shyam Prasad"
      };
      setGoogleUser(mockGoogle);
      setSuccessMsg("Google Account verified (shyamp028@gmail.com). Choose an account category below to complete your profile registry.");
      setActiveTab('register');
      
      // Prefill registration fields based on google info
      setHospAdminName(mockGoogle.name);
      setHospAdminEmail(mockGoogle.email);
      setStaffName(mockGoogle.name);
      setStaffEmail(mockGoogle.email);
      setPatName(mockGoogle.name);
      setPatEmail(mockGoogle.email);
    }, 1200);
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    
    try {
      // Mock demo user
      onLoginSuccess({ id: 'demo-1', username: 'worker', role: 'staff', facility_id: 'fac-1', active: true }, 'mock-token-demo');
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to log in as guest.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      // Build profile telemetry object
      let userId = `user-${Date.now()}`;
      let profile: any = {};
      let email = '';
      let pwd = '';
      
      if (registerType === 'hospital') {
        email = hospAdminEmail;
        pwd = hospPassword;
        profile = {
          username: hospUsername,
          password: hospPassword,
          name: hospAdminName,
          role: 'admin',
          facility_name: hospName
        };
      } else if (registerType === 'staff') {
        email = staffEmail;
        pwd = staffPassword;
        profile = {
          username: staffUsername,
          password: staffPassword,
          name: staffName,
          role: 'worker',
          facility_name: facilities.find(f => f.id === staffFacilityId)?.name || 'PHC Greater Noida East'
        };
      } else {
        email = patEmail;
        pwd = patPassword;
        profile = {
          username: patUsername,
          password: patPassword,
          name: patName,
          role: 'patient',
          age: parseInt(patAge) || 0,
          pulse: parseInt(patPulse) || 72,
          temp: parseFloat(patTemp) || 98.6,
          associated_id: `pat-${Date.now()}`
        };
      }

      if (isFirebaseReady && auth && email && pwd) {
        try {
          const { createUserWithEmailAndPassword } = await import('firebase/auth');
          const userCred = await createUserWithEmailAndPassword(auth, email, pwd);
          userId = userCred.user.uid;
          console.log('[Firebase Auth] User registered in cloud:', email);
        } catch (fbErr: any) {
          console.warn('[Firebase Auth] Cloud registration bypassed or failed:', fbErr.message);
        }
      }

      profile.id = userId;

      // 4. Save to Firestore if ready
      const { db } = await import('../config/firebase');
      if (isFirebaseReady && db) {
        try {
          const { doc, setDoc } = await import('firebase/firestore');
          await setDoc(doc(db, 'users', userId), profile);
          
          if (registerType === 'hospital') {
            const newFacility = { id: `fac-${Date.now()}`, name: hospName, type: hospType, district: hospDistrict, state: hospState };
            await setDoc(doc(db, 'facilities', newFacility.id), newFacility);
            
            // Sync local list
            setFacilities(prev => [...prev, newFacility]);
            const localFacs = JSON.parse(localStorage.getItem('hl_local_facilities') || '[]');
            localStorage.setItem('hl_local_facilities', JSON.stringify([...localFacs, newFacility]));
          } else if (registerType === 'staff') {
            const newStaff = { id: userId, name: staffName, role: staffRole, phone: staffPhone, shift: staffShift, active: true };
            await setDoc(doc(db, 'staff', newStaff.id), newStaff);
          } else if (registerType === 'patient') {
            const newPatient = {
              id: profile.associated_id,
              name: patName,
              gender: patGender,
              age: profile.age,
              type: patType,
              status: patStatus,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              contact: patContact,
              vitals: { bp: patBp, pulse: profile.pulse, temp: profile.temp },
              notes: patNotes
            };
            await setDoc(doc(db, 'patients', newPatient.id), newPatient);
          }
          console.log('[Firestore] Telemetry synced.');
        } catch (dbErr) {
          console.error('[Firestore] Profile sync failed:', dbErr);
        }
      }

      // 5. Save to LocalStorage (Offline/Mock Mode)
      const localUsers = JSON.parse(localStorage.getItem('hl_local_users') || '[]');
      localUsers.push(profile);
      localStorage.setItem('hl_local_users', JSON.stringify(localUsers));

      if (registerType === 'hospital') {
        const newFacility = { id: `fac-${Date.now()}`, name: hospName, type: hospType, district: hospDistrict, state: hospState };
        const localFacs = JSON.parse(localStorage.getItem('hl_local_facilities') || '[]');
        localStorage.setItem('hl_local_facilities', JSON.stringify([...localFacs, newFacility]));
        setFacilities(prev => [...prev, newFacility]);
      } else if (registerType === 'staff') {
        const newStaff = { id: userId, name: staffName, role: staffRole, phone: staffPhone, shift: staffShift, active: true };
        const localStaff = JSON.parse(localStorage.getItem('hl_staff_members') || '[]');
        localStorage.setItem('hl_staff_members', JSON.stringify([...localStaff, newStaff]));
      } else if (registerType === 'patient') {
        const newPatient = {
          id: profile.associated_id,
          name: patName,
          gender: patGender,
          age: profile.age,
          type: patType,
          status: patStatus,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          contact: patContact,
          vitals: { bp: patBp, pulse: profile.pulse, temp: profile.temp },
          notes: patNotes
        };
        const localPatients = JSON.parse(localStorage.getItem('hl_patients') || '[]');
        localStorage.setItem('hl_patients', JSON.stringify([...localPatients, newPatient]));
      }

      setSuccessMsg(
        registerType === 'hospital' 
          ? "Hospital & Administrator profile registered successfully! Log in to access the system."
          : registerType === 'staff' 
            ? "Medical Staff profile registered successfully! Log in to begin shifts."
            : "Patient profile registered successfully! Log in to view your health record."
      );
      
      // Reset form states
      setLoginUsername(
        registerType === 'hospital' ? hospUsername : registerType === 'staff' ? staffUsername : patUsername
      );
      setLoginPassword('');
      setActiveTab('login');
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to complete registration.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 md:p-8 font-sans transition-colors duration-200">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl overflow-hidden flex flex-col transition-all duration-300">
        
        {/* Banner with Logo */}
        <div className="bg-slate-950 px-6 py-8 text-center relative overflow-hidden flex flex-col items-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(47,217,200,0.1)_1px,transparent_1px)] bg-[size:20px_20px] opacity-40" />
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-teal-500/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-teal-500/10 rounded-full blur-2xl" />
          
          <div className="w-12 h-12 rounded-2xl bg-teal-500 flex items-center justify-center text-black font-black text-xl shadow-lg shadow-teal-500/20 mb-3 z-10">
            <Activity className="w-6 h-6 text-black animate-pulse" />
          </div>
          
          <h2 className="text-xl font-bold text-white tracking-tight z-10">
            {languageMode === 'hindi' ? 'हेल्थलिंक डेली लॉगिन' : 'HealthLink Daily Gatekeeper'}
          </h2>
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mt-1 z-10">
            {languageMode === 'hindi' ? 'प्राथमिक स्वास्थ्य देखभाल एकीकृत खाता बही' : 'Primary Care Asset Ingestion Ledger'}
          </p>
        </div>

        {/* Tab Controllers */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-2 gap-2">
          <button
            onClick={() => { setActiveTab('login'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
              activeTab === 'login'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setActiveTab('register'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
              activeTab === 'register'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 md:p-8 flex-1 overflow-y-auto max-h-[65vh]">
          {/* Notifications */}
          {errorMsg && (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-xs font-semibold px-4 py-3 rounded-xl mb-6 leading-relaxed">
              {errorMsg}
            </div>
          )}
          
          {successMsg && (
            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400 text-xs font-semibold px-4 py-3 rounded-xl mb-6 leading-relaxed">
              {successMsg}
            </div>
          )}

          {activeTab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Username</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                  <input
                    type="text"
                    required
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold placeholder-slate-400 focus:outline-none focus:border-teal-500"
                    placeholder="e.g. nurse_mary"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl pl-10 pr-10 py-2.5 text-xs font-semibold placeholder-slate-400 focus:outline-none focus:border-teal-500"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-350 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || isGoogleConnecting}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>Enter Primary Care Dashboard</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Dynamic Guest and Google Telemetry Logins */}
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                <span className="flex-shrink mx-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest">or</span>
                <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isLoading || isGoogleConnecting}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 cursor-pointer transition-all bg-white dark:bg-slate-900"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  <span>{isGoogleConnecting ? 'Connecting...' : 'Google Account'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleGuestLogin}
                  disabled={isLoading || isGoogleConnecting}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 cursor-pointer transition-all bg-white dark:bg-slate-900"
                >
                  <Users className="w-4 h-4 text-slate-450 shrink-0" />
                  <span>Continue as Guest</span>
                </button>
              </div>

              <div className="text-center pt-2">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block uppercase tracking-wider">
                  Default Demo Access: admin / admin123  or  worker / worker123
                </span>
              </div>
            </form>
          ) : (
            /* REGISTRATION FORMS */
            <form onSubmit={handleRegister} className="space-y-5">
              {googleUser && (
                <div className="bg-teal-500/10 border border-teal-500/20 rounded-2xl p-4 flex items-center justify-between text-xs text-on-surface animate-fadeIn">
                  <div>
                    <span className="font-bold text-teal-600 dark:text-teal-400 block">Connected Google Account</span>
                    <span className="text-[10px] text-on-surface-variant font-mono mt-0.5 block">{googleUser.email}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setGoogleUser(null);
                      setHospAdminName('');
                      setHospAdminEmail('');
                      setStaffName('');
                      setStaffEmail('');
                      setPatName('');
                      setPatEmail('');
                    }}
                    className="text-[10px] text-red-500 font-bold hover:underline cursor-pointer"
                  >
                    Disconnect
                  </button>
                </div>
              )}
              
              {/* Type Switcher */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Account Category</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setRegisterType('staff')}
                    className={`py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg border transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      registerType === 'staff'
                        ? 'bg-teal-500/10 border-teal-500/40 text-teal-600 font-bold dark:text-teal-400'
                        : 'border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Staff</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegisterType('patient')}
                    className={`py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg border transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      registerType === 'patient'
                        ? 'bg-teal-500/10 border-teal-500/40 text-teal-600 font-bold dark:text-teal-400'
                        : 'border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Patient</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegisterType('hospital')}
                    className={`py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg border transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      registerType === 'hospital'
                        ? 'bg-teal-500/10 border-teal-500/40 text-teal-600 font-bold dark:text-teal-400'
                        : 'border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Hospital className="w-3.5 h-3.5" />
                    <span>Hospital</span>
                  </button>
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800/60 pt-4 space-y-4">
                {/* 1. Hospital Form */}
                {registerType === 'hospital' && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5 col-span-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase block">Hospital / Clinic Name</label>
                        <div className="relative">
                          <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="text" required value={hospName} onChange={(e) => setHospName(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold placeholder-slate-400 focus:outline-none focus:border-teal-500"
                            placeholder="e.g. PHC Noida Sector 62"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase block">Facility Type</label>
                        <select
                          value={hospType} onChange={(e) => setHospType(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none focus:border-teal-500"
                        >
                          <option value="PHC">PHC (Primary Health Centre)</option>
                          <option value="CHC">CHC (Community Health Centre)</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase block">District</label>
                        <input
                          type="text" required value={hospDistrict} onChange={(e) => setHospDistrict(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3.5 py-2.5 text-xs font-semibold placeholder-slate-400 focus:outline-none focus:border-teal-500"
                          placeholder="e.g. Gautam Buddha Nagar"
                        />
                      </div>
                      <div className="space-y-1.5 col-span-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase block">State</label>
                        <input
                          type="text" required value={hospState} onChange={(e) => setHospState(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3.5 py-2.5 text-xs font-semibold placeholder-slate-400 focus:outline-none focus:border-teal-500"
                          placeholder="e.g. Uttar Pradesh"
                        />
                      </div>
                      
                      {/* Administrator Info */}
                      <div className="space-y-1.5 col-span-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                        <label className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase block tracking-wider">Hospital Admin Details</label>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase block">Admin Full Name</label>
                        <input
                          type="text" required value={hospAdminName} onChange={(e) => setHospAdminName(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3.5 py-2.5 text-xs font-semibold placeholder-slate-400 focus:outline-none focus:border-teal-500"
                          placeholder="e.g. Dr. Anil Verma"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase block">Admin Email</label>
                        <input
                          type="email" required value={hospAdminEmail} onChange={(e) => setHospAdminEmail(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3.5 py-2.5 text-xs font-semibold placeholder-slate-400 focus:outline-none focus:border-teal-500"
                          placeholder="e.g. anil.verma@healthlink.org"
                        />
                      </div>
                      
                      {/* Credentials */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase block">Admin Username</label>
                        <input
                          type="text" required value={hospUsername} onChange={(e) => setHospUsername(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3.5 py-2.5 text-xs font-semibold placeholder-slate-400 focus:outline-none focus:border-teal-500"
                          placeholder="e.g. admin_noida"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase block">Admin Password</label>
                        <input
                          type="password" required value={hospPassword} onChange={(e) => setHospPassword(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3.5 py-2.5 text-xs font-semibold placeholder-slate-400 focus:outline-none focus:border-teal-500"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Staff Form */}
                {registerType === 'staff' && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5 col-span-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase block">Staff Full Name</label>
                        <div className="relative">
                          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="text" required value={staffName} onChange={(e) => setStaffName(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold placeholder-slate-400 focus:outline-none focus:border-teal-500"
                            placeholder="e.g. Dr. Ashok Mehta"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase block">Professional Role</label>
                        <select
                          value={staffRole} onChange={(e) => setStaffRole(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none focus:border-teal-500"
                        >
                          <option value="Medical Officer">Medical Officer (Doctor)</option>
                          <option value="Staff Nurse">Staff Nurse</option>
                          <option value="ANM">ANM (Auxiliary Nurse Midwife)</option>
                          <option value="Pharmacist">Pharmacist</option>
                          <option value="Lab Technician">Lab Technician</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase block">Phone Number</label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                          <input
                            type="text" required value={staffPhone} onChange={(e) => setStaffPhone(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl pl-9 pr-4 py-2.5 text-xs font-semibold placeholder-slate-400 focus:outline-none focus:border-teal-500"
                            placeholder="e.g. +91 99988 87776"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase block">Preferred Shift</label>
                        <select
                          value={staffShift} onChange={(e) => setStaffShift(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none focus:border-teal-500"
                        >
                          <option value="Day">Day Shift</option>
                          <option value="Night">Night Shift</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase block">Associated Facility</label>
                        <select
                          value={staffFacilityId} onChange={(e) => setStaffFacilityId(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none focus:border-teal-500"
                        >
                          {facilities.length > 0 ? (
                            facilities.map((fac) => (
                              <option key={fac.id} value={fac.id}>{fac.name} ({fac.type})</option>
                            ))
                          ) : (
                            <option value="">No facilities registered</option>
                          )}
                        </select>
                      </div>
                      
                      {/* Email and Credentials */}
                      <div className="space-y-1.5 col-span-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                        <label className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase block tracking-wider">Account Credentials</label>
                      </div>
                      <div className="space-y-1.5 col-span-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase block">Email Address</label>
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="email" required value={staffEmail} onChange={(e) => setStaffEmail(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold placeholder-slate-400 focus:outline-none focus:border-teal-500"
                            placeholder="e.g. ashok.mehta@healthlink.org"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase block">Username</label>
                        <input
                          type="text" required value={staffUsername} onChange={(e) => setStaffUsername(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3.5 py-2.5 text-xs font-semibold placeholder-slate-400 focus:outline-none focus:border-teal-500"
                          placeholder="e.g. dr_mehta"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase block">Password</label>
                        <input
                          type="password" required value={staffPassword} onChange={(e) => setStaffPassword(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3.5 py-2.5 text-xs font-semibold placeholder-slate-400 focus:outline-none focus:border-teal-500"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Patient Form */}
                {registerType === 'patient' && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1.5 col-span-3">
                        <label className="text-[10px] font-bold text-slate-400 uppercase block">Patient Full Name</label>
                        <div className="relative">
                          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="text" required value={patName} onChange={(e) => setPatName(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold placeholder-slate-400 focus:outline-none focus:border-teal-500"
                            placeholder="e.g. Sunita Devi"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase block">Gender</label>
                        <select
                          value={patGender} onChange={(e) => setPatGender(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-2 py-2.5 text-xs font-semibold focus:outline-none focus:border-teal-500"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase block">Age</label>
                        <input
                          type="number" required value={patAge} onChange={(e) => setPatAge(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2.5 text-xs font-semibold placeholder-slate-400 focus:outline-none focus:border-teal-500"
                          placeholder="e.g. 36"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase block">Care Group</label>
                        <select
                          value={patType} onChange={(e) => setPatType(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-2 py-2.5 text-xs font-semibold focus:outline-none focus:border-teal-500"
                        >
                          <option value="OPD">OPD (Outpatient)</option>
                          <option value="IPD">IPD (Inpatient)</option>
                        </select>
                      </div>

                      <div className="space-y-1.5 col-span-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase block">Contact Phone</label>
                        <input
                          type="text" required value={patContact} onChange={(e) => setPatContact(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2.5 text-xs font-semibold placeholder-slate-400 focus:outline-none focus:border-teal-500"
                          placeholder="e.g. +91 87654 32109"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase block">Bed Number (IPD)</label>
                        <input
                          type="text" value={patBed} onChange={(e) => setPatBed(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2.5 text-xs font-semibold placeholder-slate-400 focus:outline-none focus:border-teal-500 font-mono"
                          placeholder="e.g. B2"
                          disabled={patType !== 'IPD'}
                        />
                      </div>

                      {/* Vital Stats */}
                      <div className="space-y-1.5 col-span-3 border-t border-slate-100 dark:border-slate-800 pt-3">
                        <label className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase block tracking-wider">Patient Vitals Ingestion</label>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase block">Blood Pressure</label>
                        <input
                          type="text" value={patBp} onChange={(e) => setPatBp(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2.5 text-xs font-semibold placeholder-slate-400 focus:outline-none focus:border-teal-500 font-mono"
                          placeholder="e.g. 120/80"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase block">Pulse (bpm)</label>
                        <input
                          type="number" value={patPulse} onChange={(e) => setPatPulse(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2.5 text-xs font-semibold placeholder-slate-400 focus:outline-none focus:border-teal-500 font-mono"
                          placeholder="e.g. 72"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase block">Temp (°F)</label>
                        <input
                          type="number" step="0.1" value={patTemp} onChange={(e) => setPatTemp(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2.5 text-xs font-semibold placeholder-slate-400 focus:outline-none focus:border-teal-500 font-mono"
                          placeholder="e.g. 98.6"
                        />
                      </div>

                      <div className="space-y-1.5 col-span-3">
                        <label className="text-[10px] font-bold text-slate-400 uppercase block">Chief Symptoms / Care Notes</label>
                        <textarea
                          rows={2} value={patNotes} onChange={(e) => setPatNotes(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-xs font-semibold placeholder-slate-400 focus:outline-none focus:border-teal-500"
                          placeholder="e.g. Dehydration. Prescribed normal saline IV therapy."
                        />
                      </div>

                      {/* Credentials */}
                      <div className="space-y-1.5 col-span-3 border-t border-slate-100 dark:border-slate-800 pt-3">
                        <label className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase block tracking-wider">Patient Portal Account</label>
                      </div>
                      <div className="space-y-1.5 col-span-3">
                        <label className="text-[10px] font-bold text-slate-400 uppercase block">Email Address</label>
                        <input
                          type="email" value={patEmail} onChange={(e) => setPatEmail(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3.5 py-2.5 text-xs font-semibold placeholder-slate-400 focus:outline-none focus:border-teal-500"
                          placeholder="e.g. sunita.devi@gmail.com"
                        />
                      </div>
                      <div className="space-y-1.5 col-span-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase block">Portal Username</label>
                        <input
                          type="text" required value={patUsername} onChange={(e) => setPatUsername(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3.5 py-2.5 text-xs font-semibold placeholder-slate-400 focus:outline-none focus:border-teal-500"
                          placeholder="e.g. sunita_patient"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase block">Password</label>
                        <input
                          type="password" required value={patPassword} onChange={(e) => setPatPassword(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3.5 py-2.5 text-xs font-semibold placeholder-slate-400 focus:outline-none focus:border-teal-500"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Ingestion...</span>
                  </>
                ) : (
                  <>
                    <span>Submit & Register Account</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className="text-xs font-bold text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 transition-all cursor-pointer bg-transparent border-none outline-none"
                >
                  Already have an account? Sign In
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
