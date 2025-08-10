import React, { useContext } from 'react';
import { View, Text, Button } from 'react-native';
import { ThemeContext } from '@/providers/ThemeProvider';

export default function SettingsScreen() {
    const { theme, toggleTheme } = useContext(ThemeContext);

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text>Tema actual: {theme}</Text>
            <Button title="Cambiar tema" onPress={toggleTheme} />
            {/* Aquí añadir selector de idioma y guardarlo en AsyncStorage */}
        </View>
    );
}
