    import { createBrowserRouter, Navigate } from 'react-router-dom';
    import HomePage from '../pages/HomePage';
    import MainLayout from '../layouts/MainLayout';
    import AuthLayout from '../layouts/AuthLayout';
    import LoginPage from '../pages/auth/LoginPage';
    import SignupPage from '../pages/auth/SignupPage';
    import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
    import InformationPage from '../pages/profile/InformationPage';
    import LikedPlacesPage from '../pages/profile/LikedPlacesPage';
    import LikedCollectionsPage from '../pages/profile/LikedCollectionsPage';
    import CollectionPage from '../pages/collection/CollectionPage';
    import CollectionsDashboard from '../pages/collection/CollectionsDashboard';
    import CollectionTest from '../components/test/CollectionTest';
    import { RequireAuth } from '../components/auth/ProtectedRoute';

    export const router = createBrowserRouter([
    {
        path: '/',
        element: <MainLayout />,
        children: [
        { path: '/', element: <HomePage /> },
        // Collections routes
        { path: '/collections', element: <CollectionsDashboard /> },
        { path: '/collections/:collectionId', element: <CollectionPage /> },
        // Test route for Collection Service
        { path: '/test/collection', element: <CollectionTest /> },
        // Protected profile routes
        {
          path: '/account/information',
          element: (
            <RequireAuth>
              <InformationPage />
            </RequireAuth>
          )
        },
        {
          path: '/account/liked-places',
          element: <Navigate to="/account/information" replace />
        },
        // Redirect old routes
        {
          path: '/account/profile',
          element: <Navigate to="/account/information" replace />
        },
        {
          path: '/account/mystay',
          element: <Navigate to="/account/information" replace />
        },
        {
          path: '/account/liked-collections',
          element: (
            <RequireAuth>
              <LikedCollectionsPage />
            </RequireAuth>
          )
        },
        {
          path: '/account/savedlist',
          element: <Navigate to="/account/liked-collections" replace />
        }
        ]
    },
    {
        path: '/auth',
        element: <AuthLayout />,
        children: [
        { path: 'login', element: <LoginPage /> },
        { path: 'signup', element: <SignupPage /> },
        { path: 'forgot-password', element: <ForgotPasswordPage /> },
        // Add more auth routes here
        // { path: 'reset-password', element: <ResetPasswordPage /> }
        ]
    }
    ]);
