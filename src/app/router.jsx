    import { createBrowserRouter } from 'react-router-dom';
    import HomePage from '../pages/HomePage';
    import MainLayout from '../layouts/MainLayout';
    import AuthLayout from '../layouts/AuthLayout';
    import LoginPage from '../pages/auth/LoginPage';
    import SignupPage from '../pages/auth/SignupPage';
    import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
    import { RequireAuth } from '../components/auth/ProtectedRoute';

    export const router = createBrowserRouter([
    {
        path: '/',
        element: <MainLayout />,
        children: [
        { path: '/', element: <HomePage /> },
        // Add protected routes here in the future
        // {
        //   path: '/profile',
        //   element: (
        //     <RequireAuth>
        //       <ProfilePage />
        //     </RequireAuth>
        //   )
        // }
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
