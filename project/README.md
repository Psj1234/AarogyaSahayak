# Aarogya Sahayak - Healthcare PWA Frontend

A comprehensive healthcare Progressive Web App built for rural healthcare management, connecting patients with ASHA (Accredited Social Health Activist) workers.

## Features

- **Onboarding & Profile Management**: User registration with health conditions and ASHA worker assignment
- **Daily Vitals Tracking**: Blood sugar, blood pressure, and weight logging with trend visualization
- **Automated Reminders**: Medication and health checkup reminders with push notifications
- **Health Worker Connect**: Direct communication with assigned ASHA workers
- **Personalized Health Feed**: Localized health tips, diet recommendations, and exercise guidance
- **Multi-language Support**: English and Hindi with audio support
- **PWA Capabilities**: Offline functionality and push notifications

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS (mobile-first responsive)
- **Routing**: React Router v6
- **Charts**: Recharts for vitals visualization
- **Internationalization**: react-i18next
- **State Management**: React Context + Local Storage
- **PWA**: Service Worker for offline caching and push notifications

## Project Structure

```
src/
├── components/
│   ├── FeedCard.tsx          # Health feed card component
│   ├── LanguageSelector.tsx  # Language switching component
│   ├── VitalsChart.tsx       # Charts for vitals data
│   └── Layout.tsx            # Main layout wrapper
├── pages/
│   ├── Onboarding.tsx        # User onboarding and profile
│   ├── Vitals.tsx            # Daily vitals logging
│   ├── Reminders.tsx         # Medication reminders
│   └── HealthWorkerConnect.tsx # ASHA worker communication
├── contexts/
│   └── AppContext.tsx        # Global state management
├── i18n/
│   ├── index.ts             # i18n configuration
│   ├── en.json              # English translations
│   └── hi.json              # Hindi translations
├── types/
│   └── index.ts             # TypeScript type definitions
├── utils/
│   └── storage.ts           # Local storage utilities
├── data/
│   └── dummyData.ts         # Demo data for development
├── App.tsx                  # Main application component
└── main.tsx                 # Application entry point
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

## Backend Integration TODOs

The application is designed with clear separation between frontend and backend concerns. Key integration points:

1. **Authentication**: Replace local storage with JWT token management
2. **User Profile**: Connect to user management API endpoints
3. **Vitals Data**: Sync with healthcare database and analytics
4. **Push Notifications**: Integrate with notification service (Firebase/AWS SNS)
5. **ASHA Communication**: Connect to messaging and calling APIs
6. **Health Feed**: Fetch personalized content from content management system
7. **Data Sync**: Implement offline-first data synchronization

## PWA Features

- **Offline Functionality**: Service worker caches essential resources
- **Push Notifications**: Browser push API integration ready
- **App Install**: Web app manifest for home screen installation
- **Responsive Design**: Optimized for mobile-first usage

## Internationalization

- Support for English and Hindi languages
- Easy to extend for additional regional languages
- Audio support for accessibility (ready for TTS integration)

## Demo Data

The application comes pre-loaded with:
- 2 dummy ASHA workers
- 10 days of sample vital readings
- 3 sample health feed cards per day
- Sample reminder data

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

MIT License - Built for educational and demonstration purposes.