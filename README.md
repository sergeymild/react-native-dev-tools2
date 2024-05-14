# react-native-dev-tools

React Native dev tools

## Installation
```json

[//]: # package.json

"react-native-dev-tools": "https://github.com/sergeymild/react-native-dev-tools2#0.1.0"
```


## Usage

```js
import {nativeDevTools} from 'react-native-dev-tools';

// ...

const enableFileLog = async () => {
  if (!config.isDevelopment) return;
  await nativeDevTools.setup({
    // enabled of disabled logging
    enabled: true,
    // save logs between sessions
    preserveLog: false,
    onShake: () => {
      Alert.alert('Dev menu', undefined, [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Send',
          style: 'default',
          onPress: async () => {
            const sendResult = await nativeDevTools.sendDevLogsToDiscord({
              discord: { webhook: 'webhookUrl'},
            });
          },
        },
      ]);
    },
  });
};

```

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT
