import React, { useEffect } from 'react';
import { Toaster, ToastBar, toast } from 'react-hot-toast';
import { AppProvider, useAppContext } from './context/AppContext';
import { api } from './api';
import Login from './components/Login.tsx';
import Dashboard from './components/Dashboard.tsx';
import LoadingOverlay from './components/LoadingOverlay.tsx';
import VersionDisplay from './components/VersionDisplay.tsx';

const AppContent: React.FC = () => {
  const { user, setUser, loading, setLoading } = useAppContext();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await api.getSelf();
        setUser(userData);
      } catch (error) {
        console.log('User not authenticated');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [setUser, setLoading]);

  if (loading) {
    return <LoadingOverlay />;
  }

  return user ? <Dashboard /> : <Login />;
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
      <VersionDisplay />
      <Toaster
        position="bottom-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'rgba(30, 41, 59, 0.8)',
            color: '#fff',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '12px 24px',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      >
        {(t) => (
          <ToastBar toast={t}>
            {({ icon, message }) => (
              <>
                {icon}
                {message}
                {t.type !== 'loading' && (
                  <button
                    onClick={() => toast.dismiss(t.id)}
                    className="ml-4 p-1 hover:bg-white/10 rounded-full transition-colors"
                    title="Close"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white/40 hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </>
            )}
          </ToastBar>
        )}
      </Toaster>
    </AppProvider>
  );
};

export default App;
