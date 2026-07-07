# Technical Documentation: AI Forecasting & Scanning Systems

This document provides a comprehensive overview of the technologies, architecture, and core components driving the **Smart Stock Predictor** (AI Forecasting) and the **Optical/Voice Scanner** systems in HealthLink Daily.

---

## 1. AI Forecasting & Prediction (`Smart Stock Predictor`)

The forecasting module predicts seasonal medicine demands, calculates inventory depletion timelines, and generates intelligent stock buffer suggestions.

### Core Technology Stack
*   **Primary Engine**: **Google Gemini AI** (using the `gemini-1.5-flash` or `gemini-2.0-flash` models).
*   **SDK/Connection**: Client-side `@google/generative-ai` SDK initialized dynamically with Firebase-injected or environment-configured API keys.
*   **Fallback Engine**: An in-browser rule-based forecasting simulator that activates when offline, sandboxed, or if API keys are unconfigured.

### System Architecture & Data Flow
```
[Current Stock Items] + [Critical Thresholds]
                     │
                     ▼
  [Generative AI System Prompt Construction]
                     │ (Secure Client API Call)
                     ▼
  [Google Gemini API (gemini-1.5-flash)]
                     │ (JSON Schema-constrained generation)
                     ▼
     [Logistics Insight & Recommendations]
```

### Core Components & Logic
*   **Contextual Safety Prompting**: The system builds a structured prompt containing the current active inventory levels and their critical limits. It instructs the LLM to output a strictly validated JSON structure:
    ```json
    {
      "predictions": [
        {
          "name": "Medicine Name",
          "demandLevel": "High | Medium | Low",
          "daysRemaining": 14,
          "reason": "Depletion rate warning...",
          "action": "Immediate reorder..."
        }
      ],
      "generalAdvice": "Overall advisory note..."
    }
    ```
*   **Bilingual Adaptability**: The AI-generated insights are displayed alongside localized translations to accommodate both Hindi and English users.
*   **Sandbox Predictor (Local Fallback)**:
    *   Calculates a daily consumption rate simulation.
    *   Identifies critical thresholds mathematically.
    *   Injects seasonal influenza variables based on current local calendar month factors.

---

## 2. Label Scanning System (OCR & Visual Telemetry)

The optical scanning module allows users to scan medicine containers or prescription logs using device cameras to register stock changes automatically.

### Core Technology Stack
*   **Camera Interface**: HTML5 WebRTC Media Capture API (`navigator.mediaDevices.getUserMedia`) with cross-browser safety fallbacks.
*   **Vision Engine**: Client-side Google Gemini Vision (`gemini-1.5-flash` multimodal input).
*   **Fallback OCR**: Mock canvas OCR pattern matching.

### Core Components & Logic
*   **Live Video Canvas Grab**:
    *   Grabs the active video frame from the camera stream using `HTMLVideoElement`.
    *   Converts the frame to a compressed JPEG Base64 blob using `HTMLCanvasElement.toDataURL('image/jpeg', 0.85)`.
*   **Visual Data Analysis (Gemini Multimodal)**:
    *   The JPEG blob is sent to Gemini Vision alongside a instructions to scan and parse labels:
        > *"Extract: 1. Medicine Name, 2. Batch Number, 3. Expiry Date (MM/YYYY), 4. Packaging Type (drip/vial/box/tablet), 5. Quantity. Output ONLY clean JSON."*
    *   Saves the extracted parameters to the **Saved Medicine Scan List** (local Firestore database).

---

## 3. Voice Input & Speech Telemetry

Hands-free command entry allows medical personnel to log inventory adjustments verbally.

### Core Technology Stack
*   **Speech Recognizer**: Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`).

### Core Components & Logic
*   **Bilingual Speech-to-Text**: Automatically switches language capture context (`en-US` or `hi-IN`) depending on the user's active interface language.
*   **Natural Language Parse Engine**:
    *   Extracts numbers using regex patterns (matching English digits and Devnagari words like "दस", "बीस", "पचास").
    *   Performs string keyword mapping to match coordinates against local health center presets:
        *   `Najafgarh` $\rightarrow$ Coordinates: `28.6131° N, 76.9861° E`
        *   `Mansa Ram Park` $\rightarrow$ Coordinates: `28.6224° N, 77.0562° E`
        *   `Palam Village` $\rightarrow$ Coordinates: `28.5889° N, 77.0831° E`
        *   `Aya Nagar` $\rightarrow$ Coordinates: `28.4812° N, 77.1354° E`
