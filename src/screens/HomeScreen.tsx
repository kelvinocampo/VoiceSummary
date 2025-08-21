import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Animated,
} from 'react-native';
import { Audio } from 'expo-av';
import NetInfo from '@react-native-community/netinfo';
import { transcribeAudio } from '@/services/transcriptionService';
import { summarizeText } from '@/services/summarizeText';
import { ApiKeyContext } from '@/providers/ApiKeyProvider';
import { ThemeContext } from '@/providers/ThemeProvider';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const { width } = Dimensions.get('window');
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
  const [recordingTime, setRecordingTime] = useState(0);
  
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { activeKey } = useContext(ApiKeyContext);
  const { theme } = useContext(ThemeContext);
  const colors = theme === 'dark' ? darkColors : lightColors;

  // Animaciones
  const pulseAnim = new Animated.Value(1);
  const fadeAnim = new Animated.Value(0);

  // Timer para el contador de grabación
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (recording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }
    return () => clearInterval(interval);
  }, [recording]);

  // Animación de pulso para el botón de grabación
  useEffect(() => {
    if (recording) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [recording]);

  // Animación fade para los resultados
  useEffect(() => {
    if (transcription || summary) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [transcription, summary]);

  // Limpiar timeouts al enfocar la pantalla
  useFocusEffect(
    React.useCallback(() => {
      return () => {
        clearTimeout(warningTimeout);
        clearTimeout(stopTimeout);
      };
    }, [])
  );

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    if (!activeKey?.key) {
      Alert.alert(
        'API Key requerida',
        'No tienes una API key activa configurada. Ve a configuración para añadir una.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Ir a configuración', onPress: () => navigation.navigate('Settings') }
        ]
      );
      return;
    }

    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      Alert.alert('Sin conexión', 'No hay conexión a internet. Conéctate antes de grabar.');
      return;
    }

    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permisos requeridos', 'Se necesita acceso al micrófono para grabar.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
      setStatus('Grabando...');
      setTranscription('');
      setSummary('');
      setKeyPoints([]);

      // Advertencia a los 50 segundos
      warningTimeout = setTimeout(() => {
        Alert.alert(
          'Tiempo límite próximo',
          'Has alcanzado 50 segundos de grabación. El límite es 1:10.',
          [{ text: 'Entendido' }]
        );
      }, 50 * 1000);

      // Detener automáticamente a los 70 segundos
      stopTimeout = setTimeout(() => {
        stopRecording();
        Alert.alert('Grabación finalizada', 'Se alcanzó el tiempo máximo de grabación.');
      }, MAX_RECORDING_TIME);

    } catch (err) {
      console.error('Error al iniciar grabación:', err);
      Alert.alert('Error', 'No se pudo iniciar la grabación. Inténtalo de nuevo.');
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
        
        try {
          const text = await transcribeAudio(uri, activeKey?.key as string);
          setTranscription(text);

          const { summary, keyPoints } = await summarizeText(text, activeKey?.key as string);
          setSummary(summary);
          setKeyPoints(keyPoints);

          setStatus('Transcripción y resumen completados');
        } catch (error) {
          console.error('Error en procesamiento:', error);
          Alert.alert('Error', 'No se pudo procesar el audio. Verifica tu conexión y API key.');
          setStatus('Error en el procesamiento');
        }
      }
    } catch (err) {
      console.error('Error al detener grabación:', err);
      Alert.alert('Error', 'No se pudo finalizar la grabación.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setTranscription('');
    setSummary('');
    setKeyPoints([]);
    setStatus('');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Grabador de Voz
        </Text>
        <TouchableOpacity
          style={[styles.settingsButton, { backgroundColor: colors.cardBackground }]}
          onPress={() => navigation.navigate('Settings')}
        >
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Contenido principal */}
      <View style={[styles.mainCard, { backgroundColor: colors.cardBackground }]}>
        
        {/* Estado y timer */}
        <View style={styles.statusContainer}>
          <Text style={[styles.status, { color: colors.textSecondary }]}>
            {status || 'Listo para grabar'}
          </Text>
          {recording && (
            <View style={[styles.timerContainer, { backgroundColor: colors.accent }]}>
              <View style={[styles.recordingIndicator, { backgroundColor: colors.danger }]} />
              <Text style={[styles.timer, { color: colors.white }]}>
                {formatTime(recordingTime)}
              </Text>
            </View>
          )}
        </View>

        {/* Contenido scrollable */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Procesando audio...
            </Text>
          </View>
        ) : (
          <Animated.View style={[styles.resultsContainer, { opacity: fadeAnim }]}>
            <ScrollView
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {transcription ? (
                <View style={[styles.resultCard, { backgroundColor: colors.sectionBackground }]}>
                  <View style={styles.cardHeader}>
                    <Text style={[styles.cardTitle, { color: colors.primary }]}>
                      📝 Transcripción
                    </Text>
                  </View>
                  <Text style={[styles.resultText, { color: colors.text }]}>
                    {transcription}
                  </Text>
                </View>
              ) : null}

              {summary ? (
                <View style={[styles.resultCard, { backgroundColor: colors.sectionBackground }]}>
                  <View style={styles.cardHeader}>
                    <Text style={[styles.cardTitle, { color: colors.primary }]}>
                      📋 Resumen
                    </Text>
                  </View>
                  <Text style={[styles.resultText, { color: colors.text }]}>
                    {summary}
                  </Text>
                </View>
              ) : null}

              {keyPoints.length > 0 ? (
                <View style={[styles.resultCard, { backgroundColor: colors.sectionBackground }]}>
                  <View style={styles.cardHeader}>
                    <Text style={[styles.cardTitle, { color: colors.primary }]}>
                      🔑 Puntos Clave
                    </Text>
                  </View>
                  {keyPoints.map((point, idx) => (
                    <View key={idx} style={styles.keyPointContainer}>
                      <View style={[styles.keyPointBullet, { backgroundColor: colors.primary }]} />
                      <Text style={[styles.keyPointText, { color: colors.text }]}>
                        {point}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </ScrollView>
          </Animated.View>
        )}
      </View>

      {/* Controles inferiores */}
      <View style={styles.controlsContainer}>
        {(transcription || summary) && !recording && !isLoading && (
          <TouchableOpacity
            style={[styles.clearButton, { backgroundColor: colors.textSecondary }]}
            onPress={clearResults}
          >
            <Text style={[styles.clearButtonText, { color: colors.white }]}>
              Limpiar
            </Text>
          </TouchableOpacity>
        )}
        
        <Animated.View style={[{ transform: [{ scale: pulseAnim }] }]}>
          <TouchableOpacity
            style={[
              styles.recordButton,
              {
                backgroundColor: recording ? colors.danger : colors.primary,
                shadowColor: recording ? colors.danger : colors.primary,
              }
            ]}
            onPress={recording ? stopRecording : startRecording}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <Text style={[styles.recordButtonText, { color: colors.white }]}>
              {recording ? '⏹️ Detener' : '🎙️ Grabar'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  settingsIcon: {
    fontSize: 18,
  },
  mainCard: {
    flex: 1,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  status: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  recordingIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  timer: {
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  resultsContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  resultCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: {
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  resultText: {
    fontSize: 15,
    lineHeight: 22,
  },
  keyPointContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  keyPointBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
    marginRight: 12,
  },
  keyPointText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  controlsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  clearButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  recordButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    elevation: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  recordButtonText: {
    fontSize: 18,
    fontWeight: '700',
  },
});

// Esquemas de color mejorados
const lightColors = {
  background: '#f8f9fa',
  cardBackground: '#ffffff',
  sectionBackground: '#f1f3f4',
  text: '#212529',
  textSecondary: '#6c757d',
  primary: '#007bff',
  danger: '#dc3545',
  accent: '#28a745',
  border: '#dee2e6',
  white: '#ffffff',
};

const darkColors = {
  background: '#0d1117',
  cardBackground: '#161b22',
  sectionBackground: '#21262d',
  text: '#f0f6fc',
  textSecondary: '#8b949e',
  primary: '#1f6feb',
  danger: '#f85149',
  accent: '#238636',
  border: '#30363d',
  white: '#ffffff',
};