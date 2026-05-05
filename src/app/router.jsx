import { createBrowserRouter } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import MainLayout from '../layouts/MainLayout';
import AuthLayout from '../layouts/AuthLayout';
import CollectionPage from '../pages/CollectionPage';
import LoginPage from '../pages/auth/LoginPage';
import SignupPage from '../pages/auth/SignupPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import MyStaysPage from '../pages/profile/MyStaysPage';
import SavedListsPage from '../pages/profile/SavedListsPage';
import AccountCollectionsPage from '../pages/profile/AccountCollectionsPage';
import { RequireAuth } from '../components/auth/ProtectedRoute';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      // Route này từ bản code sáng nay của Huy
      { path: 'collections/:collectionId', element: <CollectionPage /> }, 
      
      // Các route bảo mật từ bản code của bạn Huy
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
            <SavedListsPage />
          </RequireAuth>
        )
      },
      {
        path: '/account/collections',
        element: (
          <RequireAuth>
            <AccountCollectionsPage />
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
      { path: 'forgot-password', element: <ForgotPasswordPage /> }
    ]
  }
]);