import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AppRoutes } from './routes/AppRoutes';
import { useThemeStore } from './store/themeStore';

export default function App() {
  const theme = useThemeStore((s) => s.theme);

  return (
    <>
      <AppRoutes />
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        newestOnTop
        theme={theme === 'dark' ? 'dark' : 'colored'}
        toastClassName="!rounded-xl"
      />
    </>
  );
}
