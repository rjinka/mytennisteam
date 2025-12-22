import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { api } from '../api';
import { useAppContext } from '../context/AppContext';

const Login: React.FC = () => {
    // const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
    const { setUser } = useAppContext();

    const handleSuccess = async (credentialResponse: any) => {
        try {
            if (credentialResponse.credential) {
                const user = await api.loginWithGoogle(credentialResponse.credential);
                setUser(user);
            }
        } catch (error) {
            console.error('Login Failed:', error);
        }
    };

    const handleError = () => {
        console.log('Login Failed');
    };

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

                <div className="py-8 flex justify-center">
                    <GoogleLogin
                        onSuccess={handleSuccess}
                        onError={handleError}
                        theme="outline"
                        size="large"
                        shape="rectangular"
                        text="signin_with"
                        logo_alignment="left"
                    />
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
