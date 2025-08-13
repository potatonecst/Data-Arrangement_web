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
        signal: AbortSignal.timeout(5000) //timeout: 5000 ms
      });
      if (response.ok) {
        console.log("Server is up!\nFetching data...");
        return response.json();
      }
      console.error(`Attempt ${i + 1}: Server returned status ${response.status}`); //APIのエラー（サーバは稼働中）
    } catch (error){
      const message = error instanceof Error && error.name === "TimeoutError" ? "Request timed out (5000 ms)" : "Server not responding"
      if (i != retries - 1) {
        console.log(`Attempt ${i + 1}: ${message}, retrying in ${delay} ms...`)
      } else {
        console.log(`Attempt ${i + 1}: ${message}`)
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
    <div className='flex h-screen w-full items-center justify-center bg-background'>
      <p className='text-xl font-bold'>Error! Try Again.</p>
    </div>
  )
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    loader: () => {
      const dataPromise = loaderWithRetry();
      return {initialData: dataPromise};
    },
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
