import React, { useState, useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { Audio } from 'expo-av';
import NetInfo from '@react-native-community/netinfo';
import { transcribeAudio } from '@/services/transcriptionService';
import { summarizeText } from '@/services/summarizeText';
import { ApiKeyContext } from '@/providers/ApiKeyProvider';
import { ThemeContext } from '@/providers/ThemeProvider';

const MAX_RECORDING_TIME = 70 * 1000; // 1 min 10 seg
let warningTimeout: NodeJS.Timeout;
let stopTimeout: NodeJS.Timeout;

export default function RecordScreen() {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [status, setStatus] = useState('');
  const [transcription, setTranscription] = useState('');
  const [summary, setSummary] = useState('');
  const [keyPoints, setKeyPoints] = useState<string[]>([]);
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
      setSummary('');
      setKeyPoints([]);

      // ⚠️ Advertencia a los 50 segundos
      warningTimeout = setTimeout(() => {
        Alert.alert('Advertencia', 'Has alcanzado 50 segundos de grabación, el límite es 1:10.');
      }, 50 * 1000);

      // ⏹️ Detener automáticamente a los 70 seg
      stopTimeout = setTimeout(() => {
        stopRecording();
      }, MAX_RECORDING_TIME);

    } catch (err) {
      console.error('Error al grabar:', err);
      Alert.alert('Error', 'No se pudo iniciar la grabación');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    clearTimeout(warningTimeout);
    clearTimeout(stopTimeout);

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      setStatus('Procesando audio...');

      if (uri) {
        setIsLoading(true);
        const text = await transcribeAudio(uri, activeKey?.key as string);
        setTranscription(text);

        const { summary, keyPoints } = await summarizeText(text, activeKey?.key as string);
        setSummary(summary);
        setKeyPoints(keyPoints);

        setStatus('Transcripción y resumen completados');
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
        ) : (
          <ScrollView style={styles.scroll}>
            {transcription ? (
              <View style={[styles.section, { borderColor: colors.border }]}>
                <Text style={[styles.label, { color: colors.text }]}>Transcripción:</Text>
                <Text style={[styles.text, { color: colors.text }]}>{transcription}</Text>
              </View>
            ) : null}

            {summary ? (
              <View style={[styles.section, { borderColor: colors.border }]}>
                <Text style={[styles.label, { color: colors.text }]}>Resumen:</Text>
                <Text style={[styles.text, { color: colors.text }]}>{summary}</Text>
              </View>
            ) : null}

            {keyPoints.length > 0 ? (
              <View style={[styles.section, { borderColor: colors.border }]}>
                <Text style={[styles.label, { color: colors.text }]}>Puntos clave:</Text>
                {keyPoints.map((point, idx) => (
                  <Text key={idx} style={[styles.text, { color: colors.text }]}>
                    • {point}
                  </Text>
                ))}
              </View>
            ) : null}
          </ScrollView>
        )}

        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[
              styles.recordButton,
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
    flex: 1,
  },
  status: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  scroll: {
    flex: 1,
    marginBottom: 16,
  },
  section: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  label: {
    fontWeight: 'bold',
    marginBottom: 8,
    fontSize: 15,
  },
  text: {
    fontSize: 15,
    lineHeight: 20,
  },
  buttonsContainer: {
    marginTop: 8,
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

// Esquemas de color
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
