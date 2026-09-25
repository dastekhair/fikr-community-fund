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
import { auth, googleProvider, isFirebaseConfigured } from '../lib/firebase';
import { Member, MemberRole, UserTier } from '../types';
import { INITIAL_MEMBERS } from '../lib/constants';
import { fetchMembers } from '../lib/firestore';

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: MemberRole | 'Supporter' | 'Visitor';
  tier: UserTier;
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

  // Helper to map Member to CurrentUser
  const mapMemberToUser = (m: Member, email: string, uid: string): CurrentUser => ({
    id: uid || m.id,
    name: m.name,
    email: email || m.email || '',
    role: m.role,
    tier: 'core_member',
    isTreasurer: m.role === 'Treasurer',
    isCoordinator: m.role === 'Coordinator',
    isVerificationTeam: m.role === 'Verification Team',
    isCoreMember: true,
    isActive: m.isActive
  });

  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
        if (fbUser && fbUser.email) {
          try {
            const currentMembers = await fetchMembers();
            const emailLower = fbUser.email.toLowerCase().trim();
            // Match by email or UID or name
            const match = currentMembers.find(
              m => (m.email && m.email.toLowerCase().trim() === emailLower) || m.id === fbUser.uid
            );

            if (match && match.isActive) {
              setCurrentUser(mapMemberToUser(match, fbUser.email, fbUser.uid));
            } else if (match && !match.isActive) {
              // Deactivated member
              setCurrentUser({
                id: fbUser.uid,
                name: match.name,
                email: fbUser.email,
                role: match.role,
                tier: 'public',
                isTreasurer: false,
                isCoordinator: false,
                isVerificationTeam: false,
                isCoreMember: false,
                isActive: false
              });
            } else {
              // Logged in as external supporter/donor
              setCurrentUser({
                id: fbUser.uid,
                name: fbUser.displayName || fbUser.email.split('@')[0],
                email: fbUser.email,
                role: 'Supporter',
                tier: 'supporter',
                isTreasurer: false,
                isCoordinator: false,
                isVerificationTeam: false,
                isCoreMember: false,
                isActive: true
              });
            }
          } catch (e) {
            console.error('Error matching member role:', e);
          }
        } else {
          setCurrentUser(null);
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      // If Firebase is not yet configured, check local production storage session
      const savedUser = localStorage.getItem('fikr_active_user');
      if (savedUser) {
        try {
          setCurrentUser(JSON.parse(savedUser));
        } catch {
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    }
  }, []);

  const loginWithEmail = async (email: string, pass: string) => {
    const cleanEmail = email.trim().toLowerCase();
    if (isFirebaseConfigured && auth) {
      await signInWithEmailAndPassword(auth, cleanEmail, pass);
    } else {
      // Local fallback for testing before Firebase keys are connected
      const members = await fetchMembers();
      const match = members.find(m => m.email?.toLowerCase().trim() === cleanEmail);
      if (match) {
        const user = mapMemberToUser(match, cleanEmail, match.id);
        setCurrentUser(user);
        localStorage.setItem('fikr_active_user', JSON.stringify(user));
      } else {
        const supporterUser: CurrentUser = {
          id: `sup-${Date.now()}`,
          name: cleanEmail.split('@')[0],
          email: cleanEmail,
          role: 'Supporter',
          tier: 'supporter',
          isTreasurer: false,
          isCoordinator: false,
          isVerificationTeam: false,
          isCoreMember: false,
          isActive: true
        };
        setCurrentUser(supporterUser);
        localStorage.setItem('fikr_active_user', JSON.stringify(supporterUser));
      }
    }
  };

  const registerWithEmail = async (name: string, email: string, pass: string) => {
    const cleanEmail = email.trim().toLowerCase();
    if (isFirebaseConfigured && auth) {
      await createUserWithEmailAndPassword(auth, cleanEmail, pass);
    } else {
      const supporterUser: CurrentUser = {
        id: `user-${Date.now()}`,
        name: name.trim(),
        email: cleanEmail,
        role: 'Supporter',
        tier: 'supporter',
        isTreasurer: false,
        isCoordinator: false,
        isVerificationTeam: false,
        isCoreMember: false,
        isActive: true
      };
      setCurrentUser(supporterUser);
      localStorage.setItem('fikr_active_user', JSON.stringify(supporterUser));
    }
  };

  const loginWithGoogle = async () => {
    if (isFirebaseConfigured && auth && googleProvider) {
      await signInWithPopup(auth, googleProvider);
    }
  };

  const resetPassword = async (email: string) => {
    if (isFirebaseConfigured && auth) {
      await fbSendPasswordResetEmail(auth, email.trim().toLowerCase());
    }
  };

  const logout = async () => {
    if (isFirebaseConfigured && auth) {
      await firebaseSignOut(auth);
    }
    localStorage.removeItem('fikr_active_user');
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
