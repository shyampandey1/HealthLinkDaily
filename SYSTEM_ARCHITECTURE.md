# Comprehensive System Architecture & Technical Specifications

This reference document outlines the complete architectural blueprints, software design patterns, full-stack technology choices, Google Cloud Vertex AI pipelines, and UI/UX design tokens for the **HealthLink Daily** application.

---

## 1. High-Level Architectural Design

HealthLink Daily is architected as an offline-first, client-driven Progressive Web Application (PWA). It leverages a decoupled, serverless backend to sync active clinic logs and delegates processor-heavy AI workloads (such as OCR analysis and forecasting calculations) directly to Google Cloud Vertex AI.

```
                  ┌────────────────────────────────────────────────────────┐
                  │                 CLIENT LAYER (Browser)                 │
                  │                                                        │
                  │   ┌────────────────┐  ┌──────────────┐  ┌──────────┐   │
                  │   │   App.tsx      │  │ LocalStorage │  │ Canvas & │   │
                  │   │ (State Engine) │  │  (Session)   │  │  Speech  │   │
                  │   └───────┬────────┘  └──────────────┘  └────┬─────┘   │
                  └───────────┼──────────────────────────────────┼─────────┘
                              │                                  │
             ┌────────────────┴───────────────┐                  │ (Media Data)
             ▼ (Secure API Handshakes)        ▼ (Authentication)  │
  ┌───────────────────────┐       ┌───────────────────────┐      │
  │   Google Vertex AI    │       │   Firebase Services   │      │
  │  (Gemini 3.5 Flash)   │       │ Firestore • Firebase  │      │
  └──────────┬────────────┘       │       Auth            │      │
             │                    └───────────────────────┘      │
             │                                                   │
             └───────────────────────────────────────────────────┘
```

### Architectural Pillars:
1.  **State Centralization (Data Orchestrator Pattern)**:
    The application's lifecycle is managed in [App.tsx](file:///home/shyamp028/Desktop/Workspace/Smart%20Health%20Link/remix_-healthlink-daily/src/App.tsx). All database records (inventory stock, patients roster, staff schedules, and hotspots coordinates) are held in state at this level and distributed down to visual presentation components.
2.  **Edge Execution & Local Fallbacks**:
    To maintain maximum operational capability in remote rural health centers, the visual parsing and logistics forecasting modules run offline rule-based sandbox calculators automatically if connection to Google Cloud services is lost.
3.  **Low Latency Handshakes**:
    The client establishes direct connections to Firebase Hosting edge nodes and Vertex AI endpoints, keeping request overhead low and preventing bottleneck relays.

---

## 2. Core Technology Stack Reference

### 2.1 Web Presentation & Bundling
*   **User Interface Framework**: **React 18** (Functional components utilizing React hooks like `useState`, `useEffect`, `useRef`, and `useMemo` for optimized rendering cycles).
*   **Compilation & Build Bundler**: **Vite 6** (Configured with lightning-fast Hot Module Replacement and Rollup compiler pipelines to minimize final asset footprints).
*   **Strict Typing Layer**: **TypeScript** (Enforces typing interfaces for all inventory metrics, coordinate arrays, and user roles).

### 2.2 Telemetry Map Integration
*   **Map Renderer**: **Leaflet** paired with **React Leaflet** (`react-leaflet`).
*   **Visual Tile Servers**: Custom Leaflet `TileLayer` integrations pulling high-definition maps from Google Maps servers:
    *   *Standard View*: `https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}` (Google Vector Maps).
    *   *Satellite View*: `https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}` (Google Hybrid Imagery).
*   **Coordinate Bounds Math**: Translates raw GPS markers into coordinate representations mapped to local boundaries (Delhi NCR Region: Latitudes `[28.30, 28.95]`, Longitudes `[76.50, 77.50]`).

### 2.3 Browser API Implementations
*   **Speech Recognition**: Browser-native **Web Speech SpeechRecognition API** (safely mapping to `webkitSpeechRecognition` for Chrome and Safari runtimes).
*   **Media Devices Stream**: HTML5 WebRTC Media Capture API (`navigator.mediaDevices.getUserMedia`) to query and access front- or back-facing device cameras for instant document scanning.

---

## 3. Vertex AI & Gemini 3.5 Flash Subsystems

The primary cognitive capabilities of the application are powered by **Gemini 3.5 Flash** models deployed within **Google Cloud Vertex AI** containers. This infrastructure operates across three main components:

