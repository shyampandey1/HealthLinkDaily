/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { MapPin, Compass, Search, Filter, Clock, Sparkles, ShieldAlert, Mic, MicOff, Map, Terminal, ArrowUpRight, HelpCircle, CheckCircle2, ChevronRight, RefreshCw, Layers } from 'lucide-react';
import { StockItem } from '../types';

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

  // Map settings
  const [mapLayer, setMapLayer] = useState<'radar' | 'satellite' | 'grid'>('radar');

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
    { name: 'Noida PHC Sector 62', lat: 28.5355, lng: 77.3910 },
    { name: 'Gurugram Base Clinic', lat: 28.4595, lng: 77.0266 },
    { name: 'Rohtak Central Ward', lat: 28.8955, lng: 76.6066 },
    { name: 'Faridabad Sub-Station', lat: 28.4089, lng: 77.3178 },
    { name: 'Bahadurgarh Dispensary', lat: 28.6924, lng: 76.9240 }
  ];

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
                {languageMode === 'hindi' ? 'भू-हॉटस्पॉट ट्रैकिंग डैशबोर्ड' : 'Geo Hotspot Logistics Tracker'}
              </h2>
              <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider block mt-1">
                {languageMode === 'hindi' ? 'वास्तविक समय जीपीएस और वॉयस ओसीआर विजुअलाइज़र' : 'Real-time GPS Coordinate OCR & Voice Input Visualization'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="bg-white/80 dark:bg-black/40 px-3.5 py-1.5 rounded-xl border border-outline-variant text-center">
            <span className="text-[9px] text-on-surface-variant font-bold uppercase tracking-wider block">Total Geotags</span>
            <span className="font-mono text-sm font-black text-secondary">{geoScans.length} Locations</span>
          </div>

          <button
            id="btn-toggle-sim-panel"
            onClick={() => setShowSimPanel(!showSimPanel)}
            className="bg-primary hover:bg-black !text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>{showSimPanel ? 'Hide Sim Controls' : 'Simulate Geotag'}</span>
          </button>
        </div>
      </div>

      {/* Simulator Overlay/Collapsible Panel */}
      {showSimPanel && (
        <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 text-slate-100 rounded-2xl p-5 border border-slate-800 shadow-md animate-slideDown space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4.5 h-4.5 text-yellow-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">OCR + GPS + Voice Telemetry Emulator</span>
            </div>
            <span className="text-[9px] bg-emerald-500/10 text-emerald-400 font-mono border border-emerald-500/20 px-2 py-0.5 rounded">
              ADMIN SIMULATOR
            </span>
          </div>

          <form onSubmit={handleAddSimulationHotspot} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Column 1: Medicine Info */}
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Medication Name</label>
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
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Form Type</label>
                  <select
                    value={simType}
                    onChange={(e) => setSimType(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="drip">Drip Bottle</option>
                    <option value="vial">Vial / Ampoule</option>
                    <option value="box">Retail Box</option>
                    <option value="tablet">Strip / Tablets</option>
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
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Quick PHC Presets</label>
                <div className="flex flex-wrap gap-1">
                  {presets.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => {
                        setSimLat(preset.lat);
                        setSimLng(preset.lng);
                      }}
                      className="text-[9px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded border border-slate-700 transition-all cursor-pointer"
                    >
                      {preset.name.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Column 3: Verbal Simulation & Submit */}
            <div className="space-y-3 flex flex-col justify-between">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Verbal Voice Command Log</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <input
                    type="text"
                    value={simVoiceCmd}
                    onChange={(e) => setSimVoiceCmd(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-6 pr-3 py-1.5 text-xs text-slate-300 italic focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. Capture normal saline thirty jars"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSimulating}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 rounded-lg transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer mt-1"
              >
                {isSimulating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Transmitting Telemetry...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Deploy simulated Hotspot Geotag</span>
                  </>
                )}
              </button>
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
                District Medical Supply Deployment
              </span>
            </div>

            {/* Layer toggles */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-on-surface-variant font-bold hidden sm:inline">LAYER:</span>
              <div className="bg-surface-container-high p-0.5 rounded-lg flex border border-outline-variant">
                {(['radar', 'satellite', 'grid'] as const).map((layer) => (
                  <button
                    key={layer}
                    onClick={() => setMapLayer(layer)}
                    className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded transition-all cursor-pointer ${
                      mapLayer === layer 
                        ? 'bg-secondary text-white shadow-sm' 
                        : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    {layer}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Map Area */}
          <div className="relative flex-1 bg-slate-100 dark:bg-slate-950 flex items-center justify-center overflow-hidden min-h-[350px] transition-colors duration-200">
            {selectedScan ? (
              <div className="absolute inset-0 z-20 bg-slate-100 dark:bg-slate-900 flex flex-col">
                <div className="absolute top-4 left-4 z-30">
                  <button
                    onClick={() => setSelectedScanId(null)}
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 px-3 py-1.5 rounded-lg shadow-lg font-bold text-[10px] uppercase flex items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    Back to Radar View
                  </button>
                </div>
                <iframe
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://maps.google.com/maps?q=${selectedScan.lat},${selectedScan.lng}&t=${mapLayer === 'satellite' ? 'k' : 'm'}&z=16&ie=UTF8&iwloc=&output=embed`}
                  className="flex-1 w-full h-full"
                />
              </div>
            ) : (
              <>
                {/* Custom layer background graphics */}
                {mapLayer === 'radar' && (
                  <div className="absolute inset-0 opacity-25 dark:opacity-15 pointer-events-none">
                    <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(16,185,129,0.15)_1px,transparent_1px)] bg-[size:16px_16px]" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] border border-emerald-500/25 dark:border-emerald-500/20 rounded-full" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[180px] h-[180px] border border-emerald-500/25 dark:border-emerald-500/20 rounded-full" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60px] h-[60px] border border-emerald-500/35 dark:border-emerald-500/30 rounded-full" />
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-full bg-emerald-500/15 dark:bg-emerald-500/10" />
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-px bg-emerald-500/15 dark:bg-emerald-500/10" />
                  </div>
                )}

                {mapLayer === 'grid' && (
                  <div className="absolute inset-0 opacity-30 dark:opacity-20 pointer-events-none bg-[linear-gradient(to_right,rgba(120,119,198,0.15)_1px,transparent_1px),linear-gradient(to_bottom,rgba(120,119,198,0.15)_1px,transparent_1px)] bg-[size:24px_24px]">
                    {/* Horizontal coordinate labels */}
                    <div className="absolute bottom-2 left-4 text-[8px] font-mono text-slate-500 dark:text-slate-400">GRID REF NCR-28-77</div>
                  </div>
                )}

                {mapLayer === 'satellite' && (
                  <div className="absolute inset-0 opacity-20 dark:opacity-10 pointer-events-none bg-gradient-to-tr from-cyan-900/20 via-slate-100 to-indigo-950/20 dark:from-cyan-900/40 dark:via-slate-950 dark:to-indigo-950/40 transition-all duration-200">
                    <div className="absolute bottom-4 right-4 text-[7px] font-mono text-slate-600 dark:text-slate-400 font-bold">SAT INTEL ORBITAL FEED</div>
                  </div>
                )}

                {/* District Target Center & Compass Accent */}
                <div className="absolute top-4 right-4 bg-white/85 dark:bg-black/40 border border-outline-variant dark:border-slate-800 rounded-lg p-2 text-right select-none text-[8px] font-mono text-slate-600 dark:text-slate-400 leading-normal pointer-events-none z-10 shadow-sm transition-colors duration-200">
                  <p className="font-bold">CENTER: HARYANA REGION</p>
                  <p>LAT: {((latBounds.min + latBounds.max) / 2).toFixed(4)}°N</p>
                  <p>LNG: {((lngBounds.min + lngBounds.max) / 2).toFixed(4)}°E</p>
                </div>

                {/* Live Sweeping Radar bar */}
                {mapLayer === 'radar' && (
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] origin-center bg-gradient-to-r from-transparent via-emerald-500/10 dark:via-emerald-500/5 to-transparent animate-[spin_6s_linear_infinite] pointer-events-none" />
                )}

                {/* Render GeoPins */}
                <svg className="absolute inset-0 w-full h-full p-6 select-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {filteredScans.map((scan) => {
                    const { x, y } = getCoordinatesPct(scan.lat, scan.lng);
                    const isSelected = scan.id === selectedScanId;
                    
                    // Color codes for pin types (using darker border tones in light mode for contrast)
                    let pinColor = 'text-blue-500 dark:text-blue-400 fill-blue-500/20'; // box
                    if (scan.itemType === 'drip') pinColor = 'text-emerald-600 dark:text-emerald-400 fill-emerald-500/20';
                    if (scan.itemType === 'vial') pinColor = 'text-amber-600 dark:text-amber-400 fill-amber-500/20';
                    if (scan.itemType === 'tablet') pinColor = 'text-purple-600 dark:text-purple-400 fill-purple-500/20';

                    return (
                      <g key={scan.id} className="cursor-pointer group">
                        {/* Ring highlight animation for selected pin */}
                        {isSelected && (
                          <circle
                            cx={x}
                            cy={y}
                            r="3.5"
                            className="fill-none stroke-slate-900 dark:stroke-white animate-ping opacity-60 stroke-[0.4]"
                          />
                        )}
                        
                        {/* Outer sensor halo */}
                        <circle
                          cx={x}
                          cy={y}
                          r={isSelected ? "5" : "2.5"}
                          className={`transition-all duration-300 stroke-current ${pinColor} ${
                            isSelected ? 'opacity-85 stroke-[0.4]' : 'opacity-40 stroke-[0.2] hover:opacity-75'
                          }`}
                          onClick={() => setSelectedScanId(scan.id)}
                        />

                        {/* Core coordinate dot */}
                        <circle
                          cx={x}
                          cy={y}
                          r="0.8"
                          className={`fill-slate-900 dark:fill-white transition-all ${
                            isSelected ? 'r-1' : ''
                          }`}
                          onClick={() => setSelectedScanId(scan.id)}
                        />

                        {/* Small tag next to selected pins */}
                        {isSelected && (
                          <text
                            x={x + 2.5}
                            y={y + 0.6}
                            className="fill-slate-900 dark:fill-white font-sans font-bold text-[2.5px] tracking-wide pointer-events-none drop-shadow-md select-none"
                          >
                            {scan.medicineName.split(' ')[0]} ({scan.qty})
                          </text>
                        )}
                      </g>
                    );
                  })}
                </svg>

                {/* Simple scale guide */}
                <div className="absolute bottom-3 left-4 bg-white/85 dark:bg-black/40 border border-outline-variant dark:border-slate-800 rounded-lg px-2 py-1 text-[8px] font-mono text-slate-600 dark:text-slate-400 select-none pointer-events-none flex items-center gap-1.5 shadow-sm transition-colors duration-200">
                  <span className="w-5 h-0.5 bg-slate-500 dark:bg-slate-400 block" />
                  <span>Scale: Approx. 10km Radius</span>
                </div>

                {/* Dynamic Compass Rose decoration */}
                <div className="absolute bottom-3 right-4 opacity-50 dark:opacity-40 select-none pointer-events-none transition-colors duration-200">
                  <Compass className="w-6 h-6 text-slate-600 dark:text-slate-500 animate-spin-slow" />
                </div>
              </>
            )}

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
              Search & Filter Geologs
            </span>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search scans, batch, operator..."
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
                  <option value="All">All Forms</option>
                  <option value="drip">Drip Bottles</option>
                  <option value="vial">Vials</option>
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
                Telemetry Station Data
              </span>
              {selectedScan ? (
                <span className="text-[9px] bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded font-mono font-bold">
                  ACTIVE SCAN
                </span>
              ) : (
                <span className="text-[9px] text-on-surface-variant italic">
                  Select a pin on the radar map
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
                    <span className="font-sans font-bold text-[10px] text-secondary uppercase tracking-wider">Coordinates locked</span>
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  </div>
                  <div className="flex justify-between">
                    <span>GPS Latitude:</span>
                    <span className="font-bold text-on-surface">{selectedScan.lat.toFixed(6)}° N</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GPS Longitude:</span>
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
                    <span className="text-[9px] text-on-surface-variant font-bold uppercase tracking-wider block">OCR Confidence</span>
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
                      Audio Transcription Log
                    </span>
                  </div>
                  <p className="text-xs text-on-surface leading-normal italic">
                    {selectedScan.verbalLog ? `"${selectedScan.verbalLog}"` : 'Hands-free voice override was inactive during this terminal capture.'}
                  </p>
                </div>

                {/* Metadata Operators details */}
                <div className="flex justify-between items-center text-[10px] text-on-surface-variant/80 font-medium">
                  <span>HIPAA Ingestion: Verified</span>
                  <span>Op: {selectedScan.operator}</span>
                </div>

              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-on-surface-variant">
                <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center mb-3 text-secondary border border-outline-variant/40">
                  <Layers className="w-5 h-5 text-secondary" />
                </div>
                <h4 className="font-bold text-xs">No Target Selected</h4>
                <p className="text-[11px] text-on-surface-variant/85 max-w-xs leading-relaxed mt-1">
                  Click on any coordinate point on the radar grid to view real-time Vision OCR payload details, GPS satellite stamps, and verbal logs.
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
            Verified Optical Geotag Registry
          </span>
          <span className="text-[9px] text-on-surface-variant font-mono">
            SECURED LEDGER • HIPAA-COMPLIANT
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
                <th className="px-4 py-3">GPS Location</th>
                <th className="px-4 py-3">Audio Command</th>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-5 py-3 text-right">Confidence</th>
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

    </div>
  );
}
