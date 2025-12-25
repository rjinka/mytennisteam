import React, { useEffect } from 'react';
import { useAppContext } from '../context/AppContext';

declare global {
    interface Window {
        google: any;
    }
}

const Login: React.FC = () => {
    const { setUser } = useAppContext();

    useEffect(() => {
        // Load the Google script manually to ensure it's available
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);

        return () => {
            document.head.removeChild(script);
        };
    }, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <div className="glass-card w-full max-w-md text-center space-y-8 py-12">
                <div className="space-y-2">
                    <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 leading-relaxed pb-3">
                        My Tennis Team
                    </h1>
                    <p className="text-white/60 text-lg">
                        Manage your team with ease
                    </p>
                </div>

                <div className="py-8 flex flex-col items-center gap-4">
                    {/* Standard Google Sign-In Button with login_uri */}
                    <div id="g_id_onload"
                        data-client_id={import.meta.env.VITE_GOOGLE_CLIENT_ID}
                        data-context="signin"
                        data-ux_mode="redirect"
                        data-login_uri="http://localhost:3000/api/auth/google"
                        data-auto_prompt="false">
                    </div>

                    <div className="g_id_signin"
                        data-type="standard"
                        data-shape="rectangular"
                        data-theme="outline"
                        data-text="signin_with"
                        data-size="large"
                        data-logo_alignment="left">
                    </div>
                </div>

                <p className="text-white/40 text-sm">
                    By signing in, you agree to our{' '}
                    <a href="/privacy" className="text-white/60 hover:text-white underline transition-colors">
                        Terms of Service
                    </a>
                </p>
            </div>
        </div>
    );
};

export default Login;
