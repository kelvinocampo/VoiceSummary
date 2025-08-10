import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';

import HomeScreen from '@/screens/HomeScreen';
import RecordScreen from '@/screens/RecordScreen';
import SettingsScreen from '@/screens/SettingsScreen';
import ApiKeysScreen from '@/screens/ApiKeysScreen';

export type RootStackParamList = {
    Home: undefined;
    Record: undefined;
    Settings: undefined;
    ApiKeys: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
    return (
        <NavigationContainer>
            <Stack.Navigator>
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen name="Record" component={RecordScreen} />
                <Stack.Screen name="Settings" component={SettingsScreen} />
                <Stack.Screen name="ApiKeys" component={ApiKeysScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