### 3.1 Smart Stock Predictor (Forecasting Engine)
The forecasting engine evaluates the stock levels and generates safety recommendations based on seasonal factors.
*   **Prompt Construction**: The application compiles the active inventory array into a safety prompt context.
*   **Contextual Parameters**: The model is instructed to consider localized environmental variables (such as Delhi NCR monsoon spikes, summer heatstrokecase admissions, and winter influenza peaks).
*   **Strict JSON Response Constraints**: The API payload contains instruction sets forcing Gemini to output a parser-safe JSON block:
    ```json
    {
      "predictions": [
        {
          "name": "NaCl 0.9% Normal Saline",
          "demandLevel": "High | Medium | Low",
          "daysRemaining": 15,
          "reason": "Intravenous cases historically spike 30% during local heatwaves.",
          "action": "Consider pre-ordering a secondary buffer of drips."
        }
      ],
      "generalAdvice": "Logistics warning note for the medical staff..."
    }
    ```

### 3.2 Medical Supply Scanner (Vision OCR & Scrubber)
The visual scanner parses labels on medicine packages, glucose drips, and bandage boxes.
*   **Frame Grabber**: The scanner draws the active camera feed buffer onto an HTML5 Canvas, downsamples the quality to `0.85`, and converts it to an `image/jpeg` Base64 data string.
*   **Multimodal API Request**: The Base64 string is sent directly to the Gemini 3.5 Flash vision endpoint.
*   **Extracted Fields**: The model is instructed to return structured details:
    *   `medicationName` (Name of medicine/supply)
    *   `dosage` (Strength/volume, e.g., `500ml`, `10mg`)
    *   `quantity` (Total item count)
    *   `category` (Tablets, Drips, Consumables)
    *   `expiryDate` & `batchNumber`
*   **HIPAA Scrubbing Guard**: A secondary pipeline analyzes the returned JSON string for Protected Health Information (PHI) like patient names or prescription serials. These sensitive details are dynamically scrubbed, replacing them with a secure redaction tag (`[REDACTED_PATIENT_NAME]`) before committing the logs to the local or cloud database.

### 3.3 Natural Language Voice Telemetry
*   **Bilingual Swapper**: Dynamically switches locales (`en-US` and `hi-IN`) depending on the selected language mode.
*   **Command Parsing Regex**: Intercepts speech-to-text transcripts and extracts parameters via regex mapping (e.g. `add/increase [quantity] [item] at [location]`).
*   **Geospatial Preset Mapping**: Maps parsed location names to coordinates:
    *   *Najafgarh*: `28.6131° N, 76.9861° E`
    *   *Mansa Ram Park*: `28.6224° N, 77.0562° E`
    *   *Palam Village*: `28.5889° N, 77.0831° E`
    *   *Aya Nagar*: `28.4812° N, 77.1354° E`

---

## 4. UI/UX Design System & Layout Tokens

The user interface follows a modern medical telemetry style, optimized for low cognitive strain under high-stress clinical conditions.

### 4.1 Design Tokens & Colors
The design utilizes a curated palette built on slate and teal, ensuring high readability in both light and dark mode toggles:

*   **Primary Text**: Light mode: Slate 900 (`#0f172a`), Dark mode: Slate 50 (`#f8fafc`).
*   **Theme Highlights / Selectors**: Slate 700 / Teal 700 (`#0f766e`) on light layouts, Teal 500 (`#14b8a6`) on dark layouts.
*   **Stable Indicators**: Emerald 500 (`#10b981`) represents stable inventory stock and normal patient statuses.
*   **Warning Indicators**: Amber 500 (`#f59e0b`) represents low inventory buffer ranges.
*   **Critical Alerts**: Red 500 (`#ef4444`) / Rose 500 represents depleted stock levels or low safety limits.

### 4.2 Typography System
*   **Headers & Titles**: **Outfit** (A geometric sans-serif font imported from Google Fonts, utilized for large telemetry statistics, page titles, and main counters).
*   **Body & Form Inputs**: **Inter** (A highly legible, workhorse sans-serif font optimized for small text tables, labels, and input fields).

### 4.3 Responsive Layout Adaptability
*   **Breakpoint Transitions**: Built with mobile-first layouts changing styling boundaries at standard Tailwind breakpoints (`md: 768px`, `lg: 1024px`).
*   **Mobile Formats**: Displays a compact bottom navigation bar (`BottomNav.tsx`) and full-screen overlay panels (`ClinicInfoModal.tsx`).
*   **Desktop Formats**: Displays an expansive left sidebar dashboard configuration (`App.tsx`) with grid-based item cards and map-on-left/scans-on-right panels.
*   **Micro-Animations**: Uses subtle pulsing indicator loops (`animate-pulse`), spinning loading icons (`animate-spin-slow`), and glassmorphic card loading overlays to enrich interactions.
