import React, { useState, useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Audio } from 'expo-av';
import NetInfo from '@react-native-community/netinfo';
import { transcribeAudio } from '@/services/transcriptionService';
import { ApiKeyContext } from '@/providers/ApiKeyProvider';
import { ThemeContext } from '@/providers/ThemeProvider';

export default function RecordScreen() {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [status, setStatus] = useState('');
  const [transcription, setTranscription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { activeKey } = useContext(ApiKeyContext);
  const { theme } = useContext(ThemeContext);
  const colors = theme === 'dark' ? darkColors : lightColors;

  const startRecording = async () => {
    if (!activeKey?.key) {
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
      setTranscription('');
    } catch (err) {
      console.error('Error al grabar:', err);
      Alert.alert('Error', 'No se pudo iniciar la grabación');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      setStatus('Procesando audio...');

      if (uri) {
        setIsLoading(true);
        const text = await transcribeAudio(uri, activeKey?.key as string);
        setTranscription(text);
        setStatus('Transcripción completada');
      }
    } catch (err) {
      console.error('Error al detener grabación:', err);
      Alert.alert('Error', 'No se pudo procesar la grabación');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.card, { backgroundColor: colors.sectionBackground }]}>
        <Text style={[styles.status, { color: colors.text }]}>
          {status || 'Presiona el botón para comenzar a grabar'}
        </Text>
        
        {isLoading ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : transcription ? (
          <View style={[styles.transcriptionContainer, { borderColor: colors.border }]}>
            <Text style={[styles.transcriptionLabel, { color: colors.text }]}>Transcripción:</Text>
            <Text style={[styles.transcriptionText, { color: colors.text }]}>{transcription}</Text>
          </View>
        ) : null}

        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[
              styles.recordButton,
              recording && { backgroundColor: colors.danger },
              { backgroundColor: recording ? colors.danger : colors.primary }
            ]}
            onPress={recording ? stopRecording : startRecording}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {recording ? 'Detener grabación' : 'Iniciar grabación'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  card: {
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  status: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  transcriptionContainer: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  transcriptionLabel: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  transcriptionText: {
    fontSize: 16,
  },
  buttonsContainer: {
    marginTop: 16,
  },
  recordButton: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

// Esquemas de color consistentes con Settings
const lightColors = {
  background: '#f5f5f5',
  sectionBackground: '#ffffff',
  text: '#333333',
  primary: '#1e88e5',
  danger: '#f44336',
  border: '#e0e0e0',
};

const darkColors = {
  background: '#121212',
  sectionBackground: '#1e1e1e',
  text: '#ffffff',
  primary: '#2196f3',
  danger: '#ef5350',
  border: '#333333',
};