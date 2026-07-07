# Technical Documentation: Vertex AI Forecasting & Scanning Systems

This document provides a comprehensive, high-fidelity technical description of the artificial intelligence architecture powering HealthLink Daily. Specifically, it details the **Vertex AI Smart Stock Predictor** (Forecasting Engine) and the **Optical/Voice Scanner** systems, all built using **Gemini 3.5 Flash** models deployed via Google Cloud Vertex AI infrastructure.

---

## 1. Vertex AI Forecasting & Prediction (`Smart Stock Predictor`)

The stock forecasting module leverages advanced generative AI models via Google Cloud Vertex AI to anticipate seasonal medicine demand, construct supply depletion timelines, and recommend reorder points for medical staff.

### Core Technology Stack
*   **AI Model Platform**: **Google Cloud Vertex AI** (incorporating the enterprise-grade **Gemini 3.5 Flash** foundation models).
*   **Hosting & Execution Environment**: Cloud Run deployed Node.js servers, connecting securely to Vertex AI API endpoints via Google APIs.
*   **Client SDK Connection**: Dynamic client-side wrapper leveraging the Google Vertex AI JavaScript SDK (`@google-cloud/vertexai` or `@google/generative-ai` API keys).
*   **Bilingual Translation Layer**: Localized layout templates in Hindi and English with bilingual prompts instructing the model to return contextual reasoning translated dynamically where appropriate.
*   **Fail-Safe Engine**: A client-side, rule-based simulator that computes basic daily consumption rates locally when connectivity to Vertex AI is severed.

### System Architecture & Data Flow
```
 ┌──────────────────────┐      ┌───────────────────────────┐      ┌──────────────────────┐
 │ Current Stock Levels │ ───> │ Vertex AI System Prompt   │ ───> │ Google Vertex AI API │
 │ & Critical Threshold │      │ (Contextual Safety Rules) │      │ (Gemini 3.5 Flash)   │
 └──────────────────────┘      └───────────────────────────┘      └──────────┬───────────┘
                                                                             │ Secure JSON Return
                                                                             ▼
 ┌──────────────────────┐      ┌───────────────────────────┐      ┌──────────────────────┐
 │ Synchronized Stock   │ <─── │ JSON Schema Verification  │ <─── │ Model Recommendations│
 │ Cache Update & Alert │      │ (Strict Schema Constraints│      │ (Insight + Actions)  │
 └──────────────────────┘      └───────────────────────────┘      └──────────────────────┘
```

### Core Components & Logic
*   **Structured Constraint Generation**: System instructions force the model to evaluate the inventory dataset (`[{ name, count, criticalThreshold, category, unit }]`) and format its analysis in a highly structured, validated JSON response matching the following schema definition:
    ```json
    {
      "predictions": [
        {
          "name": "Elastic Adhesive Bandages",
          "demandLevel": "High | Medium | Low",
          "daysRemaining": 12,
          "reason": "Increased wound-care intake expected with seasonal monsoon humidity.",
          "action": "Immediate reorder recommended to restore safety buffer."
        }
      ],
      "generalAdvice": "Clinical Logistics Notice: Critical stock levels detected for Ringer's Lactate and Bandages. Restock immediately."
    }
    ```
*   **Epidemiological & Seasonal Trend Forecasting**: Gemini 3.5 Flash evaluates the supply names alongside geographical regional parameters (e.g. Haryana/Delhi NCR monsoon, hot weather, rural flu peaks) to predict demand spikes.
*   **Consumption Velocity Formula**: The model estimates the depletion curve ($T_{depletion} = \frac{Count}{Velocity_{daily}}$) by correlating available quantities against safety thresholds.

---

## 2. Optical Label & Package Scanning System (`Medical Supply Scanner`)

The scanner allows frontline clinical operators to capture images of incoming shipments, intravenous glucose drips, or bandage boxes to update database counts instantly.

### Core Technology Stack
*   **Multimodal Vision Engine**: **Vertex AI Gemini 3.5 Flash** (via high-speed image processing APIs).
*   **Web Camera API**: HTML5 WebRTC Media Capture API (`navigator.mediaDevices.getUserMedia`) providing cross-platform video rendering.
*   **OCR Preprocessing**: HTML5 Canvas pixel grabber that captures video frame buffers and compresses them into high-density Base64 JPG blobs.

### System Flow
1. **Frame Capture**: Canvas captures the image frame at $1920 \times 1080$ resolution.
2. **Base64 Encoding**: Compresses pixel arrays into `image/jpeg` format at `0.85` quality.
3. **Vertex AI Multimodal Request**: Sends the compressed image data directly to the Gemini 3.5 Flash endpoint alongside a localized prompt:
   > *"Extract: 1. Item/Medicine Name, 2. Batch Number, 3. Expiry Date (MM/YYYY), 4. Packaging Type (drip/vial/box/tablet), 5. Quantity. Output strictly in valid JSON format."*
4. **Data Redaction**: An automated regex scrubber detects and strips any potential Patient Health Information (PHI) before saving logs to Firebase Firestore.

---

## 3. Hands-Free Voice Telemetry & Speech Input

This component lets pharmacists adjust stock and register center markers verbally while handling heavy physical supply packages.

### Core Technology Stack
*   **Bilingual Speech-to-Text**: HTML5 Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`).
*   **Parsing Logic**: Specialized regex parser evaluating quantities and locations (supporting Devanagari numerals and Hindi command structures).
