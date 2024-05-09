export type FileNotExists = 'notExists';

export interface UploadParams {
  logFilePath: string;
  slack: {
    token: string;
    token2: string;
    channel: string;
  };
}

export interface DiscordParams {
  discord: {
    webhook: string;
  };
}

type SlackError = {
  type: 'error';
  message: 'errorCreateMessage' | 'errorUploadLogFile' | Error;
};

type SlackSuccess = {
  type: 'success';
};

export type SlackResponse = Promise<SlackSuccess | SlackError>;

type DiscordError = {
  type: 'error';
  message: 'errorCreateMessage' | 'errorUploadLogFile' | Error;
};

type DiscordSuccess = {
  type: 'success';
};

export type DiscordResponse = Promise<DiscordSuccess | DiscordError>;

export interface DevToolsPresentResult {
  logFilePath: string;
}
