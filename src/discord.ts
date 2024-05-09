import type { DiscordParams, DiscordResponse } from './types';
import { NativeModules, Platform } from 'react-native';

export const uploadToDiscord = async (
  params: DiscordParams & { logFile: string }
): DiscordResponse => {
  try {
    if (Platform.OS === 'android') {
      return await NativeModules.DevTools.post({ url: params.discord.webhook });
    }
    const f = new FormData();
    f.append('file', {
      type: 'txt',
      uri: params.logFile,
      name: 'log.txt',
    });
    console.log('🍓[Discord.uploadToDiscord]', params.logFile);
    const response = await fetch(params.discord.webhook, {
      body: f,
      method: 'POST',
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    if (response.ok) return { type: 'success' };
    return { type: 'error', message: 'errorCreateMessage' };
  } catch (e) {
    throw e;
  }
};
