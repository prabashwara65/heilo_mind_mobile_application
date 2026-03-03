import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "expo-router";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, firestore } from "@/config/firebase";

export type UserType = {
  uid: string;
  email: string | null;
  name: string | null;
  image?: string | null;
} | null;

type AuthContextType = {
  user: UserType;
  setUser: React.Dispatch<React.SetStateAction<UserType>>;
  login: (email: string, password: string) => Promise<any>;
  register: (email: string, password: string, name: string) => Promise<any>;
  logout: () => Promise<void>;
  updateUserData: (uid: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserType>(null);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await updateUserData(firebaseUser.uid);
        router.replace("/(tabs)/home");
      } else {
        setUser(null);
        router.replace("/(auth)/welcome");
      }
    });

    return () => unsub();
  }, []);

  // ================= LOGIN =================
  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (error: any) {
      let msg = error.message;

      if (msg.includes("(auth/invalid-credential)")) msg = "Wrong Credentials";
      if (msg.includes("(auth/invalid-email)")) msg = "Invalid Email";

      return { success: false, msg };
    }
  };

  // ================= REGISTER =================
  const register = async (email: string, password: string, name: string) => {
    try {
      const response = await createUserWithEmailAndPassword(auth, email, password);

      if (!response.user) {
        return { success: false, msg: "User creation failed" };
      }

      // Update display name in Firebase Auth
      await updateProfile(response.user, {
        displayName: name,
      });

      // Save user to Firestore
      await setDoc(doc(firestore, "users", response.user.uid), {
        uid: response.user.uid,
        name,
        email,
        image: null,
        createdAt: new Date(),
      });

      return { success: true };
    } catch (error: any) {
      let msg = error.message;

      if (msg.includes("(auth/email-already-in-use)"))
        msg = "This email is already in use";

      if (msg.includes("(auth/invalid-email)"))
        msg = "Invalid Email";

      if (msg.includes("(permission-denied)"))
        msg = "Firestore permission denied. Check rules.";

      return { success: false, msg };
    }
  };

  // ================= FETCH USER DATA =================
  const updateUserData = async (uid: string) => {
    try {
      const docRef = doc(firestore, "users", uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();

        setUser({
          uid: data.uid,
          email: data.email || null,
          name: data.name || null,
          image: data.image || null,
        });
      }
    } catch (error) {
      console.log("Error fetching user data:", error);
    }
  };

  // ================= LOGOUT =================
  const logout = async () => {
    await signOut(auth);
  };

  const contextValue: AuthContextType = {
    user,
    setUser,
    login,
    register,
    logout,
    updateUserData,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be wrapped inside AuthProvider");
  }
  return context;
};