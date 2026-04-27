
    import { createBrowserRouter } from 'react-router-dom';
    import HomePage from '../pages/HomePage';
    import MainLayout from '../layouts/MainLayout';

    export const router = createBrowserRouter([
    {
        path: '/',
        element: <MainLayout />,
        children: [
        { path: '/', element: <HomePage /> }
        ]
    }
    ]);

