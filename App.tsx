import React, { useEffect } from 'react';
import AppNavigator from '@/navigation/AppNavigator';
import { ApiKeyProvider } from '@/providers/ApiKeyProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { initDB } from '@/services/apiKeyDatabase';

export default function App() {
    useEffect(() => {
        const setupDB = async () => {
            await initDB();
        };
        setupDB();
    }, []);

    return (
        <ThemeProvider>
            <ApiKeyProvider>
                <AppNavigator />
            </ApiKeyProvider>
        </ThemeProvider>
    );
}
