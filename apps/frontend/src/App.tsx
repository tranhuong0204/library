import { BrowserRouter } from 'react-router-dom';
import { Providers } from '@/app/providers';
import { AppRouter } from '@/app/router';
import '@/styles/index.css';

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Providers>
        <AppRouter />
      </Providers>
    </BrowserRouter>
  );
}
