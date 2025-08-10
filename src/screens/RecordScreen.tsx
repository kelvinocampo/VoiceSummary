import React, { useState, useContext } from 'react';
import { View, Button, Text, Alert } from 'react-native';
import { Audio } from 'expo-av';
import NetInfo from '@react-native-community/netinfo';
import { transcribeAudio } from '@/services/transcriptionService';
import { ApiKeyContext } from '@/providers/ApiKeyProvider';

export default function RecordScreen() {
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [status, setStatus] = useState('');
    const [transcription, setTranscription] = useState('');
    const startRecording = async () => {
        const { activeKey } = useContext(ApiKeyContext);

        if (!activeKey || !activeKey?.key) {
            Alert.alert('Error', 'No tienes una API key activa configurada.');
            return;
        }

        const netInfo = await NetInfo.fetch();
        if (!netInfo.isConnected) {
            Alert.alert('Error', 'No hay conexión a internet. Conéctate antes de grabar.');
            return;
        }

        try {
            await Audio.requestPermissionsAsync();
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true
            });

            const { recording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );

            setRecording(recording);
            setStatus('Grabando...');
        } catch (err) {
            console.error(err);
        }
    };

    const stopRecording = async () => {
        if (!recording) return;
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        setRecording(null);
        setStatus(`Audio guardado: ${uri}`);

        if (uri) {
            setStatus('Transcribiendo...');
            const text = await transcribeAudio(uri);
            setTranscription(text);
            setStatus('Transcripción lista');
        }
    };

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text>{status || 'Listo para grabar'}</Text>
            {transcription ? <Text>Transcripción: {transcription}</Text> : null}
            <Button title="Iniciar grabación" onPress={startRecording} disabled={!!recording} />
            <Button title="Detener grabación" onPress={stopRecording} disabled={!recording} />
        </View>
    );
}
