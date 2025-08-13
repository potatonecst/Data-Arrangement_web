import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import './index.css'

import RootLayout from './routes/RootLayout';
import Body from './routes/Body';
//import AppLoader from './components/AppLoader';

//import { API_BASE_URL } from '@/config';

const loaderWithRetry = async () => {
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  if (!apiUrl) {
    throw new Error("VITE_API_BASE_URL is not defined. Please check your environment variables.")
  }

  const retries = 15;
  const delay = 3000;

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(`${apiUrl}/default-values`, {
        signal: AbortSignal.timeout(5000) //timeout: 8000 ms
      });
      if (response.ok) {
        console.log("Server is up!\nFetching data...");
        return response.json();
      }
      console.error(`Attempt ${i + 1}: Server returned status ${response.status}`); //APIのエラー（サーバは稼働中）
    } catch (error){
      if (error instanceof Error && error.name === "TimeoutError") {
        console.log(`Attempt ${i + 1}: Request timed out (8000 ms), retrying in ${delay} ms...`)
      } else {
        console.log(`Attempt ${i + 1}: Server not responding, retrying in ${delay} ms...`); //サーバがスリープ状態
      }
    }
    if (i < retries - 1) {
      await new Promise(resolve => setTimeout(resolve, delay)); //指定時間[ms]待つ
    }
  }
  throw new Response("Server did not respond after multiple attempts.", {status: 503}); //指定回数リトライしても失敗
}

const ErrorPage = () => {
  return (
    <div>Error! Try Again.</div>
  )
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    loader: loaderWithRetry,
    errorElement: <ErrorPage />,
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
