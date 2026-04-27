<<<<<<< HEAD
import { Routes, Route, createBrowserRouter } from "react-router-dom";


export default function AppRouter() {
  return (
    <Routes>
    </Routes>
  );
}
=======
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
>>>>>>> fe_phase_1_2
