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
import { INITIAL_CASES, INITIAL_COMMENTS, INITIAL_WITHDRAWALS, INITIAL_CONTRIBUTIONS } from './mockData';

// Storage keys for local/demo mode
const LOCAL_STORAGE_KEYS = {
  MEMBERS: 'fikr_local_members_v2',
  CASES: 'fikr_local_cases_v2',
  COMMENTS: 'fikr_local_comments_v2',
  WITHDRAWALS: 'fikr_local_withdrawals_v2',
  CONTRIBUTIONS: 'fikr_local_contributions_v2',
};

function getLocal<T>(key: string, defaultVal: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(defaultVal));
      return defaultVal;
    }
    return JSON.parse(raw);
  } catch {
    return defaultVal;
  }
}

function setLocal<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('LocalStorage error:', err);
  }
}

/* ==================== MEMBERS ==================== */

export function subscribeToMembers(callback: (members: Member[]) => void): () => void {
  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, 'members'));
      const unsubscribe = onSnapshot(q, (snap) => {
        if (!snap.empty) {
          const rawDocs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Member));
          // Filter out legacy documents marked with migrated: true
          const membersList = rawDocs.filter(m => m.migrated !== true);
          callback(membersList);
        } else {
          // If empty, initialize with default members
          callback(INITIAL_MEMBERS);
        }
      }, (err) => {
        console.warn('Firestore members listener error, falling back to local/static:', err);
        const localList = getLocal<Member[]>(LOCAL_STORAGE_KEYS.MEMBERS, INITIAL_MEMBERS);
        callback(localList.filter(m => m.migrated !== true));
      });
      return unsubscribe;
    } catch (e) {
      console.warn('Firestore subscribeToMembers failed:', e);
    }
  }

  const localList = getLocal<Member[]>(LOCAL_STORAGE_KEYS.MEMBERS, INITIAL_MEMBERS);
  callback(localList.filter(m => m.migrated !== true));
  return () => {};
}

export async function fetchMembers(): Promise<Member[]> {
  if (isFirebaseConfigured && db) {
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
    } catch (e) {
      console.warn('Firestore fetchMembers fallback:', e);
    }
  }
  const localList = getLocal<Member[]>(LOCAL_STORAGE_KEYS.MEMBERS, INITIAL_MEMBERS);
  return localList.filter(m => m.migrated !== true);
}

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

export async function addMemberDoc(member: Omit<Member, 'id'>): Promise<Member> {
  const newId = `mem-${Date.now()}`;
  const fullMember: Member = { ...member, id: newId };

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'members', newId), fullMember);
      return fullMember;
    } catch (e: any) {
      console.error('Firestore addMemberDoc error:', e);
      throw new Error(formatFirestoreError(e));
    }
  }

  const current = getLocal<Member[]>(LOCAL_STORAGE_KEYS.MEMBERS, INITIAL_MEMBERS);
  const updated = [...current, fullMember];
  setLocal(LOCAL_STORAGE_KEYS.MEMBERS, updated);
  return fullMember;
}

export async function updateMemberDoc(id: string, updates: Partial<Member>): Promise<void> {
  if (isFirebaseConfigured && db) {
    try {
      await updateDoc(doc(db, 'members', id), updates);
      return;
    } catch (e: any) {
      console.error('Firestore updateMemberDoc error:', e);
      throw new Error(formatFirestoreError(e));
    }
  }

  const current = getLocal<Member[]>(LOCAL_STORAGE_KEYS.MEMBERS, INITIAL_MEMBERS);
  const updated = current.map(m => m.id === id ? { ...m, ...updates } : m);
  setLocal(LOCAL_STORAGE_KEYS.MEMBERS, updated);
}

/* ==================== CASES ==================== */

export function subscribeToCases(callback: (cases: CaseItem[]) => void): () => void {
  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, 'cases'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snap) => {
        const casesList = snap.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : (data.createdAt || new Date().toISOString()),
            updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : (data.updatedAt || new Date().toISOString()),
          } as CaseItem;
        });
        callback(casesList);
      }, (err) => {
        console.warn('Firestore cases listener error:', err);
        callback(getLocal<CaseItem[]>(LOCAL_STORAGE_KEYS.CASES, INITIAL_CASES));
      });
      return unsubscribe;
    } catch (e) {
      console.warn('Firestore subscribeToCases error:', e);
    }
  }

  callback(getLocal<CaseItem[]>(LOCAL_STORAGE_KEYS.CASES, INITIAL_CASES));
  return () => {};
}

export async function fetchCases(): Promise<CaseItem[]> {
  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, 'cases'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
            updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
          } as CaseItem;
        });
      }
      return [];
    } catch (e) {
      console.warn('Firestore fetchCases error:', e);
    }
  }
  return getLocal<CaseItem[]>(LOCAL_STORAGE_KEYS.CASES, INITIAL_CASES);
}

