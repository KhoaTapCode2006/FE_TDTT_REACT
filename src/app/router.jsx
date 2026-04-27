
    import { createBrowserRouter } from 'react-router-dom';
    import HomePage from '../pages/HomePage';
    import CollectionPage from '../pages/CollectionPage';
    import MainLayout from '../layouts/MainLayout';

    export const router = createBrowserRouter([
    {
        path: '/',
        element: <MainLayout />,
        children: [
        { path: '/', element: <HomePage /> },
        { path: '/collections/:collectionId', element: <CollectionPage /> }
        ]
    }
    ]);

