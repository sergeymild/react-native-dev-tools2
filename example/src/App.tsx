import * as React from 'react';

import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { nativeDevTools } from 'react-native-dev';

export default function App() {
  // const [logs, setLogs] = useState('')
  // const [screenshot, setScreenshot] = useState<string | null>(null)

  React.useEffect(() => {
    const initLogs = async () => {
      await nativeDevTools.setup({
        enabled: true,
        onShake: () => {
          showDev();
        },
      });
      console.log('1 some log');
      console.error('1 some error', new Error('Error text'));
      console.warn('1 some Warn');
    };
    initLogs();
  }, []);

  const sendToDiscord = async () => {
    const sendResult = await nativeDevTools.sendDevLogsToDiscord({
      discord: {
        webhook: 'token',
      },
    });
    console.log('[App.sendToDiscord]', sendResult);
  };

  const showDev = async () => {
    Alert.alert('Dev menu', undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Send',
        style: 'default',
        onPress: sendToDiscord,
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={{ backgroundColor: 'red' }}>some awesome text</Text>

      <TouchableOpacity onPress={showDev}>
        <Text>Show Dev</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{ width: 100, height: 50 }}
        onPress={() => nativeDevTools.log('Some log')}
      >
        <Text>Log</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'yellow',
  },
  box: {
    width: 60,
    height: 60,
    marginVertical: 20,
  },
});
