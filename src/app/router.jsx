    import { createBrowserRouter, Navigate } from 'react-router-dom';
    import HomePage from '../pages/HomePage';
    import MainLayout from '../layouts/MainLayout';
    import AuthLayout from '../layouts/AuthLayout';
    import LoginPage from '../pages/auth/LoginPage';
    import SignupPage from '../pages/auth/SignupPage';
    import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
    import ProfilePage from '../pages/profile/ProfilePage';
    import MyStaysPage from '../pages/profile/MyStaysPage';
    import SavedListsPage from '../pages/profile/SavedListsPage';
    import LikedCollectionsPage from '../pages/profile/LikedCollectionsPage';
    import AccountCollectionsPage from '../pages/profile/AccountCollectionsPage';
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
          path: '/account/profile',
          element: (
            <RequireAuth>
              <ProfilePage />
            </RequireAuth>
          )
        },
        {
          path: '/account/mystay',
          element: (
            <RequireAuth>
              <MyStaysPage />
            </RequireAuth>
          )
        },
        {
          path: '/account/savedlist',
          element: (
            <RequireAuth>
              <Navigate to="/account/liked-collections" replace />
            </RequireAuth>
          )
        },
        {
          path: '/account/liked-collections',
          element: (
            <RequireAuth>
              <LikedCollectionsPage />
            </RequireAuth>
          )
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