export async function addCaseDoc(caseData: Omit<CaseItem, 'id' | 'caseNumber' | 'createdAt' | 'updatedAt'>): Promise<CaseItem> {
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

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'cases', newId), {
        ...newCase,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return newCase;
    } catch (e: any) {
      console.error('Firestore addCaseDoc error:', e);
      throw new Error(formatFirestoreError(e));
    }
  }

  const updated = [newCase, ...currentCases];
  setLocal(LOCAL_STORAGE_KEYS.CASES, updated);
  return newCase;
}

export async function updateCaseDoc(id: string, updates: Partial<CaseItem>): Promise<void> {
  const now = new Date().toISOString();
  if (isFirebaseConfigured && db) {
    try {
      await updateDoc(doc(db, 'cases', id), {
        ...updates,
        updatedAt: serverTimestamp()
      });
      return;
    } catch (e: any) {
      console.error('Firestore updateCaseDoc error:', e);
      throw new Error(formatFirestoreError(e));
    }
  }

  const current = getLocal<CaseItem[]>(LOCAL_STORAGE_KEYS.CASES, INITIAL_CASES);
  const updated = current.map(c => c.id === id ? { ...c, ...updates, updatedAt: now } : c);
  setLocal(LOCAL_STORAGE_KEYS.CASES, updated);
}

/* ==================== COMMENTS ==================== */

export function subscribeToCaseComments(caseId: string, callback: (comments: CaseComment[]) => void): () => void {
  if (isFirebaseConfigured && db) {
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
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : (data.createdAt || new Date().toISOString())
          } as CaseComment;
        });
        callback(commentsList);
      }, (err) => {
        console.warn('Firestore comments listener error:', err);
        const allComments = getLocal<CaseComment[]>(LOCAL_STORAGE_KEYS.COMMENTS, INITIAL_COMMENTS);
        callback(allComments.filter(c => c.caseId === caseId));
      });
      return unsubscribe;
    } catch (e) {
      console.warn('Firestore subscribeToCaseComments error:', e);
    }
  }

  const allComments = getLocal<CaseComment[]>(LOCAL_STORAGE_KEYS.COMMENTS, INITIAL_COMMENTS);
  callback(allComments.filter(c => c.caseId === caseId));
  return () => {};
}

export async function fetchCaseComments(caseId: string): Promise<CaseComment[]> {
  if (isFirebaseConfigured && db) {
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
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt
        } as CaseComment;
      });
    } catch (e) {
      console.warn('Firestore fetchCaseComments error:', e);
    }
  }

  const allComments = getLocal<CaseComment[]>(LOCAL_STORAGE_KEYS.COMMENTS, INITIAL_COMMENTS);
  return allComments.filter(c => c.caseId === caseId);
}

export async function addCaseCommentDoc(comment: Omit<CaseComment, 'id' | 'createdAt'>): Promise<CaseComment> {
  const now = new Date().toISOString();
  const newId = `comm-${Date.now()}`;
  const fullComment: CaseComment = {
    ...comment,
    id: newId,
    createdAt: now
  };

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'comments', newId), {
        ...fullComment,
        createdAt: serverTimestamp()
      });
      return fullComment;
    } catch (e: any) {
      console.error('Firestore addCaseCommentDoc error:', e);
      throw new Error(formatFirestoreError(e));
    }
  }

  const current = getLocal<CaseComment[]>(LOCAL_STORAGE_KEYS.COMMENTS, INITIAL_COMMENTS);
  setLocal(LOCAL_STORAGE_KEYS.COMMENTS, [...current, fullComment]);
  return fullComment;
}

/* ==================== WITHDRAWALS ==================== */

export function subscribeToWithdrawals(callback: (withdrawals: Withdrawal[]) => void): () => void {
  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, 'withdrawals'), orderBy('timestamp', 'desc'));
      const unsubscribe = onSnapshot(q, (snap) => {
        const withList = snap.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toDate().toISOString() : (data.timestamp || new Date().toISOString())
          } as Withdrawal;
        });
        callback(withList);
      }, (err) => {
        console.warn('Firestore withdrawals listener error:', err);
        callback(getLocal<Withdrawal[]>(LOCAL_STORAGE_KEYS.WITHDRAWALS, INITIAL_WITHDRAWALS));
      });
      return unsubscribe;
    } catch (e) {
      console.warn('Firestore subscribeToWithdrawals error:', e);
    }
  }

  callback(getLocal<Withdrawal[]>(LOCAL_STORAGE_KEYS.WITHDRAWALS, INITIAL_WITHDRAWALS));
  return () => {};
}

