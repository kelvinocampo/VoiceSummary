import React, { useContext, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Switch, Modal, Alert } from 'react-native';
import { ThemeContext } from '@/providers/ThemeProvider';
import { ApiKeyContext, ApiKey } from '@/providers/ApiKeyProvider';

export default function SettingsScreen() {
  // Contextos
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { keys, activeKey, addNewKey, editKey, removeKey, activateKey } = useContext(ApiKeyContext);
  
  // Estados
  const [language, setLanguage] = useState('es');
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyValue, setNewKeyValue] = useState('');
  const [editingKey, setEditingKey] = useState<ApiKey | null>(null);
  const [editKeyName, setEditKeyName] = useState('');
  const [editKeyValue, setEditKeyValue] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  // Colores basados en el tema
  const colors = theme === 'dark' ? darkColors : lightColors;

  // Manejar agregar nueva key
  const handleAddKey = async () => {
    if (!newKeyName || !newKeyValue) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }
    await addNewKey(newKeyName, newKeyValue);
    setNewKeyName('');
    setNewKeyValue('');
  };

  // Manejar edición de key
  const handleEditKey = async () => {
    if (!editingKey || !editKeyName || !editKeyValue) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }
    await editKey(editingKey.id, editKeyName, editKeyValue);
    setEditingKey(null);
    setModalVisible(false);
  };

  // Manejar eliminación de key
  const handleDeleteKey = (id: number) => {
    Alert.alert(
      'Confirmar',
      '¿Estás seguro de que quieres eliminar esta API Key?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', onPress: () => removeKey(id) },
      ]
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Sección de Tema */}
      <View style={[styles.section, { backgroundColor: colors.sectionBackground }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Apariencia</Text>
        <View style={styles.settingRow}>
          <Text style={[styles.settingText, { color: colors.text }]}>Tema oscuro</Text>
          <Switch
            value={theme === 'dark'}
            onValueChange={toggleTheme}
            thumbColor={theme === 'dark' ? colors.primary : colors.secondary}
            trackColor={{ false: colors.secondary, true: colors.primary }}
          />
        </View>
      </View>

      {/* Sección de Idioma */}
      <View style={[styles.section, { backgroundColor: colors.sectionBackground }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Idioma</Text>
        <View style={styles.languageButtons}>
          <TouchableOpacity
            style={[
              styles.languageButton,
              language === 'es' && { backgroundColor: colors.primary },
              { borderColor: colors.primary }
            ]}
            onPress={() => setLanguage('es')}
          >
            <Text style={[styles.languageText, language === 'es' && { color: 'white' }]}>Español</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.languageButton,
              language === 'en' && { backgroundColor: colors.primary },
              { borderColor: colors.primary }
            ]}
            onPress={() => setLanguage('en')}
          >
            <Text style={[styles.languageText, language === 'en' && { color: 'white' }]}>English</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Sección de API Keys */}
      <View style={[styles.section, { backgroundColor: colors.sectionBackground }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Gestión de API Keys</Text>
        <Text style={[styles.activeKeyText, { color: colors.text }]}>
          API Key activa: <Text style={{ color: colors.primary }}>{activeKey?.name || 'Ninguna'}</Text>
        </Text>

        {/* Formulario para agregar nueva key */}
        <View style={styles.addKeyContainer}>
          <TextInput
            placeholder="Nombre de la API Key"
            placeholderTextColor={colors.placeholder}
            value={newKeyName}
            onChangeText={setNewKeyName}
            style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
          />
          <TextInput
            placeholder="Valor de la API Key"
            placeholderTextColor={colors.placeholder}
            value={newKeyValue}
            onChangeText={setNewKeyValue}
            style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
          />
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={handleAddKey}
          >
            <Text style={styles.buttonText}>Agregar API Key</Text>
          </TouchableOpacity>
        </View>

        {/* Lista de API Keys */}
        <View style={styles.keysList}>
          {keys.map((key) => (
            <View key={key.id} style={[styles.keyItem, { backgroundColor: colors.itemBackground, borderColor: colors.border }]}>
              <View style={styles.keyInfo}>
                <Text style={[styles.keyName, { color: colors.text }]}>
                  {key.name} {key.active && <Text style={{ color: colors.primary }}>(Activa)</Text>}
                </Text>
                <Text style={[styles.keyValue, { color: colors.secondaryText }]} numberOfLines={1} ellipsizeMode="middle">
                  {key.key}
                </Text>
              </View>
              <View style={styles.keyActions}>
                {!key.active && (
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.primary }]}
                    onPress={() => activateKey(key.id)}
                  >
                    <Text style={styles.buttonText}>Activar</Text>
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
                  <Text style={styles.buttonText}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colors.danger }]}
                  onPress={() => handleDeleteKey(key.id)}
                >
                  <Text style={styles.buttonText}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Modal para editar API Key */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.sectionBackground }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Editar API Key</Text>
            <TextInput
              placeholder="Nombre"
              placeholderTextColor={colors.placeholder}
              value={editKeyName}
              onChangeText={setEditKeyName}
              style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
            />
            <TextInput
              placeholder="Valor"
              placeholderTextColor={colors.placeholder}
              value={editKeyValue}
              onChangeText={setEditKeyValue}
              style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.danger }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={handleEditKey}
              >
                <Text style={styles.buttonText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

// Estilos
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingText: {
    fontSize: 16,
  },
  languageButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  languageButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  languageText: {
    fontSize: 14,
  },
  activeKeyText: {
    fontSize: 16,
    marginBottom: 16,
  },
  addKeyContainer: {
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  addButton: {
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  keysList: {
    marginTop: 8,
  },
  keyItem: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  keyInfo: {
    marginBottom: 8,
  },
  keyName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  keyValue: {
    fontSize: 14,
    marginTop: 4,
  },
  keyActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionButton: {
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  modalButton: {
    borderRadius: 8,
    padding: 12,
    width: '48%',
    alignItems: 'center',
  },
});

// Esquemas de color
const lightColors = {
  background: '#f5f5f5',
  sectionBackground: '#ffffff',
  text: '#333333',
  secondaryText: '#666666',
  primary: '#1e88e5', // Azul
  secondary: '#26c6da', // Cyan
  danger: '#f44336', // Rojo
  inputBackground: '#ffffff',
  placeholder: '#9e9e9e',
  border: '#e0e0e0',
  itemBackground: '#ffffff',
};

const darkColors = {
  background: '#121212',
  sectionBackground: '#1e1e1e',
  text: '#ffffff',
  secondaryText: '#b0b0b0',
  primary: '#2196f3', // Azul más claro
  secondary: '#00acc1', // Cyan más claro
  danger: '#ef5350', // Rojo más claro
  inputBackground: '#2d2d2d',
  placeholder: '#757575',
  border: '#333333',
  itemBackground: '#2d2d2d',
};