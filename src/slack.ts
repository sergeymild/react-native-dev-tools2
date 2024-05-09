import type { SlackResponse, UploadParams } from './types';
import { Platform } from 'react-native';

const makePublic = async (id: string, token: string) => {
  const publicResponse = await fetch(
    `https://slack.com/api/files.sharedPublicURL?file=${id}`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return publicResponse.json();
};

const uploadFile = async (params: {
  filename: string;
  path: string;
  type: string;
  token: string;
  channel: string;
  content?: string;
}) => {
  const f = new FormData();
  f.append('file', {
    type: params.type,
    uri: params.path,
    name: params.filename,
  });
  f.append('token', params.token);
  const rsp = await fetch(`https://slack.com/api/files.upload`, {
    method: 'POST',
    body: f,
  });
  let json = await rsp.json();
  if (!json.ok) return undefined;
  const response = await makePublic(json.file.id, params.token);

  //https://files.slack.com/files-pri/{team_id}-{file_id}/{filename}?pub_secret={pub_secret}
  //https://slack-files.com/{team_id}-{file_id}-{pub_secret}
  const link = response.file.permalink_public.replace(
    'https://slack-files.com/',
    ''
  );
  const [teamId, fileId, pubSecret] = link.split('-');
  return `https://files.slack.com/files-pri/${teamId}-${fileId}/${params.filename}?pub_secret=${pubSecret}`;
};

export const uploadToSlack = async (params: UploadParams): SlackResponse => {
  try {
    let logLink = '';

    let uploadStatus = await uploadFile({
      filename: 'log.txt',
      path: params.logFilePath,
      type: 'txt',
      token: params.slack.token2,
      channel: params.slack.channel,
    });

    if (!uploadStatus) return { type: 'error', message: 'errorUploadLogFile' };
    logLink = uploadStatus;

    const blocks: any[] = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `:point_down: Log (${Platform.OS.toUpperCase()})`,
          emoji: true,
        },
      },
    ];

    if (logLink) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `<${logLink}|Show logs>`,
        },
      });
    }

    let response = await fetch(`https://slack.com/api/chat.postMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${params.slack.token}`,
      },
      body: JSON.stringify({
        channel: params.slack.channel,
        attachments: [
          {
            color: '#f2c744',
            blocks: blocks,
          },
        ],
      }),
    });

    const json = await response.json();
    if (json.ok) return { type: 'success' };
    else
      console.log(
        '[Slack.uploadToSlack]\n',
        JSON.stringify(json, undefined, 2)
      );
    return { type: 'error', message: 'errorCreateMessage' };
  } catch (e) {
    console.log('[Slack.uploadToSlack.error]', e);
    throw e;
  }
};
