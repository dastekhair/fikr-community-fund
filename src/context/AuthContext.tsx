import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail as fbSendPasswordResetEmail,
  User as FirebaseUser
} from 'firebase/auth';
import { auth, db, googleProvider, isFirebaseConfigured } from '../lib/firebase';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { Member, MemberRole, UserTier } from '../types';
import { INITIAL_MEMBERS } from '../lib/constants';
import { subscribeToMembers } from '../lib/firestore';

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: MemberRole | 'Supporter' | 'Visitor';
  tier: UserTier;
  isAdmin: boolean;
  isTreasurer: boolean;
  isCoordinator: boolean;
  isVerificationTeam: boolean;
  isCoreMember: boolean;
  isActive: boolean;
}

interface AuthContextType {
  currentUser: CurrentUser | null;
  tier: UserTier;
  loading: boolean;
  isFirebaseActive: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (name: string, email: string, pass: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [membersList, setMembersList] = useState<Member[]>(INITIAL_MEMBERS);
  const [activeFbUser, setActiveFbUser] = useState<FirebaseUser | null>(null);

  // Helper to map Member to CurrentUser
  const mapMemberToUser = (m: Member, email: string, uid: string): CurrentUser => {
    const isCore = m.isActive && (m.role === 'Admin' || m.role === 'Treasurer' || m.role === 'Coordinator' || m.role === 'Verification Team' || m.role === 'Core Member');
    return {
      id: uid || m.id,
      name: m.name,
      email: email || m.email || '',
      role: m.role,
      tier: isCore ? 'core_member' : 'supporter',
      isAdmin: m.role === 'Admin',
      isTreasurer: m.role === 'Treasurer' || m.role === 'Admin',
      isCoordinator: m.role === 'Coordinator' || m.role === 'Admin',
      isVerificationTeam: m.role === 'Verification Team',
      isCoreMember: isCore,
      isActive: m.isActive
    };
  };

  // 1. Subscribe to realtime member updates in Firestore
  useEffect(() => {
    const unsubscribeMembers = subscribeToMembers((updatedMembers) => {
      setMembersList(updatedMembers);
    });
    return () => unsubscribeMembers();
  }, []);

  // 2. Dynamically re-evaluate CurrentUser whenever membersList or activeFbUser changes
  useEffect(() => {
    if (activeFbUser && activeFbUser.email) {
      const emailLower = activeFbUser.email.toLowerCase().trim();
      const match = membersList.find(
        m => (m.email && m.email.toLowerCase().trim() === emailLower) ||
             (m.uid && m.uid === activeFbUser.uid) ||
             m.id === activeFbUser.uid
      );

      if (match) {
        // Automatic claim / migration on first login if document not keyed by Auth UID
        if (isFirebaseConfigured && db && match.id !== activeFbUser.uid) {
          const newDocPayload = {
            ...match,
            id: activeFbUser.uid,
            uid: activeFbUser.uid,
            legacyId: match.id,
            migratedAt: new Date().toISOString()
          };
          setDoc(doc(db, 'members', activeFbUser.uid), newDocPayload, { merge: true }).catch(console.error);
          updateDoc(doc(db, 'members', match.id), { migrated: true, migratedTo: activeFbUser.uid, uid: activeFbUser.uid }).catch(() => {});
        }

        if (match.isActive) {
          setCurrentUser(mapMemberToUser(match, activeFbUser.email, activeFbUser.uid));
        } else {
          // Member was deactivated by Admin
          setCurrentUser({
            id: activeFbUser.uid,
            name: match.name,
            email: activeFbUser.email,
            role: match.role,
            tier: 'public',
            isAdmin: false,
            isTreasurer: false,
            isCoordinator: false,
            isVerificationTeam: false,
            isCoreMember: false,
            isActive: false
          });
        }
      } else {
        // Logged in as external supporter
        setCurrentUser({
          id: activeFbUser.uid,
          name: activeFbUser.displayName || activeFbUser.email.split('@')[0],
          email: activeFbUser.email,
          role: 'Supporter',
          tier: 'supporter',
          isAdmin: false,
          isTreasurer: false,
          isCoordinator: false,
          isVerificationTeam: false,
          isCoreMember: false,
          isActive: true
        });
      }
    } else {
      setCurrentUser(null);
    }
  }, [membersList, activeFbUser]);

  // 3. Listen to Firebase Auth state
  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
        setActiveFbUser(fbUser);
        if (!fbUser) {
          setCurrentUser(null);
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      setLoading(false);
    }
  }, []);

  const loginWithEmail = async (email: string, pass: string) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!isFirebaseConfigured || !auth) {
      throw new Error('Configuration Error: Firebase Authentication is not configured or unavailable.');
    }
    await signInWithEmailAndPassword(auth, cleanEmail, pass);
  };

  const registerWithEmail = async (name: string, email: string, pass: string) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!isFirebaseConfigured || !auth) {
      throw new Error('Configuration Error: Firebase Authentication is not configured or unavailable.');
    }
    await createUserWithEmailAndPassword(auth, cleanEmail, pass);
  };

  const loginWithGoogle = async () => {
    if (!isFirebaseConfigured || !auth || !googleProvider) {
      throw new Error('Configuration Error: Firebase Authentication is not configured or unavailable.');
    }
    await signInWithPopup(auth, googleProvider);
  };

  const resetPassword = async (email: string) => {
    if (!isFirebaseConfigured || !auth) {
      throw new Error('Configuration Error: Firebase Authentication is not configured or unavailable.');
    }
    await fbSendPasswordResetEmail(auth, email.trim().toLowerCase());
  };

  const logout = async () => {
    if (isFirebaseConfigured && auth) {
      await firebaseSignOut(auth);
    }
    setActiveFbUser(null);
    setCurrentUser(null);
  };

  const tier: UserTier = currentUser?.tier || 'public';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        tier,
        loading,
        isFirebaseActive: isFirebaseConfigured,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        resetPassword,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
