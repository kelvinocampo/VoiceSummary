export const transcribeAudio = async (uri: string, apiKey: string) => {
  try {
    const formData = new FormData();
    formData.append('file', {
      uri,
      name: 'audio.m4a',
      type: 'audio/m4a',
    } as any);

    formData.append('model', 'whisper-1');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Error en la API: ${response.status}`);
    }

    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error('Error transcribiendo audio:', error);
    throw error;
  }
};