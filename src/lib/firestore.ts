import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  orderBy,
  where,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { Member, CaseItem, CaseComment, Withdrawal, Contribution } from '../types';
import { INITIAL_MEMBERS } from './constants';

const CONFIG_ERROR_MSG = 'Configuration Error: Firebase Cloud Firestore is not configured or unavailable.';

export function formatFirestoreError(err: any): string {
  if (!err) return 'An unexpected error occurred.';
  const code = err.code || '';
  const message = err.message || '';
  if (code === 'permission-denied' || message.includes('permission-denied') || message.includes('PERMISSION_DENIED')) {
    return 'Permission Denied: Your account does not have authorization for this action. Please verify that your member role is active.';
  }
  if (code === 'unavailable' || message.includes('unavailable') || message.includes('offline') || message.includes('network')) {
    return 'Network Error: Firestore service is currently unreachable. Please check your internet connection.';
  }
  if (code === 'not-found' || message.includes('NOT_FOUND')) {
    return 'Document not found: The requested record does not exist in Firestore.';
  }
  return err.message || 'Operation failed in Cloud Firestore.';
}

/**
 * Strips undefined properties recursively so Firestore setDoc / updateDoc does not reject with:
 * "Unsupported field value: undefined"
 */
function cleanPayload<T extends Record<string, any>>(obj: T): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (
        value &&
        typeof value === 'object' &&
        !Array.isArray(value) &&
        !(value instanceof Timestamp)
      ) {
        result[key] = cleanPayload(value);
      } else {
        result[key] = value;
      }
    }
  }
  return result;
}

/**
 * Safely converts any Firestore timestamp representation to ISO string
 */
function toIsoString(val: any): string {
  if (!val) return new Date().toISOString();
  if (val instanceof Timestamp) return val.toDate().toISOString();
  if (val && typeof val.toDate === 'function') return val.toDate().toISOString();
  if (typeof val === 'string') return val;
  if (val && typeof val.seconds === 'number') return new Date(val.seconds * 1000).toISOString();
  return new Date().toISOString();
}

/* ==================== MEMBERS ==================== */

export function subscribeToMembers(callback: (members: Member[]) => void): () => void {
  if (!isFirebaseConfigured || !db) {
    console.error(CONFIG_ERROR_MSG);
    callback([]);
    return () => {};
  }

  try {
    const q = query(collection(db, 'members'));
    const unsubscribe = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const rawDocs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Member));
        // Filter out legacy documents marked with migrated: true
        const membersList = rawDocs.filter(m => m.migrated !== true);
        callback(membersList);
      } else {
        // If collection is completely uninitialized, populate with INITIAL_MEMBERS
        callback(INITIAL_MEMBERS);
      }
    }, (err) => {
      console.error('Firestore members listener error:', err);
    });
    return unsubscribe;
  } catch (e) {
    console.error('Firestore subscribeToMembers failed:', e);
    return () => {};
  }
}

export async function fetchMembers(): Promise<Member[]> {
  if (!isFirebaseConfigured || !db) {
    throw new Error(CONFIG_ERROR_MSG);
  }

  try {
    const snap = await getDocs(collection(db, 'members'));
    if (!snap.empty) {
      const rawDocs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Member));
      return rawDocs.filter(m => m.migrated !== true);
    }
    for (const mem of INITIAL_MEMBERS) {
      await setDoc(doc(db, 'members', mem.id), mem);
    }
    return INITIAL_MEMBERS;
  } catch (e: any) {
    console.error('Firestore fetchMembers error:', e);
    throw new Error(formatFirestoreError(e));
  }
}

export async function addMemberDoc(member: Omit<Member, 'id'>): Promise<Member> {
  if (!isFirebaseConfigured || !db) {
    throw new Error(CONFIG_ERROR_MSG);
  }

  const newId = `mem-${Date.now()}`;
  const fullMember: Member = { ...member, id: newId };

  try {
    await setDoc(doc(db, 'members', newId), cleanPayload(fullMember));
    return fullMember;
  } catch (e: any) {
    console.error('Firestore addMemberDoc error:', e);
    throw new Error(formatFirestoreError(e));
  }
}

export async function updateMemberDoc(id: string, updates: Partial<Member>): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    throw new Error(CONFIG_ERROR_MSG);
  }

  try {
    await updateDoc(doc(db, 'members', id), cleanPayload(updates));
  } catch (e: any) {
    console.error('Firestore updateMemberDoc error:', e);
    throw new Error(formatFirestoreError(e));
  }
}

/* ==================== CASES ==================== */

