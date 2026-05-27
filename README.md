# Booking4LU - Hotel Booking Application

A modern hotel booking application built with React, Vite, and Firebase Authentication, integrated with a backend REST API for profile and data management.

## Features

- 🔐 Firebase Authentication (Email/Password, Google, Facebook)
- 👤 User Profile Management via REST API
- 🗺️ Interactive Map with Hotel Listings
- ⭐ Favorites and Collections
- 📱 Responsive Design
- 🔄 Real-time Data Synchronization

## Tech Stack

- **Frontend**: React 18, Vite
- **Authentication**: Firebase Authentication
- **API**: REST API Backend
- **Maps**: VietMap
- **Styling**: Tailwind CSS
- **State Management**: React Context API

## Environment Configuration

### Required Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
# Firebase Configuration (Authentication)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Backend API Configuration
VITE_LOCAL_API=https://api.yourdomain.com/

# Development Environment
NODE_ENV=development
```

### Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication methods:
   - Email/Password
   - Google OAuth
   - Facebook OAuth
3. Copy your Firebase configuration to the `.env` file
4. Ensure Firebase Authentication is properly configured

### Backend API Setup

The application requires a backend REST API with the following endpoints:

- `POST /auth` - Authenticate with Firebase token
- `GET /me` - Get current user profile
- `PATCH /me` - Update current user profile
- `DELETE /me` - Delete user profile
- `GET /users/{username}` - Get public user profile
- `POST /me/liked-collection` - Add liked collection
- `DELETE /me/liked-collection` - Remove liked collection

Set the `VITE_LOCAL_API` environment variable to your backend API URL.

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Firebase account
- Backend API server running

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd FE_TDTT_REACT
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables (see Environment Configuration above)

4. Start the development server:
```bash
npm run dev
```

5. Open your browser and navigate to `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── app/                    # App configuration and routing
├── assets/                 # Static assets (images, styles)
├── components/             # React components
│   ├── auth/              # Authentication components
│   ├── hotel/             # Hotel-related components
│   ├── map/               # Map components
│   ├── profile/           # Profile components
│   └── ui/                # Reusable UI components
├── config/                 # Configuration files
│   └── firebase.js        # Firebase configuration
├── contexts/               # React contexts
│   └── AuthContext.jsx    # Authentication context
├── pages/                  # Page components
├── services/               # Service modules
│   ├── api/               # API client
│   ├── authentication/    # Authentication services
│   └── profile/           # Profile services
└── utils/                  # Utility functions

```

## Authentication Flow

1. User authenticates with Firebase (Email/Password, Google, or Facebook)
2. Frontend obtains Firebase ID token
3. Frontend sends ID token to backend `/auth` endpoint
4. Backend validates token and returns user profile data
5. Frontend stores session data in localStorage
6. All subsequent API requests include the Firebase ID token in Authorization header

## Profile Management

User profiles are managed through the backend REST API:

- Profile data is stored in the backend database
- All profile operations (get, update, delete) go through the API
- Firebase is used only for authentication
- Session persistence allows users to stay logged in across browser sessions

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
