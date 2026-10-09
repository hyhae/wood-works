import type { Draft } from '../types';
import { validateContent } from './validation';

function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('woodwork-cms', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('drafts');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('Browser storage is unavailable. Allow site storage or use a different browser.'));
    request.onblocked = () => reject(new Error('Close other Woodwork tabs and try again.'));
  });
}
export async function loadDraft(): Promise<Draft | null> {
  const db = await database();
  try {
    return await new Promise((resolve, reject) => {
      const request = db.transaction('drafts').objectStore('drafts').get('current');
      request.onsuccess = () => {
        try { const value = request.result; resolve(value ? { content: validateContent(value.content), assets: value.assets } : null); }
        catch { reject(new Error('The saved draft is invalid. Import a valid backup to recover it.')); }
      };
      request.onerror = () => reject(new Error('Could not read the draft. Please retry or restore a backup.'));
    });
  } finally { db.close(); }
}
export async function saveDraft(draft: Draft): Promise<void> {
  validateContent(draft.content);
  const db = await database();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('drafts', 'readwrite');
      tx.objectStore('drafts').put(draft, 'current');
      tx.oncomplete = () => resolve();
      tx.onabort = tx.onerror = () => reject(new Error('Draft not saved. Browser storage may be full or disabled. Export a backup before clearing storage, then retry.'));
    });
  } finally { db.close(); }
}
