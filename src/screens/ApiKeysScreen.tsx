import React, { useContext, useState } from 'react';
import { View, Text, TextInput, Button, FlatList } from 'react-native';
import { ApiKeyContext } from '@/providers/ApiKeyProvider';

export default function ApiKeysScreen() {
    const { keys, addNewKey, removeKey, activateKey, activeKey } = useContext(ApiKeyContext);
    const [name, setName] = useState('');
    const [key, setKey] = useState('');

    return (
        <View style={{ flex: 1, padding: 20 }}>
            <Text>API Key activa: {activeKey?.name || 'Ninguna'}</Text>
            <TextInput placeholder="Nombre" value={name} onChangeText={setName} style={{ borderWidth: 1, marginVertical: 5 }} />
            <TextInput placeholder="Clave" value={key} onChangeText={setKey} style={{ borderWidth: 1, marginVertical: 5 }} />
            <Button title="Agregar" onPress={async () => { await addNewKey(name, key); setName(''); setKey(''); }} />
            <FlatList
                data={keys}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <View style={{ marginVertical: 5 }}>
                        <Text>{item.name} {item.active ? '(Activa)' : ''}</Text>
                        <Button title="Activar" onPress={async () => await activateKey(item.id)} />
                        <Button title="Eliminar" onPress={async () => await removeKey(item.id)} />
                    </View>
                )}
            />
        </View>
    );
}
