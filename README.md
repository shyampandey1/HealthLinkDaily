<div align="center">
  <h1>🏥 Smart Health Link / HealthLink Daily</h1>
  <p>A next-generation medical supply and primary care tracking platform</p>
  <p>
    <a href="https://smart-healthlink-2026.web.app"><strong>View Live Demo »</strong></a>
  </p>
</div>

<br />

## 🌟 Overview
HealthLink Daily is an advanced web application designed to manage medical supplies, hospital staff, and patient records with a modern, dynamic UI. The application leverages Google Firebase for real-time authentication and database management, and integrates with Google AI/Gemini for advanced diagnostics.

## 🚀 Key Features
- **Firebase Authentication**: Integrated Google Sign-In with automatic Firestore profile mapping, bypassing duplicate registration errors.
- **Role-Based Registrations**: Multi-tiered system supporting Hospital Admins, Clinic Workers, and Patients.
- **Dynamic Radar & Hotspots**: Interactive SVG radar grid for visual supply monitoring.
- **Real Google Maps Integration**: Click on any radar pin to seamlessly load an interactive, real-world Google Map of the selected coordinates.
- **Modern UI & Theming**: Built with Tailwind CSS v4 featuring flawless Dark/Light mode toggling with glassmorphism micro-interactions.
- **Real-Time Database**: Powered by Firebase Firestore for robust patient and inventory data tracking.

## 🛠️ Technology Stack
- **Frontend**: React, TypeScript, Vite
- **Styling**: Tailwind CSS v4, Framer Motion (Animations), Lucide React (Icons)
- **Backend/Services**: Firebase Auth, Firebase Firestore, Firebase Hosting
- **AI**: Google Gemini AI (via `@google/genai` API)

## 🌐 Live Deployment
This project is automatically deployed and hosted natively on Firebase Hosting.
- **Primary URL**: [https://smart-healthlink-2026.web.app](https://smart-healthlink-2026.web.app)
- **Alternate URL**: [https://smart-healthlink-2026.firebaseapp.com](https://smart-healthlink-2026.firebaseapp.com)

## 💻 Run Locally

**Prerequisites:** Node.js (v18+)

1. Clone the repository:
   ```bash
   git clone https://github.com/shyampandey1/HealthLinkDaily.git
   cd HealthLinkDaily
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   Create a `.env` file in the root directory and add your Firebase and Gemini credentials:
   ```env
   VITE_FIREBASE_API_KEY="your-api-key"
   VITE_FIREBASE_AUTH_DOMAIN="your-auth-domain"
   VITE_FIREBASE_PROJECT_ID="your-project-id"
   VITE_FIREBASE_STORAGE_BUCKET="your-storage-bucket"
   VITE_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
   VITE_FIREBASE_APP_ID="your-app-id"
   VITE_GEMINI_API_KEY="your-gemini-key"
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

## 📦 Deploying to Firebase
The project is completely pre-configured for instant deployment with `firebase.json` and `.firebaserc`.

```bash
# 1. Build the production application
npm run build

# 2. Deploy to Firebase Hosting
npx firebase deploy --only hosting
```
