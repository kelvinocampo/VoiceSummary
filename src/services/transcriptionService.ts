import { useContext } from 'react';
import { ApiKeyContext } from '@/providers/ApiKeyProvider';

export const transcribeAudio = async (uri: string) => {
    try {
        const { activeKey } = useContext(ApiKeyContext);
        const formData = new FormData();
        formData.append('file', {
            uri,
            name: 'audio.m4a',
            type: 'audio/m4a',
        } as any);

        formData.append('model', 'whisper-1');

        const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${activeKey?.key}`,
            },
            body: formData,
        });

        const data = await response.json();
        return data.text; // Texto transcrito
    } catch (error) {
        console.error('Error transcribiendo audio:', error);
        throw error;
    }
};
