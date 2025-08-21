import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';

import HomeScreen from '@/screens/HomeScreen';
import RecordScreen from '@/screens/HomeScreen'; // Importar RecordScreen
import SettingsScreen from '@/screens/SettingsScreen';

export type RootStackParamList = {
    Home: undefined;
    Record: undefined;
    Settings: undefined;
    // Removí ApiKeys ya que no tienes esa pantalla
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
    return (
        <NavigationContainer>
            <Stack.Navigator 
                initialRouteName="Record" // Cambia a Record como inicial
                screenOptions={{
                    headerShown: false, // Oculta el header por defecto ya que usas SafeAreaView
                }}
            >
                <Stack.Screen 
                    name="Record" 
                    component={RecordScreen}
                    options={{
                        title: 'Grabador'
                    }}
                />
                <Stack.Screen 
                    name="Settings" 
                    component={SettingsScreen}
                    options={{
                        title: 'Configuración',
                        presentation: 'modal', // Presenta como modal para mejor UX
                    }}
                />
                <Stack.Screen 
                    name="Home" 
                    component={HomeScreen}
                    options={{
                        title: 'Inicio'
                    }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
}