export function subscribeToCases(callback: (cases: CaseItem[]) => void): () => void {
  if (!isFirebaseConfigured || !db) {
    console.error(CONFIG_ERROR_MSG);
    callback([]);
    return () => {};
  }

  try {
    const q = query(collection(db, 'cases'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      const casesList = snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          createdAt: toIsoString(data.createdAt),
          updatedAt: toIsoString(data.updatedAt),
        } as CaseItem;
      });
      callback(casesList);
    }, (err) => {
      console.error('Firestore cases listener error:', err);
    });
    return unsubscribe;
  } catch (e) {
    console.error('Firestore subscribeToCases error:', e);
    return () => {};
  }
}

export async function fetchCases(): Promise<CaseItem[]> {
  if (!isFirebaseConfigured || !db) {
    throw new Error(CONFIG_ERROR_MSG);
  }

  try {
    const q = query(collection(db, 'cases'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          createdAt: toIsoString(data.createdAt),
          updatedAt: toIsoString(data.updatedAt),
        } as CaseItem;
      });
    }
    return [];
  } catch (e: any) {
    console.error('Firestore fetchCases error:', e);
    throw new Error(formatFirestoreError(e));
  }
}

export async function addCaseDoc(caseData: Omit<CaseItem, 'id' | 'caseNumber' | 'createdAt' | 'updatedAt'>): Promise<CaseItem> {
  if (!isFirebaseConfigured || !db) {
    throw new Error(CONFIG_ERROR_MSG);
  }

  const currentCases = await fetchCases();
  const nextNum = (currentCases.length + 1).toString().padStart(3, '0');
  const caseNumber = `CASE-${nextNum}`;
  const now = new Date().toISOString();
  const newId = `case-${Date.now()}`;

  const newCase: CaseItem = {
    ...caseData,
    id: newId,
    caseNumber,
    createdAt: now,
    updatedAt: now,
    status: 'Reported',
    agreements: []
  };

  try {
    await setDoc(doc(db, 'cases', newId), cleanPayload({
      ...newCase,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }));
    return newCase;
  } catch (e: any) {
    console.error('Firestore addCaseDoc error:', e);
    throw new Error(formatFirestoreError(e));
  }
}

export async function updateCaseDoc(id: string, updates: Partial<CaseItem>): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    throw new Error(CONFIG_ERROR_MSG);
  }

  try {
    await updateDoc(doc(db, 'cases', id), cleanPayload({
      ...updates,
      updatedAt: serverTimestamp()
    }));
  } catch (e: any) {
    console.error('Firestore updateCaseDoc error:', e);
    throw new Error(formatFirestoreError(e));
  }
}

/* ==================== COMMENTS ==================== */

export function subscribeToCaseComments(caseId: string, callback: (comments: CaseComment[]) => void): () => void {
  if (!isFirebaseConfigured || !db) {
    console.error(CONFIG_ERROR_MSG);
    callback([]);
    return () => {};
  }

  try {
    const q = query(
      collection(db, 'comments'),
      where('caseId', '==', caseId),
      orderBy('createdAt', 'asc')
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      const commentsList = snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          createdAt: toIsoString(data.createdAt)
        } as CaseComment;
      });
      callback(commentsList);
    }, (err) => {
      console.error('Firestore comments listener error:', err);
    });
    return unsubscribe;
  } catch (e) {
    console.error('Firestore subscribeToCaseComments error:', e);
    return () => {};
  }
}

export async function fetchCaseComments(caseId: string): Promise<CaseComment[]> {
  if (!isFirebaseConfigured || !db) {
    throw new Error(CONFIG_ERROR_MSG);
  }

  try {
    const q = query(
      collection(db, 'comments'),
      where('caseId', '==', caseId),
      orderBy('createdAt', 'asc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        createdAt: toIsoString(data.createdAt)
      } as CaseComment;
    });
  } catch (e: any) {
    console.error('Firestore fetchCaseComments error:', e);
    throw new Error(formatFirestoreError(e));
  }
}

export async function addCaseCommentDoc(comment: Omit<CaseComment, 'id' | 'createdAt'>): Promise<CaseComment> {
  if (!isFirebaseConfigured || !db) {
    throw new Error(CONFIG_ERROR_MSG);
  }

  const now = new Date().toISOString();
  const newId = `comm-${Date.now()}`;
  const fullComment: CaseComment = {
    ...comment,
    id: newId,
    createdAt: now
  };

  try {
    await setDoc(doc(db, 'comments', newId), cleanPayload({
      ...fullComment,
      createdAt: serverTimestamp()
    }));
    return fullComment;
  } catch (e: any) {
    console.error('Firestore addCaseCommentDoc error:', e);
    throw new Error(formatFirestoreError(e));
  }
}

