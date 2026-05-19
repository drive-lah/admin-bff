// Per-agent UUID registry. Same SG_COLLECTIONS_AGENT_UUID is committed in:
//   ai-collection-agents/apps/api/src/monitor/types.ts

export const AU_COLLECTIONS_AGENT_UUID = 'a19c35a3-f2ab-532f-a493-64a5fe9e88ff';
export const AU_CHAT_AGENT_UUID = '1986da29-e8b8-5f55-b51e-e6181fd37c94';
export const AU_LISTING_AGENT_UUID = 'f8e9d3a5-4b6c-4d8e-9f2a-1c3d5e7f9b1a';
export const AU_VERIFICATION_AGENT_UUID = 'ae9486f7-688b-4278-bae9-541751ce2b5c';
export const SG_COLLECTIONS_AGENT_UUID = '2a9eac6c-73f8-4b3b-8865-e9f806cdabdf';

export type Market = 'AU' | 'SG';

export const AGENT_MARKET = new Map<string, Market>([
  [AU_COLLECTIONS_AGENT_UUID, 'AU'],
  [AU_CHAT_AGENT_UUID, 'AU'],
  [AU_LISTING_AGENT_UUID, 'AU'],
  [AU_VERIFICATION_AGENT_UUID, 'AU'],
  [SG_COLLECTIONS_AGENT_UUID, 'SG'],
]);

export const RENAME = new Map<string, string>([
  [AU_COLLECTIONS_AGENT_UUID, 'AU Collections Agent'],
  [SG_COLLECTIONS_AGENT_UUID, 'SG Collections Agent'],
]);
