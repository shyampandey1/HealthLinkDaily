/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Cloud, Droplets, Wind, Thermometer, MapPin, Loader2, AlertCircle } from 'lucide-react';

interface WeatherData {
  temp: number;
  description: string;
  humidity: number;
  windSpeed: number;
  locationName: string;
  iconUrl: string;
}

export default function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;
          if (!apiKey || apiKey === 'YOUR_OPENWEATHER_API_KEY' || apiKey.trim() === '') {
             // Mock weather if no API key is provided
             setTimeout(() => {
               setWeather({
                 temp: 32,
                 description: 'clear sky (mock data)',
                 humidity: 45,
                 windSpeed: 4.1,
                 locationName: 'Delhi NCR',
                 iconUrl: 'https://openweathermap.org/img/wn/01d@2x.png'
               });
               setLoading(false);
             }, 1000);
             return;
          }
          
          const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`);
          if (!response.ok) {
            throw new Error('Failed to fetch weather data');
          }
          const data = await response.json();
          setWeather({
            temp: data.main.temp,
            description: data.weather[0].description,
            humidity: data.main.humidity,
            windSpeed: data.wind.speed,
            locationName: data.name,
            iconUrl: `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`
          });
        } catch (err: any) {
          setError(err.message || 'Unknown error');
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setError('Location access denied');
        setLoading(false);
      },
      { timeout: 10000 }
    );
  }, []);

  if (loading) {
    return (
      <div className="bg-white/90 dark:bg-black/60 border border-outline-variant dark:border-slate-800 rounded-lg p-3 backdrop-blur-sm shadow-lg flex items-center justify-center min-w-[120px]">
        <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="bg-white/90 dark:bg-black/60 border border-outline-variant dark:border-slate-800 rounded-lg p-2 backdrop-blur-sm shadow-lg flex items-center gap-2 max-w-[200px]">
        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
        <span className="text-[9px] font-bold text-slate-600 dark:text-slate-300 leading-tight">
          Weather unavailable: {error}
        </span>
      </div>
    );
  }

  return (
    <div className="bg-white/90 dark:bg-black/60 border border-outline-variant dark:border-slate-800 rounded-lg p-3 backdrop-blur-sm shadow-lg pointer-events-auto">
      <div className="flex items-center gap-1.5 mb-2 border-b border-outline-variant/50 pb-1.5">
        <MapPin className="w-3 h-3 text-emerald-600" />
        <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider truncate max-w-[120px]">
          {weather.locationName}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-center justify-center min-w-[40px]">
          <img src={weather.iconUrl} alt={weather.description} className="w-10 h-10 -my-1 drop-shadow-md object-contain" />
          <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 capitalize whitespace-nowrap">
            {weather.description}
          </span>
        </div>
        <div className="flex flex-col gap-1 border-l border-outline-variant/50 pl-3">
          <div className="flex items-center gap-1.5">
            <Thermometer className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{Math.round(weather.temp)}°C</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Droplets className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">{weather.humidity}%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Wind className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">{weather.windSpeed} m/s</span>
          </div>
        </div>
      </div>
    </div>
  );
}
