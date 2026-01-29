# Aarogya Sahayak - Digital Health Companion

A comprehensive Progressive Web App (PWA) for healthcare management, featuring vitals tracking, health worker connectivity, and personalized wellness guidance.

## 🌟 Features

- **Smart Onboarding**: Personalized health profile setup
- **Vitals Tracking**: Monitor blood glucose, blood pressure, and weight with AI-powered risk assessment
- **Health Reminders**: Smart medication and checkup reminders with local storage
- **ASHA Worker Connect**: Direct access to certified health workers with call/message functionality
- **Multilingual Health Feed**: Personalized wellness content in English and Hindi with audio support
- **Responsive Design**: Mobile-first design that works beautifully on all devices

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS with custom healthcare design system
- **UI Components**: shadcn/ui with custom healthcare themes
- **Routing**: React Router v6
- **Internationalization**: react-i18next (English + Hindi)
- **Charts**: Recharts for vitals visualization
- **State Management**: React Context + Local Storage
- **API**: Integration with health risk prediction service

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm

### Installation

```bash
# Clone the repository
git clone <YOUR_GIT_URL>
cd aarogya-sahayak

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:8080`

### Build for Production

```bash
# Create production build
npm run build

# Preview production build
npm run preview
```

## 🎨 Design System

The app uses a comprehensive healthcare-focused design system with:

- **Primary Colors**: Medical teal (#059669) with accessibility-compliant contrast ratios
- **Typography**: Clean, readable fonts optimized for healthcare content
- **Components**: Custom shadcn/ui components with healthcare-specific variants
- **Responsive**: Mobile-first design with desktop adaptations
- **Dark Mode**: Full dark mode support with healthcare-appropriate colors

## 📱 Pages & Features

### 1. Home Page (`/`)
- Hero section with feature highlights
- Quick access to all main features
- Responsive design with healthcare imagery

### 2. Onboarding (`/onboarding`)
- User profile setup form
- Health condition selection
- Language preference (EN/HI)
- ASHA worker ID linking

### 3. Vitals Tracking (`/vitals`)
- Daily vitals logging (glucose, BP, weight)
- Interactive charts showing health trends
- AI-powered risk assessment via external API
- BMI calculation and display

### 4. Reminders (`/reminders`)
- Create and manage health reminders
- Categories: Medication, Checkups, Exercise
- Frequency settings (daily/weekly/monthly)
- Local storage persistence

### 5. Health Worker Connect (`/connect`)
- Directory of ASHA workers with profiles
- Direct calling functionality (`tel:` links)
- Messaging interface (demo implementation)
- Status indicators (available/busy/offline)

### 6. Health Feed (`/feed`)
- Categorized health content (Diet, Exercise, Tips)
- Multilingual content based on user preference
- Audio playback interface (demo)
- Tag-based content organization

## 🌐 Internationalization

Full i18n support with:
- English and Hindi translations
- Dynamic language switching
- Localized content in Health Feed
- RTL-ready design system

## 💾 Data Storage

- **Local Storage**: User profiles, vitals, reminders
- **Session Storage**: Temporary data and preferences
- **Context API**: Global state management
- **API Integration**: Risk prediction service at `https://health-uxaj.onrender.com/predict_risk`

## 🔌 API Integration

### Risk Prediction API
```javascript
POST https://health-uxaj.onrender.com/predict_risk
Content-Type: application/json

{
  "glucose": 120,
  "bp": 130,
  "bmi": 22.5
}
```

Response includes risk score and classification (low/moderate/high).

## 📋 TODO Items for Production

- [ ] Push notifications for reminders
- [ ] Real-time messaging with ASHA workers
- [ ] Audio file storage and streaming
- [ ] Backend user authentication
- [ ] Data synchronization across devices
- [ ] Offline functionality with service workers
- [ ] Analytics and health insights dashboard

## 🚀 Deployment

Ready for deployment to:
- **Netlify**: Drag and drop the `dist` folder
- **Vercel**: Connect GitHub repository for automatic deployments
- **Firebase Hosting**: Use Firebase CLI for deployment

### Environment Variables

For production deployment, consider adding:
```env
VITE_API_BASE_URL=https://your-api-endpoint.com
VITE_ENVIRONMENT=production
```

## 📱 PWA Features

- Responsive design optimized for mobile devices
- Healthcare-focused theme colors and branding
- Fast loading with Vite optimization
- Ready for PWA manifest and service worker integration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Contact the development team
- Check the documentation for common solutions

---

**Built with ❤️ for digital healthcare accessibility**