export async function fetchWithdrawals(): Promise<Withdrawal[]> {
  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, 'withdrawals'), orderBy('timestamp', 'desc'));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toDate().toISOString() : data.timestamp
          } as Withdrawal;
        });
      }
      return [];
    } catch (e) {
      console.warn('Firestore fetchWithdrawals error:', e);
    }
  }
  return getLocal<Withdrawal[]>(LOCAL_STORAGE_KEYS.WITHDRAWALS, INITIAL_WITHDRAWALS);
}

export async function addWithdrawalDoc(wData: Omit<Withdrawal, 'id' | 'timestamp'>): Promise<Withdrawal> {
  const now = new Date().toISOString();
  const newId = `w-${Date.now()}`;
  const newW: Withdrawal = {
    ...wData,
    id: newId,
    timestamp: now
  };

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'withdrawals', newId), {
        ...newW,
        timestamp: serverTimestamp()
      });
      return newW;
    } catch (e: any) {
      console.error('Firestore addWithdrawalDoc error:', e);
      throw new Error(formatFirestoreError(e));
    }
  }

  const current = getLocal<Withdrawal[]>(LOCAL_STORAGE_KEYS.WITHDRAWALS, INITIAL_WITHDRAWALS);
  setLocal(LOCAL_STORAGE_KEYS.WITHDRAWALS, [newW, ...current]);
  return newW;
}

/* ==================== CONTRIBUTIONS ==================== */

export function subscribeToContributions(callback: (contributions: Contribution[]) => void): () => void {
  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, 'contributions'), orderBy('paidAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snap) => {
        const contribList = snap.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            paidAt: data.paidAt instanceof Timestamp ? data.paidAt.toDate().toISOString() : (data.paidAt || new Date().toISOString())
          } as Contribution;
        });
        callback(contribList);
      }, (err) => {
        console.warn('Firestore contributions listener error:', err);
        callback(getLocal<Contribution[]>(LOCAL_STORAGE_KEYS.CONTRIBUTIONS, INITIAL_CONTRIBUTIONS));
      });
      return unsubscribe;
    } catch (e) {
      console.warn('Firestore subscribeToContributions error:', e);
    }
  }

  callback(getLocal<Contribution[]>(LOCAL_STORAGE_KEYS.CONTRIBUTIONS, INITIAL_CONTRIBUTIONS));
  return () => {};
}

export async function fetchContributions(): Promise<Contribution[]> {
  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, 'contributions'), orderBy('paidAt', 'desc'));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            paidAt: data.paidAt instanceof Timestamp ? data.paidAt.toDate().toISOString() : data.paidAt
          } as Contribution;
        });
      }
      return [];
    } catch (e) {
      console.warn('Firestore fetchContributions error:', e);
    }
  }
  return getLocal<Contribution[]>(LOCAL_STORAGE_KEYS.CONTRIBUTIONS, INITIAL_CONTRIBUTIONS);
}

export async function saveContributionDoc(contrib: Contribution): Promise<void> {
  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'contributions', contrib.id), contrib);
      return;
    } catch (e: any) {
      console.error('Firestore saveContributionDoc error:', e);
      throw new Error(formatFirestoreError(e));
    }
  }

  const current = getLocal<Contribution[]>(LOCAL_STORAGE_KEYS.CONTRIBUTIONS, INITIAL_CONTRIBUTIONS);
  const exists = current.some(c => c.id === contrib.id);
  const updated = exists ? current.map(c => c.id === contrib.id ? contrib : c) : [contrib, ...current];
  setLocal(LOCAL_STORAGE_KEYS.CONTRIBUTIONS, updated);
}

export async function importContributionsBatch(contributions: Contribution[]): Promise<{ success: number; failed: number }> {
  if (isFirebaseConfigured && db) {
    try {
      const batchSize = 450;
      for (let i = 0; i < contributions.length; i += batchSize) {
        const chunk = contributions.slice(i, i + batchSize);
        const batch = writeBatch(db);
        for (const c of chunk) {
          const ref = doc(db, 'contributions', c.id);
          batch.set(ref, c);
        }
        await batch.commit();
      }
      return { success: contributions.length, failed: 0 };
    } catch (e: any) {
      console.error('Batch import Firestore error:', e);
      throw new Error(formatFirestoreError(e));
    }
  }

  // Local storage save
  const current = getLocal<Contribution[]>(LOCAL_STORAGE_KEYS.CONTRIBUTIONS, INITIAL_CONTRIBUTIONS);
  const updated = [...contributions, ...current];
  setLocal(LOCAL_STORAGE_KEYS.CONTRIBUTIONS, updated);
  return { success: contributions.length, failed: 0 };
}
