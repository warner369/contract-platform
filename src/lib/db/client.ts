import { getCloudflareContext } from '@opennextjs/cloudflare';
import { cache } from 'react';

export function getDb() {
  const { env } = getCloudflareContext();
  return env.DB;
}

export const getCachedDb = cache(() => {
  const { env } = getCloudflareContext();
  return env.DB;
});