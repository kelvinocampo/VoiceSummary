import React from 'react';
import { View, Text, Button } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text>🏠 Bienvenido a VoiceSummary</Text>
            <Button title="Grabar Audio" onPress={() => navigation.navigate('Record')} />
            <Button title="Configuración" onPress={() => navigation.navigate('Settings')} />
            <Button title="Gestionar API Keys" onPress={() => navigation.navigate('ApiKeys')} />
        </View>
    );
}
