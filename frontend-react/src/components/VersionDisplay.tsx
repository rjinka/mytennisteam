import React, { useEffect, useState } from 'react';
import { api } from '../api';
import packageJson from '../../package.json';

const VersionDisplay: React.FC = () => {
    const [backendVersion, setBackendVersion] = useState<string>('');

    useEffect(() => {
        const fetchVersion = async () => {
            try {
                const data = await api.getVersion();
                setBackendVersion(data.version);
            } catch (error) {
                console.error('Failed to fetch backend version:', error);
            }
        };
        fetchVersion();
    }, []);

    return (
        <div className="relative bottom-4  text-white/20 text-xs font-mono z-50 pointer-events-none select-none">
            v{packageJson.version} | API v{backendVersion || '...'}
        </div>
    );
};

export default VersionDisplay;
