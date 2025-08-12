import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import './index.css'

import RootLayout from './routes/RootLayout';
import Body from './routes/Body';
//import AppLoader from './components/AppLoader';

import { API_BASE_URL } from '@/config';


const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    loader: async () => {
      const response = await fetch(`${API_BASE_URL}/default-values`);
      if (!response.ok) {
        throw new Response("Failed to fetch initial settings values from server.", {
          status: response.status,
          statusText: response.statusText,
        });
      }
      return response.json();
    },
    children: [
      {
        index: true,
        element: <Body />,
      },
    ],
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
