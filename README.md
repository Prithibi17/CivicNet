# CivicNet

CivicNet is a comprehensive civic tech platform that empowers citizens to report local infrastructure issues (like potholes, water leakages, and broken streetlights) and tracks them through to resolution. It streamlines the reporting process by leveraging AI for automated classification, severity assessment, and duplicate detection, while utilizing a community-driven verification system.

## 🌟 Features

- **Automated AI Issue Classification**: Automatically categorizes reports (e.g., Road Damage, Water Leakage, Sanitation) based on title and description using the Gemini API.
- **Smart Priority & Severity Scoring**: Calculates issue severity and a dynamic priority score taking into account duplicate reports, urgency, and automated analytics.
- **Duplicate Detection**: Identifies potential duplicate reports based on geographic proximity and semantic similarity to prevent spam and link related issues.
- **Community Verification System**: Trusted verifiers (authorities, community champions) can review and confirm issues. Verifier weight dynamically adjusts based on trust scores.
- **Gamification & Trust Scores**: Citizens earn points and badges for reporting and verifying. A trust score system ensures high-quality reports.
- **Interactive Maps & Analytics**: View reported issues on a map interface (Leaflet) and see analytics (Recharts).
- **Role-Based Access**: Specialized views and capabilities for Citizens, Verifiers, Authorities, and Admins.

## 🛠 Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS 4, Lucide React, Motion (Framer Motion), Leaflet (Maps), Recharts (Charts)
- **Backend**: Express.js, Node.js (TSX for execution), Firebase, Google GenAI SDK
- **Database**: Local JSON DB layer with Firebase Sync

## 🚀 Getting Started

### Prerequisites
- Node.js (v22+)
- Firebase Project setup
- Gemini API Key

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Configuration:**
   Copy `.env.example` to `.env` (or `.env.local`) and configure your API keys:
   ```env
   GEMINI_API_KEY=your_gemini_api_key
   ```
   Ensure `firebase-applet-config.json` is correctly set up for Firebase synchronization.

3. **Run the Application locally:**
   ```bash
   npm run dev
   ```
   This will start both the Express backend and the Vite frontend simultaneously.

4. **Build for Production:**
   ```bash
   npm run build
   ```

## 📂 Project Structure

- `server.ts` - Express backend server with core API endpoints, auth, and logic handling.
- `src/ai-logic.ts` - Google Gemini integration for classification, severity, duplication logic.
- `src/db.ts` - Data access layer handling reads/writes and Firebase syncing.
- `src/shared-types.ts` - Core TypeScript interfaces (Issue, User, Verification, Notification, etc.).

## 📜 License
This project is open-source.
