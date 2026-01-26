export const onesignalConfig = {
  appId: process.env.ONESIGNAL_APP_ID || '',
  restApiKey: process.env.ONESIGNAL_REST_API_KEY || '',
  apiUrl: 'https://onesignal.com/api/v1',
} as const;
