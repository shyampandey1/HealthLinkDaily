/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { MapPin, Compass, Search, Filter, Clock, Sparkles, ShieldAlert, Mic, MicOff, Map, Terminal, ArrowUpRight, HelpCircle, CheckCircle2, ChevronRight, RefreshCw, Layers } from 'lucide-react';
import { StockItem } from '../types';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import WeatherWidget from './WeatherWidget';

const MapController = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  React.useEffect(() => {
    map.setView(center, map.getZoom(), { animate: true });
  }, [center, map]);
  return null;
};

export interface GeoScan {
  id: string;
  medicineName: string;
  batchNumber: string;
  expiryDate: string;
  itemType: 'drip' | 'vial' | 'box' | 'tablet';
  qty: number;
  lat: number;
  lng: number;
  timestamp: string;
  confidence: number;
  verbalLog?: string;
  operator: string;
}

interface GeoHotspotViewProps {
  geoScans: GeoScan[];
  setGeoScans: React.Dispatch<React.SetStateAction<GeoScan[]>>;
  stockItems: StockItem[];
  setStockItems: React.Dispatch<React.SetStateAction<StockItem[]>>;
  languageMode: 'english' | 'hindi' | 'bilingual';
  openPrompt?: any;
}

export default function GeoHotspotView({
  geoScans,
  setGeoScans,
  stockItems,
  setStockItems,
  languageMode,
  openPrompt
}: GeoHotspotViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [selectedScanId, setSelectedScanId] = useState<string | null>(null);
  
  // Simulation form states
  const [simName, setSimName] = useState('Ringer\'s Lactate Infusion');
  const [simQty, setSimQty] = useState(50);
  const [simType, setSimType] = useState<'drip' | 'vial' | 'box' | 'tablet'>('drip');
  const [simLat, setSimLat] = useState(28.535);
  const [simLng, setSimLng] = useState(77.391);
  const [simVoiceCmd, setSimVoiceCmd] = useState('add fifty drips at Noida PHC');
  const [isSimulating, setIsSimulating] = useState(false);
  const [showSimPanel, setShowSimPanel] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Map settings
  const [mapLayer, setMapLayer] = useState<'standard' | 'satellite'>('standard');

  // Boundaries for the district coordinate mapping
  // Map Delhi NCR area approximately: Lat: [28.30, 28.95], Lng: [76.50, 77.50]
  const latBounds = { min: 28.30, max: 28.95 };
  const lngBounds = { min: 76.50, max: 77.50 };

  // Convert GPS Coordinates to SVG percentages for absolute layout alignment
  const getCoordinatesPct = (lat: number, lng: number) => {
    // Inverse projection for SVG layout
    const yPct = 100 - ((lat - latBounds.min) / (latBounds.max - latBounds.min)) * 100;
    const xPct = ((lng - lngBounds.min) / (lngBounds.max - lngBounds.min)) * 100;
    
    // Boundary check values
    return {
      x: Math.max(5, Math.min(95, xPct)),
      y: Math.max(5, Math.min(95, yPct))
    };
  };

  // Find the currently selected scan for details view
  const selectedScan = useMemo(() => {
    return geoScans.find(s => s.id === selectedScanId) || null;
  }, [geoScans, selectedScanId]);

  const centerLat = useMemo(() => {
    if (selectedScan) return selectedScan.lat;
    return (latBounds.min + latBounds.max) / 2;
  }, [selectedScan, latBounds.min, latBounds.max]);

  const centerLng = useMemo(() => {
    if (selectedScan) return selectedScan.lng;
    return (lngBounds.min + lngBounds.max) / 2;
  }, [selectedScan, lngBounds.min, lngBounds.max]);

  // Filter geoScans
  const filteredScans = useMemo(() => {
    return geoScans.filter(scan => {
      const matchesSearch = scan.medicineName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            scan.batchNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            scan.operator.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === 'All' || scan.itemType === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [geoScans, searchQuery, typeFilter]);

  // Handle local simulator addition
  const handleAddSimulationHotspot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simName || !simQty) return;

    setIsSimulating(true);

    setTimeout(() => {
      const newScan: GeoScan = {
        id: `scan-${Date.now()}`,
        medicineName: simName,
        batchNumber: `B-SIM-${Math.floor(1000 + Math.random() * 9000)}`,
        expiryDate: '12/2028',
        itemType: simType,
        qty: simQty,
        lat: Number(simLat),
        lng: Number(simLng),
        timestamp: new Date().toISOString(),
        confidence: 0.97,
        verbalLog: simVoiceCmd || undefined,
        operator: 'belaur2008@gmail.com'
      };

      // Add to scans list
      setGeoScans(prev => [newScan, ...prev]);

      // Add to inventory lists
      const nameMatch = simName.split(' ')[0].toLowerCase();
      const exists = stockItems.some(i => i.name.toLowerCase().includes(nameMatch));
      if (exists) {
        setStockItems(prev => prev.map(item => {
          if (item.name.toLowerCase().includes(nameMatch)) {
            return { ...item, count: item.count + simQty };
          }
          return item;
        }));
      } else {
        const newItem: StockItem = {
          id: `stock-${Date.now()}`,
          name: simName,
          category: simType === 'drip' ? '500ml Bottles' : simType === 'vial' ? 'Consumables' : 'Tablets',
          count: simQty,
          unit: simType === 'drip' ? 'Bottles' : simType === 'vial' ? 'Vials' : 'Tablets',
          criticalThreshold: Math.ceil(simQty * 0.3)
        };
        setStockItems(prev => [...prev, newItem]);
      }

      setIsSimulating(false);
      setSimName('NaCl 0.9% Normal Saline');
      setSimVoiceCmd('');
      setSelectedScanId(newScan.id);
    }, 1000);
  };

  // Quick preset locations in NCR for simulator
  const presets = [
    { name: 'RHTC Najafgarh', lat: 28.6131, lng: 76.9861 },
    { name: 'PUHC Mansa Ram Park', lat: 28.6224, lng: 77.0562 },
    { name: 'PHC Palam Village', lat: 28.5889, lng: 77.0831 },
    { name: 'PUHC Aya Nagar', lat: 28.4812, lng: 77.1354 }
  ];

  const parseVoiceCommand = (text: string) => {
    const textLower = text.toLowerCase();
    
    // Parse quantity
    const qtyMatch = textLower.match(/\b\d+\b/);
    if (qtyMatch) {
      setSimQty(parseInt(qtyMatch[0], 10));
    } else {
      const numberWords: {[key: string]: number} = {
        'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
        'ten': 10, 'twenty': 20, 'thirty': 30, 'forty': 40, 'fifty': 50,
        'hundred': 100, 'एक': 1, 'दो': 2, 'तीन': 3, 'चार': 4, 'पांच': 5,
        'दस': 10, 'बीस': 20, 'तीस': 30, 'चालीस': 40, 'पचास': 50, 'सौ': 100
      };
      for (const word of Object.keys(numberWords)) {
        if (textLower.includes(word)) {
          setSimQty(numberWords[word]);
          break;
        }
      }
    }

    // Parse item type & preset standard name
    if (textLower.includes('drip') || textLower.includes('saline') || textLower.includes('ड्रिप') || textLower.includes('सलाइन')) {
      setSimType('drip');
      setSimName('NaCl 0.9% Normal Saline');
    } else if (textLower.includes('vial') || textLower.includes('injection') || textLower.includes('वायल') || textLower.includes('इंजेक्शन')) {
      setSimType('vial');
      setSimName('Ceftriaxone Sodium Injection');
    } else if (textLower.includes('tablet') || textLower.includes('paracetamol') || textLower.includes('टैबलेट') || textLower.includes('पैरासिटामोल')) {
      setSimType('tablet');
      setSimName('Paracetamol 500mg');
    } else if (textLower.includes('box') || textLower.includes('kit') || textLower.includes('बॉक्स') || textLower.includes('किट')) {
      setSimType('box');
      setSimName('First Aid Kit Box');
    }

    // Parse preset locations
    let locationMatched = false;
    presets.forEach(p => {
      const placeName = p.name.split(' ')[0].toLowerCase();
      if (textLower.includes(placeName) || (placeName === 'noida' && textLower.includes('नोएडा')) || (placeName === 'gurugram' && textLower.includes('गुरुग्राम')) || (placeName === 'rohtak' && textLower.includes('रोहतक')) || (placeName === 'faridabad' && textLower.includes('फरीदाबाद')) || (placeName === 'bahadurgarh' && textLower.includes('बहादुरगढ़'))) {
        setSimLat(p.lat);
        setSimLng(p.lng);
        locationMatched = true;
      }
    });

    if (!locationMatched && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setSimLat(position.coords.latitude);
          setSimLng(position.coords.longitude);
        },
        (error) => console.warn("GPS Permission Denied or Error:", error)
      );
    }
  };

  const playFeedback = (type: 'start' | 'success') => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(type === 'start' ? 50 : [50, 50, 50]);
    }
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc.type = 'sine';
        if (type === 'start') {
          osc.frequency.setValueAtTime(440, ctx.currentTime);
          gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
          osc.start();
          osc.stop(ctx.currentTime + 0.1);
        } else {
          osc.frequency.setValueAtTime(600, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
          gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
          osc.start();
          osc.stop(ctx.currentTime + 0.15);
        }
      }
    } catch (e) {
      console.warn("Audio feedback error:", e);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
    } else {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert("Speech recognition is not supported in this browser. Please try Google Chrome or Safari.");
        return;
      }

      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = languageMode === 'hindi' ? 'hi-IN' : 'en-US';

      rec.onstart = () => {
        setIsListening(true);
        playFeedback('start');
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        playFeedback('success');
        setSimVoiceCmd(transcript);
        parseVoiceCommand(transcript);
      };

      rec.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
      rec.start();
    }
  };

  return (
    <div id="geo-hotspot-page-root" className="space-y-6 animate-fadeIn">
      {/* Title section with live counts */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-container-low p-4 rounded-2xl border border-outline-variant/60 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-secondary/10 rounded-xl text-secondary border border-secondary/20">
              <Compass className="w-5 h-5 animate-spin-slow text-secondary" />
            </div>
            <div>
              <h2 className="text-base font-bold text-primary leading-tight">
                {languageMode === 'hindi' ? 'दवा वितरण एवं स्थान मानचित्र' : 'Medicine Map & Location Tracker'}
              </h2>
              <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider block mt-1">
                {languageMode === 'hindi' ? 'दवा वितरण देखें और आवाज द्वारा स्थान जोड़ें' : 'View supply distributions and add coordinates using voice commands'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="bg-white/80 dark:bg-black/40 px-3.5 py-1.5 rounded-xl border border-outline-variant text-center">
            <span className="text-[9px] text-on-surface-variant font-bold uppercase tracking-wider block">Total Locations</span>
            <span className="font-mono text-sm font-black text-secondary">{geoScans.length} Places</span>
          </div>

          <button
            id="btn-toggle-sim-panel"
            onClick={() => setShowSimPanel(!showSimPanel)}
            className="bg-secondary text-on-secondary hover:opacity-90 text-xs font-bold px-4 py-2 rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>{showSimPanel ? 'Close Form' : 'Add Marker'}</span>
          </button>
        </div>
      </div>

      {/* Simulator Overlay/Collapsible Panel */}
      {showSimPanel && (
        <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 text-slate-100 rounded-2xl p-5 border border-slate-800 shadow-md animate-slideDown space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4.5 h-4.5 text-yellow-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">Mark a Location</span>
            </div>
            <span className="text-[9px] bg-emerald-500/10 text-emerald-400 font-mono border border-emerald-500/20 px-2 py-0.5 rounded">
              DEMO MODE
            </span>
          </div>

          <form onSubmit={handleAddSimulationHotspot} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Column 1: Medicine Info */}
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Medicine Name</label>
                <input
                  type="text"
                  value={simName}
                  onChange={(e) => setSimName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-medium"
                  placeholder="e.g. Paracetamol 500mg"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Quantity</label>
                  <input
                    type="number"
                    value={simQty}
                    onChange={(e) => setSimQty(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Packaging / Type</label>
                  <select
                    value={simType}
                    onChange={(e) => setSimType(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="drip">Infusion / Drip</option>
                    <option value="vial">Injection / Vial</option>
                    <option value="box">Box</option>
                    <option value="tablet">Tablets / Strips</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Column 2: Coordinate & Presets */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={simLat}
                    onChange={(e) => setSimLat(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={simLng}
                    onChange={(e) => setSimLng(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Quick Location Presets</label>
                <div className="flex flex-wrap gap-1">
                  {presets.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => {
                        setSimLat(preset.lat);
                        setSimLng(preset.lng);
                      }}
                      className="text-[9px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded border border-slate-700 transition-all cursor-pointer font-medium"
                    >
                      {preset.name.replace(/^(RHTC|PUHC|PHC)\s+/, '')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-3 flex flex-col justify-between">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Speak to Fill Form {languageMode === 'hindi' ? '(आवाज से फॉर्म भरने के लिए माइक दबाएं)' : '(Click mic to speak)'}
                </label>
                <div className="relative flex items-center">
                  <button
                    type="button"
                    onClick={toggleListening}
                    className={`absolute left-2.5 p-1 rounded-full transition-all duration-200 cursor-pointer ${
                      isListening
                        ? 'bg-red-500 text-white animate-pulse'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                    }`}
                    title={isListening ? "Stop listening" : "Start speaking"}
                  >
                    {isListening ? (
                      <span className="relative flex h-3.5 w-3.5 items-center justify-center">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <Mic className="relative w-3.5 h-3.5 text-white" />
                      </span>
                    ) : (
                      <Mic className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <input
                    type="text"
                    value={simVoiceCmd}
                    onChange={(e) => setSimVoiceCmd(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-3 py-1.5 text-xs text-slate-300 italic focus:outline-none focus:border-emerald-500"
                    placeholder={isListening ? "Listening... Speak clearly" : "e.g. Add 50 drips at Noida PHC"}
                  />
                </div>
              </div>

              {simVoiceCmd ? (
                <button
                  type="submit"
                  disabled={isSimulating}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2 rounded-lg transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer mt-1 animate-pulse"
                >
                  {isSimulating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Feeding Data...</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-3.5 h-3.5" />
                      <span>Feed Voice Data</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSimulating}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 rounded-lg transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                >
                  {isSimulating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Adding Location...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Add Location</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Main Grid: Interactive Map (Left/Center) + Detail / Hotspots Info (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* SVG Coordinates Radar/Grid Map - spans 7 columns */}
        <div className="lg:col-span-7 flex flex-col bg-surface-container-lowest border border-outline-variant/60 rounded-2xl shadow-sm overflow-hidden min-h-[420px]">
          
          {/* Map Controls Header */}
          <div className="flex items-center justify-between px-5 py-3.5 bg-surface-container-low border-b border-outline-variant shrink-0">
            <div className="flex items-center gap-2">
              <Map className="w-4 h-4 text-secondary animate-pulse" />
              <span className="text-xs font-bold text-primary uppercase tracking-wider">
                Medical Stock Location Map
              </span>
            </div>

            {/* Layer toggles */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-on-surface-variant font-bold hidden sm:inline">MAP VIEW:</span>
              <div className="bg-surface-container-high p-0.5 rounded-lg flex border border-outline-variant">
                {(['standard', 'satellite'] as const).map((layer) => (
                  <button
                    key={layer}
                    onClick={() => setMapLayer(layer)}
                    className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded transition-all cursor-pointer ${
                      mapLayer === layer 
                        ? 'bg-secondary text-white shadow-sm' 
                        : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    {layer === 'standard' ? 'Standard' : 'Satellite'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Map Area */}
          <div className="relative flex-1 bg-slate-100 dark:bg-slate-950 flex items-center justify-center overflow-hidden min-h-[350px] transition-colors duration-200">
            <MapContainer 
              center={[centerLat, centerLng]} 
              zoom={13} 
              style={{ width: '100%', height: '100%', zIndex: 10 }}
              zoomControl={false}
              className="leaflet-container"
            >
              <MapController center={[centerLat, centerLng]} />
              
              {/* Dynamic Tile Layer switching using Google Tile Servers */}
              {mapLayer === 'satellite' ? (
                <TileLayer
                  url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
                  attribution="&copy; Google Satellite"
                  maxZoom={20}
                />
              ) : (
                <TileLayer
                  url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                  attribution="&copy; Google Maps"
                  maxZoom={20}
                />
              )}

              {/* Render Leaflet GeoPins */}
              {filteredScans.map((scan) => {
                const isSelected = scan.id === selectedScanId;
                
                // Color codes for pin types
                let pinColor = '#3b82f6'; // blue box
                if (scan.itemType === 'drip') pinColor = '#10b981'; // emerald
                if (scan.itemType === 'vial') pinColor = '#f59e0b'; // amber
                if (scan.itemType === 'tablet') pinColor = '#9333ea'; // purple

                return (
                  <CircleMarker
                    key={scan.id}
                    center={[scan.lat, scan.lng]}
                    pathOptions={{ 
                      color: isSelected ? '#ffffff' : pinColor, 
                      fillColor: pinColor, 
                      fillOpacity: 0.6,
                      weight: isSelected ? 3 : 2
                    }}
                    radius={isSelected ? 10 : 6}
                    eventHandlers={{
                      click: () => setSelectedScanId(scan.id),
                    }}
                  >
                    {isSelected && (
                      <Popup autoClose={false}>
                        <div className="font-sans font-bold text-[11px]">
                          {scan.medicineName} (Qty: {scan.qty})
                        </div>
                      </Popup>
                    )}
                  </CircleMarker>
                );
              })}
            </MapContainer>

            {/* Overlays on top of Map */}
            {mapLayer === 'satellite' && (
              <div className="absolute inset-0 opacity-20 dark:opacity-10 pointer-events-none bg-gradient-to-tr from-cyan-900/20 via-slate-100 to-indigo-950/20 dark:from-cyan-900/40 dark:via-slate-950 dark:to-indigo-950/40 z-[15]" />
            )}

            {/* District Target Center Overlay */}
            <div className="absolute top-4 right-4 bg-white/90 dark:bg-black/60 border border-outline-variant dark:border-slate-800 rounded-lg p-2 text-right select-none text-[8px] font-mono text-slate-700 dark:text-slate-300 leading-normal pointer-events-none z-20 shadow-lg backdrop-blur-sm">
              <p className="font-bold text-emerald-600 dark:text-emerald-400">Center: Haryana Region</p>
              <p>Latitude: {centerLat.toFixed(4)}°N</p>
              <p>Longitude: {centerLng.toFixed(4)}°E</p>
            </div>

            {/* Dynamic Compass Rose decoration */}
            <div className="absolute bottom-4 right-4 opacity-75 dark:opacity-60 select-none pointer-events-none z-20 bg-white/50 dark:bg-black/50 rounded-full p-1 backdrop-blur-sm">
              <Compass className="w-8 h-8 text-slate-700 dark:text-slate-400 animate-spin-slow" />
            </div>

            {/* Weather Widget Overlay */}
            <div className="absolute top-4 left-4 z-[25] pointer-events-none">
              <WeatherWidget />
            </div>

          </div>

          {/* Map legend footer */}
          <div className="px-5 py-3.5 bg-surface-container-low border-t border-outline-variant shrink-0 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[10px] font-bold text-on-surface-variant">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Drips (Normal Saline, etc)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Vials (Ceftriaxone, etc)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              <span>Tablets (Paracetamol, etc)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span>Others / Boxes</span>
            </div>
          </div>

        </div>

        {/* Selected Pin / Hotspot Detail View - spans 5 columns */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          
          {/* Filter & Search Bar */}
          <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-4 shadow-sm space-y-3 shrink-0">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">
              Search & Filter Locations
            </span>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by medicine, batch, operator..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant rounded-xl pl-9 pr-3 py-1.5 text-xs text-on-surface focus:outline-none focus:border-secondary font-medium"
                />
              </div>

              <div className="relative">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="bg-surface-container border border-outline-variant rounded-xl px-2.5 py-1.5 text-xs text-on-surface font-semibold focus:outline-none focus:border-secondary"
                >
                  <option value="All">All Types</option>
                  <option value="drip">Drips</option>
                  <option value="vial">Injections / Vials</option>
                  <option value="tablet">Tablets</option>
                  <option value="box">Boxes</option>
                </select>
              </div>
            </div>
          </div>

          {/* Active Hotspot Details card */}
          <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl shadow-sm overflow-hidden flex-1 flex flex-col min-h-[300px]">
            <div className="px-5 py-3.5 bg-surface-container-low border-b border-outline-variant flex justify-between items-center shrink-0">
              <span className="text-xs font-bold text-primary uppercase tracking-wider">
                Selected Location Details
              </span>
              {selectedScan ? (
                <span className="text-[9px] bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded font-mono font-bold">
                  ACTIVE MARKER
                </span>
              ) : (
                <span className="text-[9px] text-on-surface-variant italic">
                  Select a marker on the map
                </span>
              )}
            </div>

            {selectedScan ? (
              <div className="p-5 flex-1 overflow-y-auto space-y-4">
                
                {/* Header info */}
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-sans text-base font-bold text-primary tracking-tight">
                      {selectedScan.medicineName}
                    </h4>
                    <span className="text-[10px] text-on-surface-variant font-mono mt-1 block">
                      Batch: {selectedScan.batchNumber} | Exp: {selectedScan.expiryDate}
                    </span>
                  </div>

                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                    selectedScan.itemType === 'drip' ? 'bg-emerald-500/15 border-emerald-500/25 text-emerald-700 dark:text-emerald-400' :
                    selectedScan.itemType === 'vial' ? 'bg-amber-500/15 border-amber-500/25 text-amber-700 dark:text-amber-400' :
                    'bg-blue-500/15 border-blue-500/25 text-blue-700 dark:text-blue-400'
                  }`}>
                    {selectedScan.itemType.toUpperCase()}
                  </span>
                </div>

                {/* GPS Coordinates locked */}
                <div className="bg-surface-container-low p-3.5 rounded-xl border border-outline-variant space-y-2 font-mono text-[11px] text-on-surface-variant">
                  <div className="flex justify-between items-center">
                    <span className="font-sans font-bold text-[10px] text-secondary uppercase tracking-wider">Location Coordinates</span>
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  </div>
                  <div className="flex justify-between">
                    <span>Latitude:</span>
                    <span className="font-bold text-on-surface">{selectedScan.lat.toFixed(6)}° N</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Longitude:</span>
                    <span className="font-bold text-on-surface">{selectedScan.lng.toFixed(6)}° E</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-outline-variant/35 text-[10px]">
                    <span>Timestamp:</span>
                    <span className="italic">{new Date(selectedScan.timestamp).toLocaleString()}</span>
                  </div>
                </div>

                {/* Confidence bar & quantity */}
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant text-center">
                    <span className="text-[9px] text-on-surface-variant font-bold uppercase tracking-wider block">Quantity</span>
                    <span className="font-mono text-lg font-black text-secondary mt-1 block">{selectedScan.qty}</span>
                  </div>

                  <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant text-center">
                    <span className="text-[9px] text-on-surface-variant font-bold uppercase tracking-wider block">Scan Match Accuracy</span>
                    <span className="font-mono text-lg font-black text-emerald-600 mt-1 block">{(selectedScan.confidence * 100).toFixed(0)}%</span>
                  </div>
                </div>

                {/* Voice command transcript log if available */}
                <div className="bg-surface-container p-3.5 rounded-xl border border-outline-variant space-y-2">
                  <div className="flex items-center gap-1.5">
                    {selectedScan.verbalLog ? (
                      <Mic className="w-3.5 h-3.5 text-secondary shrink-0 animate-pulse" />
                    ) : (
                      <MicOff className="w-3.5 h-3.5 text-on-surface-variant shrink-0" />
                    )}
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                      Voice Command Log
                    </span>
                  </div>
                  <p className="text-xs text-on-surface leading-normal italic">
                    {selectedScan.verbalLog ? `"${selectedScan.verbalLog}"` : 'No voice command used.'}
                  </p>
                </div>

                {/* Metadata Operators details */}
                <div className="flex justify-between items-center text-[10px] text-on-surface-variant/80 font-medium">
                  <span>Data Security: Verified</span>
                  <span>Op: {selectedScan.operator}</span>
                </div>

              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-on-surface-variant">
                <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center mb-3 text-secondary border border-outline-variant/40">
                  <Layers className="w-5 h-5 text-secondary" />
                </div>
                <h4 className="font-bold text-xs">No Location Selected</h4>
                <p className="text-[11px] text-on-surface-variant/85 max-w-xs leading-relaxed mt-1">
                  Click on any point on the map to view supply details, coordinates, and notes.
                </p>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Grid listing historical records */}
      {/* Grid listing historical records */}
      <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl shadow-sm overflow-hidden shrink-0">
        <div className="px-5 py-4 bg-surface-container-low border-b border-outline-variant flex justify-between items-center">
          <span className="text-xs font-bold text-on-surface uppercase tracking-wider">
            Saved Medicine Scan List
          </span>
          <span className="text-[9px] text-on-surface-variant font-mono">
            SECURED LOCAL DATABASE
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant text-[10px] font-bold text-on-surface-variant uppercase tracking-wider select-none">
                <th className="px-5 py-3">Medicine</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Batch</th>
                <th className="px-4 py-3 text-center">Qty</th>
                <th className="px-4 py-3">Coordinates</th>
                <th className="px-4 py-3">Voice Command</th>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-5 py-3 text-right">Accuracy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/40">
              {filteredScans.length > 0 ? (
                filteredScans.map((scan) => (
                  <tr
                    key={scan.id}
                    onClick={() => setSelectedScanId(scan.id)}
                    className={`bg-surface-container-lowest hover:bg-surface-container-low transition-colors cursor-pointer ${
                      scan.id === selectedScanId ? 'bg-secondary/5 font-semibold' : ''
                    }`}
                  >
                    <td className="px-5 py-3 font-bold text-on-surface">{scan.medicineName}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                        scan.itemType === 'drip' ? 'bg-emerald-500/10 border-emerald-500/15 text-emerald-700 dark:text-emerald-400' :
                        scan.itemType === 'vial' ? 'bg-amber-500/10 border-amber-500/15 text-amber-700 dark:text-amber-400' :
                        'bg-blue-500/10 border-blue-500/15 text-blue-700 dark:text-blue-400'
                      }`}>
                        {scan.itemType}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[10px] text-on-surface-variant">{scan.batchNumber}</td>
                    <td className="px-4 py-3 text-center font-mono font-bold text-on-surface">{scan.qty}</td>
                    <td className="px-4 py-3 font-mono text-[10px] text-on-surface-variant flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-rose-500" />
                      <span>{scan.lat.toFixed(4)}, {scan.lng.toFixed(4)}</span>
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant italic truncate max-w-[150px]">
                      {scan.verbalLog ? `"${scan.verbalLog}"` : '—'}
                    </td>
                    <td className="px-4 py-3 text-[10px] text-on-surface-variant">
                      {new Date(scan.timestamp).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="font-mono text-secondary font-bold">{(scan.confidence * 100).toFixed(0)}%</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-on-surface-variant italic">
                    No matching optical scan records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Primary Care Centre Directory Dashboard */}
      <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl shadow-sm p-5 mt-6 space-y-4">
        <div>
          <h3 className="font-sans text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2">
            <Compass className="w-4 h-4 text-secondary animate-pulse" />
            <span>{languageMode === 'hindi' ? 'प्राथमिक स्वास्थ्य केंद्र निर्देशिका' : 'Primary Care Centre Directory'}</span>
          </h3>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            {languageMode === 'hindi' 
              ? 'क्षेत्रीय प्राथमिक स्वास्थ्य केंद्रों (PHC) और सामुदायिक स्वास्थ्य केंद्रों (CHC) की सूची और उनकी कनेक्टिविटी।' 
              : 'List and transit connectivity of local Primary Health Centres (PHC) and Community Health Centres (CHC).'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              name: 'Rural Health Training Centre (RHTC)',
              subName: 'Najafgarh',
              type: 'RHTC',
              lat: 28.6131,
              lng: 76.9861,
              address: 'Plot No. 12, Najafgarh Extension, Agarwal Colony, Najafgarh, New Delhi - 110043',
              transit: 'Magenta & Blue Line (Nawada Metro)',
              status: 'Operational',
              statusColor: 'bg-emerald-500 text-white'
            },
            {
              name: 'Primary Urban Health Centre (PUHC)',
              subName: 'Mansa Ram Park',
              type: 'PUHC',
              lat: 28.6224,
              lng: 77.0562,
              address: 'Block D, Mansa Ram Park, Uttam Nagar, New Delhi - 110059',
              transit: 'Blue Line (Nawada / Uttam Nagar West)',
              status: 'Operational',
              statusColor: 'bg-emerald-500 text-white'
            },
            {
              name: 'Primary Health Center (PHC)',
              subName: 'Palam Village',
              type: 'PHC',
              lat: 28.5889,
              lng: 77.0831,
              address: 'Sector-7, Dwarka Road, Raj Nagar, New Delhi - 110045',
              transit: 'Magenta Line (Dabri Mor / Palam Metro)',
              status: 'Normal',
              statusColor: 'bg-emerald-500 text-white'
            },
            {
              name: 'Primary Urban Health Centre (PUHC)',
              subName: 'Aya Nagar',
              type: 'PUHC',
              lat: 28.4812,
              lng: 77.1354,
              address: 'Ghoda Mohalla, Phase 1, Aya Nagar, New Delhi - 110047',
              transit: 'Yellow Line (Arjan Garh Metro)',
              status: 'Operational',
              statusColor: 'bg-emerald-500 text-white'
            }
          ].map((center) => (
            <div 
              key={center.name + center.subName}
              className="bg-surface-container-low border border-outline-variant p-4 rounded-xl flex flex-col justify-between hover:shadow-md transition-all relative group overflow-hidden"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container tracking-wide">
                    {center.type}
                  </span>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    {center.status}
                  </span>
                </div>
                <div>
                  <h4 className="font-sans text-xs font-bold text-on-surface leading-tight">
                    {center.name}
                  </h4>
                  <p className="text-[11px] font-semibold text-secondary mt-0.5">
                    {center.subName}
                  </p>
                </div>
                
                <hr className="border-outline-variant/30 animate-pulse" />

                <div className="space-y-1.5 text-[10px]">
                  <p className="text-on-surface-variant leading-relaxed">
                    <strong className="text-on-surface text-[9px] uppercase tracking-wider block">Address</strong>
                    {center.address}
                  </p>
                  <p className="text-on-surface-variant leading-relaxed">
                    <strong className="text-on-surface text-[9px] uppercase tracking-wider block">Transit / Metro</strong>
                    {center.transit}
                  </p>
                  <p className="font-mono text-[9px] text-slate-500 dark:text-slate-400">
                    Coords: {center.lat}, {center.lng}
                  </p>
                </div>
              </div>

              <div className="pt-3">
                <button
                  onClick={() => {
                    const query = `${center.name}, ${center.address}`;
                    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, '_blank');
                  }}
                  className="w-full bg-surface-container-high hover:bg-secondary hover:text-white transition-all text-on-surface font-bold text-[10px] py-1.5 rounded-lg border border-outline-variant/60 cursor-pointer flex items-center justify-center gap-1"
                >
                  <MapPin className="w-3 h-3 text-rose-500 group-hover:text-white transition-all" />
                  <span>Locate on Map</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
