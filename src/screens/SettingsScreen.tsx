import React, { useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Modal,
  Alert,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { ThemeContext } from '@/providers/ThemeProvider';
import { ApiKeyContext, ApiKey } from '@/providers/ApiKeyProvider';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { Linking } from 'react-native';

type SettingsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

export default function SettingsScreen() {
  // Contextos
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { keys, activeKey, addNewKey, editKey, removeKey, activateKey } = useContext(ApiKeyContext);

  // Navegación
  const navigation = useNavigation<SettingsScreenNavigationProp>();

  // Estados
  const [language, setLanguage] = useState('es');
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyValue, setNewKeyValue] = useState('');
  const [editingKey, setEditingKey] = useState<ApiKey | null>(null);
  const [editKeyName, setEditKeyName] = useState('');
  const [editKeyValue, setEditKeyValue] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showKeyValues, setShowKeyValues] = useState<{[key: number]: boolean}>({});

  // Colores basados en el tema
  const colors = theme === 'dark' ? darkColors : lightColors;

  // Animación para las cards
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  // Log para debugging
  useFocusEffect(
    React.useCallback(() => {
      console.log('Keys en SettingsScreen:', keys);
      console.log('Active key:', activeKey);
    }, [keys, activeKey])
  );

  // Alternar visibilidad de API key
  const toggleKeyVisibility = (keyId: number) => {
    setShowKeyValues(prev => ({
      ...prev,
      [keyId]: !prev[keyId]
    }));
  };

  // Manejar agregar nueva key
  const handleAddKey = async () => {
    if (!newKeyName.trim()) {
      Alert.alert('Error', 'Por favor ingresa un nombre para la API Key');
      return;
    }
    if (!newKeyValue.trim()) {
      Alert.alert('Error', 'Por favor ingresa el valor de la API Key');
      return;
    }
    
    // Verificar si ya existe una key con ese nombre
    if (keys.some(key => key.name.toLowerCase() === newKeyName.trim().toLowerCase())) {
      Alert.alert('Error', 'Ya existe una API Key con ese nombre');
      return;
    }

    setIsLoading(true);
    try {
      await addNewKey(newKeyName.trim(), newKeyValue.trim());
      setNewKeyName('');
      setNewKeyValue('');
      Alert.alert('Éxito', 'API Key agregada correctamente');
    } catch (error) {
      console.error('Error agregando key:', error);
      Alert.alert('Error', 'No se pudo agregar la API Key');
    } finally {
      setIsLoading(false);
    }
  };

  // Manejar edición de key
  const handleEditKey = async () => {
    if (!editingKey || !editKeyName.trim() || !editKeyValue.trim()) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    setIsLoading(true);
    try {
      await editKey(editingKey.id, editKeyName.trim(), editKeyValue.trim());
      setEditingKey(null);
      setModalVisible(false);
      setEditKeyName('');
      setEditKeyValue('');
      Alert.alert('Éxito', 'API Key actualizada correctamente');
    } catch (error) {
      console.error('Error editando key:', error);
      Alert.alert('Error', 'No se pudo actualizar la API Key');
    } finally {
      setIsLoading(false);
    }
  };

  // Manejar eliminación de key
  const handleDeleteKey = (id: number, name: string) => {
    Alert.alert(
      'Confirmar eliminación',
      `¿Estás seguro de que quieres eliminar la API Key "${name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            removeKey(id);
            Alert.alert('Éxito', 'API Key eliminada correctamente');
          }
        },
      ]
    );
  };

  // Manejar activación de key
  const handleActivateKey = async (id: number, name: string) => {
    try {
      await activateKey(id);
      Alert.alert('Éxito', `API Key "${name}" activada correctamente`);
    } catch (error) {
      console.error('Error activando key:', error);
      Alert.alert('Error', 'No se pudo activar la API Key');
    }
  };

  // Abrir enlace externo
  const openGoogleAIStudio = () => {
    Linking.openURL('https://aistudio.google.com/app/apikey').catch((err) =>
      console.error('Error abriendo enlace:', err)
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Configuración
        </Text>
        <View style={styles.placeholder} />
      </View>

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Sección de Tema */}
          <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionIcon, { color: colors.primary }]}>🎨</Text>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Apariencia</Text>
            </View>
            <View style={[styles.settingRow, { backgroundColor: colors.itemBackground }]}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingText, { color: colors.text }]}>Tema oscuro</Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  Cambia entre tema claro y oscuro
                </Text>
              </View>
              <Switch
                value={theme === 'dark'}
                onValueChange={toggleTheme}
                thumbColor={theme === 'dark' ? colors.primary : '#ffffff'}
                trackColor={{ false: colors.border, true: colors.primary + '80' }}
              />
            </View>
          </View>

          {/* Sección de Idioma */}
          <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionIcon, { color: colors.primary }]}>🌐</Text>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Idioma</Text>
            </View>
            <View style={styles.languageContainer}>
              <TouchableOpacity
                style={[
                  styles.languageButton,
                  language === 'es' && { backgroundColor: colors.primary },
                  { borderColor: colors.border }
                ]}
                onPress={() => setLanguage('es')}
              >
                <Text style={[
                  styles.languageText,
                  { color: language === 'es' ? colors.white : colors.text }
                ]}>
                  🇪🇸 Español
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.languageButton,
                  language === 'en' && { backgroundColor: colors.primary },
                  { borderColor: colors.border }
                ]}
                onPress={() => setLanguage('en')}
              >
                <Text style={[
                  styles.languageText,
                  { color: language === 'en' ? colors.white : colors.text }
                ]}>
                  🇺🇸 English
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Sección de API Keys */}
          <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionIcon, { color: colors.primary }]}>🔑</Text>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>API Keys</Text>
            </View>

            {/* Instrucciones */}
            <View style={[styles.instructionsContainer, { backgroundColor: colors.infoBackground }]}>
              <Text style={[styles.instructionsTitle, { color: colors.primary }]}>
                ℹ️ ¿Cómo obtener una API Key?
              </Text>
              <Text style={[styles.instructionsText, { color: colors.textSecondary }]}>
                Para usar Gemini necesitas una API Key gratuita de Google AI Studio.
              </Text>
              <TouchableOpacity
                style={[styles.linkButton, { backgroundColor: colors.primary }]}
                onPress={openGoogleAIStudio}
              >
                <Text style={[styles.linkButtonText, { color: colors.white }]}>
                  🚀 Obtener API Key gratis
                </Text>
              </TouchableOpacity>
            </View>

            {/* API Key activa */}
            {activeKey && (
              <View style={[styles.activeKeyContainer, { backgroundColor: colors.successBackground }]}>
                <Text style={[styles.activeKeyLabel, { color: colors.success }]}>
                  ✅ API Key Activa
                </Text>
                <View style={styles.activeKeyInfo}>
                  <Text style={[styles.activeKeyName, { color: colors.text }]}>
                    {activeKey.name}
                  </Text>
                  <Text style={[styles.activeKeyValue, { color: colors.textSecondary }]}>
                    {activeKey.key.substring(0, 8)}••••••••{activeKey.key.slice(-4)}
                  </Text>
                </View>
              </View>
            )}

            {/* Formulario para agregar nueva key */}
            <View style={styles.addKeyForm}>
              <Text style={[styles.formTitle, { color: colors.text }]}>
                Agregar nueva API Key
              </Text>
              <TextInput
                placeholder="Nombre descriptivo (ej: Mi API Key)"
                placeholderTextColor={colors.placeholder}
                value={newKeyName}
                onChangeText={setNewKeyName}
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.inputBackground,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                maxLength={50}
              />
              <TextInput
                placeholder="Pega tu API Key aquí"
                placeholderTextColor={colors.placeholder}
                value={newKeyValue}
                onChangeText={setNewKeyValue}
                secureTextEntry={!showKeyValues[-1]}
                multiline={false}
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.inputBackground,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
              />
              <TouchableOpacity
                style={[
                  styles.addButton,
                  { 
                    backgroundColor: colors.primary,
                    opacity: isLoading ? 0.6 : 1
                  }
                ]}
                onPress={handleAddKey}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <Text style={[styles.addButtonText, { color: colors.white }]}>
                    ➕ Agregar API Key
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Lista de API Keys */}
            <View style={styles.keysListContainer}>
              <Text style={[styles.keysListTitle, { color: colors.text }]}>
                Mis API Keys ({keys.length})
              </Text>
              
              {keys.length === 0 ? (
                <View style={[styles.emptyState, { backgroundColor: colors.itemBackground }]}>
                  <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                    🔒 No tienes API Keys configuradas
                  </Text>
                  <Text style={[styles.emptyStateSubtext, { color: colors.textSecondary }]}>
                    Agrega tu primera API Key para comenzar
                  </Text>
                </View>
              ) : (
                keys.map((key) => (
                  <View
                    key={key.id}
                    style={[
                      styles.keyItem,
                      {
                        backgroundColor: key.active ? colors.successBackground : colors.itemBackground,
                        borderColor: key.active ? colors.success : colors.border,
                      },
                    ]}
                  >
                    <View style={styles.keyHeader}>
                      <View style={styles.keyInfo}>
                        <View style={styles.keyNameContainer}>
                          <Text style={[styles.keyName, { color: colors.text }]}>
                            {key.name}
                          </Text>
                          {key.active && (
                            <View style={[styles.activeBadge, { backgroundColor: colors.success }]}>
                              <Text style={[styles.activeBadgeText, { color: colors.white }]}>
                                ACTIVA
                              </Text>
                            </View>
                          )}
                        </View>
                        <TouchableOpacity
                          onPress={() => toggleKeyVisibility(key.id)}
                          style={styles.keyValueContainer}
                        >
                          <Text
                            style={[styles.keyValue, { color: colors.textSecondary }]}
                            numberOfLines={1}
                          >
                            {showKeyValues[key.id] 
                              ? key.key 
                              : `${key.key.substring(0, 8)}••••••••${key.key.slice(-4)}`
                            }
                          </Text>
                          <Text style={[styles.toggleText, { color: colors.primary }]}>
                            {showKeyValues[key.id] ? '🙈' : '👁️'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    
                    <View style={styles.keyActions}>
                      {!key.active && (
                        <TouchableOpacity
                          style={[styles.actionButton, { backgroundColor: colors.primary }]}
                          onPress={() => handleActivateKey(key.id, key.name)}
                        >
                          <Text style={[styles.actionButtonText, { color: colors.white }]}>
                            ✅ Activar
                          </Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: colors.secondary }]}
                        onPress={() => {
                          setEditingKey(key);
                          setEditKeyName(key.name);
                          setEditKeyValue(key.key);
                          setModalVisible(true);
                        }}
                      >
                        <Text style={[styles.actionButtonText, { color: colors.white }]}>
                          ✏️ Editar
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: colors.danger }]}
                        onPress={() => handleDeleteKey(key.id, key.name)}
                      >
                        <Text style={[styles.actionButtonText, { color: colors.white }]}>
                          🗑️ Eliminar
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        </ScrollView>
      </Animated.View>

      {/* Modal para editar API Key */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              ✏️ Editar API Key
            </Text>
            <TextInput
              placeholder="Nombre"
              placeholderTextColor={colors.placeholder}
              value={editKeyName}
              onChangeText={setEditKeyName}
              style={[
                styles.input,
                {
                  backgroundColor: colors.inputBackground,
                  color: colors.text,
                  borderColor: colors.border
                }
              ]}
            />
            <TextInput
              placeholder="API Key"
              placeholderTextColor={colors.placeholder}
              value={editKeyValue}
              onChangeText={setEditKeyValue}
              multiline={false}
              style={[
                styles.input,
                {
                  backgroundColor: colors.inputBackground,
                  color: colors.text,
                  borderColor: colors.border
                }
              ]}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.textSecondary }]}
                onPress={() => {
                  setModalVisible(false);
                  setEditingKey(null);
                  setEditKeyName('');
                  setEditKeyValue('');
                }}
              >
                <Text style={[styles.modalButtonText, { color: colors.white }]}>
                  Cancelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { 
                    backgroundColor: colors.primary,
                    opacity: isLoading ? 0.6 : 1
                  }
                ]}
                onPress={handleEditKey}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <Text style={[styles.modalButtonText, { color: colors.white }]}>
                    Guardar
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Estilos mejorados
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  backButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  placeholder: {
    width: 60,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingText: {
    fontSize: 16,
    fontWeight: '600',
  },
  settingDescription: {
    fontSize: 14,
    marginTop: 4,
  },
  languageContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  languageButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  languageText: {
    fontSize: 14,
    fontWeight: '600',
  },
  instructionsContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  linkButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  linkButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  activeKeyContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  activeKeyLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  activeKeyInfo: {
    flexDirection: 'column',
  },
  activeKeyName: {
    fontSize: 16,
    fontWeight: '600',
  },
  activeKeyValue: {
    fontSize: 14,
    marginTop: 4,
    fontFamily: 'monospace',
  },
  addKeyForm: {
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  input: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    fontSize: 16,
  },
  addButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  keysListContainer: {
    marginTop: 20,
  },
  keysListTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  emptyState: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  keyItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
  },
  keyHeader: {
    marginBottom: 12,
  },
  keyInfo: {
    flex: 1,
  },
  keyNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  keyName: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  activeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  keyValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  keyValue: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'monospace',
  },
  toggleText: {
    fontSize: 16,
    marginLeft: 8,
  },
  keyActions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

// Esquemas de color mejorados
const lightColors = {
  background: '#f8f9fa',
  cardBackground: '#ffffff',
  itemBackground: '#f8f9fa',
  infoBackground: '#e3f2fd',
  successBackground: '#e8f5e8',
  text: '#212529',
  textSecondary: '#6c757d',
  primary: '#007bff',
  secondary: '#6c757d',
  success: '#28a745',
  danger: '#dc3545',
  inputBackground: '#ffffff',
  placeholder: '#adb5bd',
  border: '#dee2e6',
  white: '#ffffff',
};

const darkColors = {
  background: '#0d1117',
  cardBackground: '#161b22',
  itemBackground: '#21262d',
  infoBackground: '#1c2e4a',
  successBackground: '#1a3a1a',
  text: '#f0f6fc',
  textSecondary: '#8b949e',
  primary: '#1f6feb',
  secondary: '#8b949e',
  success: '#238636',
  danger: '#f85149',
  inputBackground: '#21262d',
  placeholder: '#6e7681',
  border: '#30363d',
  white: '#ffffff',
};