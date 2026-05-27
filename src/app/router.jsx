    import { createBrowserRouter, Navigate } from 'react-router-dom';
    import HomePage from '../pages/HomePage';
    import IntroPage from '../pages/IntroPage';
    import MainLayout from '../layouts/MainLayout';
    import AuthLayout from '../layouts/AuthLayout';
    import LoginPage from '../pages/auth/LoginPage';
    import SignupPage from '../pages/auth/SignupPage';
    import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
    import ProfilePage from '../pages/profile/ProfilePage';
    import MyStaysPage from '../pages/profile/MyStaysPage';
    import SavedListsPage from '../pages/profile/SavedListsPage';
    import AccountCollectionsPage from '../pages/profile/AccountCollectionsPage';
    import CollectionPage from '../pages/CollectionPage';
    import TripPage from '../pages/TripPage';
    import GroupChatPage from '../pages/GroupChatPage';
    import InformationPage from '../pages/profile/InformationPage';
    import LikedPlacesPage from '../pages/profile/LikedPlacesPage';
    import LikedCollectionsPage from '../pages/profile/LikedCollectionsPage';
    import CollectionPage from '../pages/collection/CollectionPage';
    import CollectionsDashboard from '../pages/collection/CollectionsDashboard';
    import { RequireAuth } from '../components/auth/ProtectedRoute';

    export const router = createBrowserRouter([
    {
        path: '/',
        element: <MainLayout />,
        children: [
        { path: '/intro', element: <IntroPage /> },
        { path: '/', element: <HomePage /> },
        // Collections routes
        { path: '/collections', element: <CollectionsDashboard /> },
        { path: '/collections/:collectionId', element: <CollectionPage /> },
        // Trip & Chat routes
        { path: '/trips', element: <TripPage /> },
        { path: '/chat', element: <GroupChatPage /> },
        // Redirect shortcuts
        { path: '/profile', element: <Navigate to="/account/profile" replace /> },
        { path: '/mystay', element: <Navigate to="/account/mystay" replace /> },
        { path: '/savedlist', element: <Navigate to="/account/savedlist" replace /> },
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