/* ==================== WITHDRAWALS ==================== */

export function subscribeToWithdrawals(callback: (withdrawals: Withdrawal[]) => void): () => void {
  if (!isFirebaseConfigured || !db) {
    console.error(CONFIG_ERROR_MSG);
    callback([]);
    return () => {};
  }

  try {
    const q = query(collection(db, 'withdrawals'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      const withList = snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          timestamp: toIsoString(data.timestamp)
        } as Withdrawal;
      });
      callback(withList);
    }, (err) => {
      console.error('Firestore withdrawals listener error:', err);
    });
    return unsubscribe;
  } catch (e) {
    console.error('Firestore subscribeToWithdrawals error:', e);
    return () => {};
  }
}

export async function fetchWithdrawals(): Promise<Withdrawal[]> {
  if (!isFirebaseConfigured || !db) {
    throw new Error(CONFIG_ERROR_MSG);
  }

  try {
    const q = query(collection(db, 'withdrawals'), orderBy('timestamp', 'desc'));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          timestamp: toIsoString(data.timestamp)
        } as Withdrawal;
      });
    }
    return [];
  } catch (e: any) {
    console.error('Firestore fetchWithdrawals error:', e);
    throw new Error(formatFirestoreError(e));
  }
}

export async function addWithdrawalDoc(wData: Omit<Withdrawal, 'id' | 'timestamp'>): Promise<Withdrawal> {
  if (!isFirebaseConfigured || !db) {
    throw new Error(CONFIG_ERROR_MSG);
  }

  const now = new Date().toISOString();
  const newId = `w-${Date.now()}`;
  const newW: Withdrawal = {
    ...wData,
    id: newId,
    timestamp: now
  };

  try {
    await setDoc(doc(db, 'withdrawals', newId), cleanPayload({
      ...newW,
      timestamp: serverTimestamp()
    }));
    return newW;
  } catch (e: any) {
    console.error('Firestore addWithdrawalDoc error:', e);
    throw new Error(formatFirestoreError(e));
  }
}

/* ==================== CONTRIBUTIONS ==================== */

export function subscribeToContributions(callback: (contributions: Contribution[]) => void): () => void {
  if (!isFirebaseConfigured || !db) {
    console.error(CONFIG_ERROR_MSG);
    callback([]);
    return () => {};
  }

  try {
    const q = query(collection(db, 'contributions'), orderBy('paidAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      const contribList = snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          paidAt: toIsoString(data.paidAt)
        } as Contribution;
      });
      callback(contribList);
    }, (err) => {
      console.error('Firestore contributions listener error:', err);
    });
    return unsubscribe;
  } catch (e) {
    console.error('Firestore subscribeToContributions error:', e);
    return () => {};
  }
}

export async function fetchContributions(): Promise<Contribution[]> {
  if (!isFirebaseConfigured || !db) {
    throw new Error(CONFIG_ERROR_MSG);
  }

  try {
    const q = query(collection(db, 'contributions'), orderBy('paidAt', 'desc'));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          paidAt: toIsoString(data.paidAt)
        } as Contribution;
      });
    }
    return [];
  } catch (e: any) {
    console.error('Firestore fetchContributions error:', e);
    throw new Error(formatFirestoreError(e));
  }
}

export async function saveContributionDoc(contrib: Contribution): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    throw new Error(CONFIG_ERROR_MSG);
  }

  try {
    await setDoc(doc(db, 'contributions', contrib.id), cleanPayload(contrib));
  } catch (e: any) {
    console.error('Firestore saveContributionDoc error:', e);
    throw new Error(formatFirestoreError(e));
  }
}

export async function importContributionsBatch(contributions: Contribution[]): Promise<{ success: number; failed: number }> {
  if (!isFirebaseConfigured || !db) {
    throw new Error(CONFIG_ERROR_MSG);
  }

  try {
    const batchSize = 450;
    for (let i = 0; i < contributions.length; i += batchSize) {
      const chunk = contributions.slice(i, i + batchSize);
      const batch = writeBatch(db);
      for (const c of chunk) {
        const ref = doc(db, 'contributions', c.id);
        batch.set(ref, cleanPayload(c));
      }
      await batch.commit();
    }
    return { success: contributions.length, failed: 0 };
  } catch (e: any) {
    console.error('Batch import Firestore error:', e);
    throw new Error(formatFirestoreError(e));
  }
}
