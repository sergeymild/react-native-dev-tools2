import { NativeEventEmitter, NativeModules, Platform } from 'react-native';

import type {
  DevToolsPresentResult,
  DiscordParams,
  DiscordResponse,
  FileNotExists,
  SlackResponse,
  UploadParams,
} from './types';
import { uploadToSlack } from './slack';
import { uploadToDiscord } from './discord';
import { onFbPress } from "src/utils/social.utils.ts";

interface IDevTools {
  writeLog(message: string): void;
  logPath(): string;
  deleteLogFile(): string;
  existsFile(): boolean;
}

declare global {
  var devTools: IDevTools;
}

const LINKING_ERROR =
  `The package 'react-native-dev' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo managed workflow\n';

const DevTools = NativeModules.DevTools
  ? NativeModules.DevTools
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      }
    );

const devToolsEmitter = new NativeEventEmitter(DevTools);

const MOSCOW_TIMEZONE_OFFSET = -180;

export enum LogLevel {
  NONE,
  ERROR,
  WARN,
  LOG,
  DEBUG,

  TRACE,
}

class _DevTools {
  private onShake?: () => void;
  constructor() {
    devToolsEmitter.addListener('DevToolsData', () => {
      this.onShake?.();
    });
  }

  async logFile(): Promise<string> {
    if (Platform.OS === 'android') {
      return DevTools.logPath();
    }
    return global.devTools.logPath();
  }

  async setup(options: {
    enabled: boolean;
    preserveLog?: boolean;
    onShake?: () => void;
    overrideLogs?: boolean;
  }) {
    console.log('🍓[Index.setup]', options, DevTools);
    if (!options.enabled) return;
    if (options.onShake) {
      if (Platform.OS === 'android') await DevTools.enableShaker(true, !options.preserveLog);
      else {
        if (!options.preserveLog) {
          nativeDevTools.deleteLogFile()
          DevTools.enableShaker(true)
        }
      }
    }
    this.onShake = options.onShake;

    if (options.overrideLogs ?? true) {
      const originalLogs = console.log;
      const originalErrorLogs = console.error;
      const originalWarnLogs = console.warn;
      console.log = (message?: any, ...optionalParams: any[]) => {
        try {
          originalLogs(message, ...optionalParams);
          nativeDevTools.log(message, JSON.stringify(optionalParams));
        } catch {}
      };
      console.warn = (message?: any, ...optionalParams: any[]) => {
        try {
          originalWarnLogs(message, ...optionalParams);
          nativeDevTools.warn(message, JSON.stringify(optionalParams));
        } catch {}
      };
      console.error = (message?: any, ...optionalParams: any[]) => {
        try {
          originalErrorLogs(message, ...optionalParams);
          nativeDevTools.error(message, JSON.stringify(optionalParams));
        } catch {}
      };
    }
  }

  private logLevel: LogLevel = LogLevel.LOG;

  error = (message: string, ...optionalParams: any[]) =>
    this.sendLog(message, LogLevel.ERROR, optionalParams);
  warn = (message: string, ...optionalParams: any[]) =>
    this.sendLog(message, LogLevel.WARN, optionalParams);
  log = (message: string, ...optionalParams: any[]) =>
    this.sendLog(message, LogLevel.LOG, optionalParams);
  debug = (message: string, ...optionalParams: any[]) =>
    this.sendLog(message, LogLevel.DEBUG, optionalParams);
  trace = (message: string, ...optionalParams: any[]) =>
    this.sendLog(message, LogLevel.TRACE, optionalParams);

  private sendLog(message: string, level: LogLevel, ...optionalParams: any[]) {
    if (this.logLevel < level) return;
    const log = makeLogString(level, message, optionalParams);
    if (Platform.OS === 'android') DevTools.writeLog(log);
    else global.devTools.writeLog(log);
  }

  deleteLogFile() {
    if (Platform.OS === 'ios') {
      global.devTools.deleteLogFile();
    } else {
      DevTools.deleteLogFile();
    }
  }

  async sendDevLogsToSlack(
    params: UploadParams
  ): Promise<SlackResponse | FileNotExists> {
    return uploadToSlack(params);
  }

  async sendDevLogsToDiscord(
    params: DiscordParams
  ): Promise<DiscordResponse | FileNotExists> {
    const exists = await existsFile();
    if (!exists) return 'notExists';
    return await uploadToDiscord({ ...params, logFile: await this.logFile() });
  }
}

const existsFile = (): Promise<boolean> => {
  if (Platform.OS === 'ios') {
    return Promise.resolve(global.devTools.existsFile());
  } else {
    return DevTools.existsFile();
  }
};

const makeLogString = (
  level: LogLevel,
  message: string,
  ...optionalParams: any[]
): string => {
  const date = getMoscowDate();
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const DD = pad(day);
  const MM = pad(month);
  const HH = pad(date.getHours());
  const mm = pad(date.getMinutes());
  const ss = pad(date.getSeconds());
  const time = `${DD}.${MM}.${date.getFullYear()} ${HH}:${mm}:${ss}`;
  let error = optionalParams.join(', ');

  let type = '?';
  switch (level) {
    case LogLevel.ERROR:
      type = 'ERROR';
      break;
    case LogLevel.WARN:
      type = 'WARN';
      break;
    case LogLevel.LOG:
      type = 'LOG';
      break;
    case LogLevel.DEBUG:
      type = 'DEBUG';
      break;
    case LogLevel.TRACE:
      type = 'TRACE';
      break;
  }
  return `📠 [${time} ${type}]: ▸ ${message} ${error}\n`;
};

const pad = (value: number): string => {
  return value < 10 ? `0${value}` : value.toString(10);
};

const getMoscowDate = (): Date => {
  const date = new Date();
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds()
    ) +
      date.getTimezoneOffset() * 60000 -
      MOSCOW_TIMEZONE_OFFSET * 60000
  );
};

export const nativeDevTools = new _DevTools();
export type { DevToolsPresentResult };
