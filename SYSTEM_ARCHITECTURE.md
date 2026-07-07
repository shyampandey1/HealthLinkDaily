# System Architecture & Technical Specifications

This document outlines the high-level system architecture, complete technology stack, AI implementations, and UI/UX design specifications for **HealthLink Daily**.

---

## 1. High-Level System Architecture

HealthLink Daily is designed as a secure, offline-first, client-driven Progressive Web Application (PWA). It integrates backend cloud databases, serverless edge functions, and Google Cloud Vertex AI models to deliver real-time inventory management and supply logistics.

```
       ┌─────────────────────────────────────────────────────────┐
       │                 CLIENT LAYER (Browser)                  │
       │  PWA Service Worker • LocalCache • HTML5 WebRTC/Speech  │
       └───────────────────────────┬─────────────────────────────┘
                                   │
                  ┌────────────────┴──────────────┐
                  ▼ (Direct API Hooks)            ▼ (OAuth 2.0 / Firebase)
       ┌────────────────────────┐      ┌────────────────────────┐
       │   Google Vertex AI     │      │   Firebase Backend     │
       │   (Gemini 3.5 Flash)   │      │ Firestore • Auth       │
       └────────────────────────┘      └────────────────────────┘
```

### Architectural Key Characteristics:
*   **Offline-First Operation**: Local session states sync automatically via Browser `LocalStorage` arrays and fire fallbacks for scanning/forecasting calculations when network connectivity is lost.
*   **Decentralized Data Sync**: Direct, secure integration with Firebase Services for User Authentication, Roster Registries, and Inventory logs.
*   **Edge AI Execution**: Generative AI tasks (like Vision OCR and Logistics Forecasting) are computed via client-side SDK requests routing through secure, API-configured Cloud functions.

---

## 2. Core Technology Stack

### Frontend & Build System
*   **Framework Core**: React (Single Page Application architecture with localized client-side router hooks).
*   **Languages**: TypeScript (Strict typing for datasets, inventory schemas, and layout configurations) and ES6+ JavaScript.
*   **Build Bundler**: Vite (utilizing lightning-fast Hot Module Replacement and Rollup bundling).
*   **Styling Engine**: Vanilla CSS paired with TailwindCSS utility layers for layout grid structures.

### Visual Interactive Map Stack
*   **Mapping Library**: Leaflet & React Leaflet (`react-leaflet`).
*   **Tile Servers**: Custom integration with Google Maps API Satellite and Standard map layers (`https://mt1.google.com/vt/lyrs=m`).
*   **Telemetry Overlays**: SVG coordinate math translating raw geographical latitude/longitude boundaries directly into responsive overlay layouts.

### Speech & Media APIs
*   **Media Devices**: HTML5 WebRTC `navigator.mediaDevices` stream capture for barcode/text recognition.
*   **Speech Synthesis & Recognition**: Browser-native Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`) supporting English (`en-US`) and Hindi (`hi-IN`) syntax parsing.

---

## 3. Vertex AI Integration (Gemini 3.5 Flash)

The system utilizes Google Cloud Vertex AI's **Gemini 3.5 Flash** models to handle heavy multimodal visual tasks, smart predictions, and clinical heuristics.

*   **Forecasting Engine**: Processes raw inventory telemetry lists (`[{ name, count, safetyLimits }]`) and applies calendar-based regional seasonal parameters (flu seasons, monsoons, heatwaves) to output structured reorder recommendations.
*   **Visual Supply Scanner**: Scans high-resolution image arrays, isolates label bounds, extracts vital text blocks (Batch number, expiry dates, medicine name, quantities), and returns structured JSON arrays.
*   **Data Masking Filter (HIPAA compliance)**: Re-evaluates extracted scanner strings to run regex-based scrubbing. It isolates and blacks out any Patient Health Information (PHI) like patient names or Rx serial numbers before logs hit local caching.

---

## 4. UI/UX Design System & Theme Elements

The app features a unified, highly aesthetic visual design suited for stressful medical environments.

### Core Color Palette:
| Token Name | Light Mode Hex | Dark Mode Hex | Purpose |
| :--- | :--- | :--- | :--- |
| **Primary** | `#0f172a` (Slate 900) | `#f8fafc` (Slate 50) | Primary typography, headers |
| **Secondary** | `#0f766e` (Teal 700) | `#14b8a6` (Teal 500) | Active state buttons, tabs |
| **Background**| `#f8fafc` (Slate 50) | `#020617` (Slate 950) | Main canvas background |
| **Container** | `#ffffff` (White) | `#0f172a` (Slate 900) | Cards, panels, input boxes |
| **Indicator** | `#10b981` (Emerald 500)| `#10b981` (Emerald 500)| Stable logs, active markers |

### Typography Hierarchy:
*   **Primary Fonts**: **Outfit** (Primary UI Headers, telemetry statistics, large counters) and **Inter** (Structured body text, forms, logs table).
*   **Font Weights**: `font-light` (300) for descriptions, `font-medium` (500) for data outputs, `font-bold` (700) / `font-black` (900) for telemetry actions.

### Design Elements & Micro-Animations:
*   **Glassmorphism Modals**: Prompts and user selectors utilize `backdrop-blur-md` overlays with semi-transparent border lines (`border-outline-variant/30`) to build high-end layering.
*   **Transitions**: Fluid animation transitions (`transition-all duration-200`) on all buttons, selectors, and state shifts.
*   **Simulated Actions**: Framing overlays use scanning laser sweeps (`animate-[shimmer_1.5s_infinite]`) to visual AI calculations.
