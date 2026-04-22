import React, { useState, useEffect } from "react";
import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { UserProfile, Role } from "../../types";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { LogIn, Loader2, GraduationCap } from "lucide-react";
import { motion } from "motion/react";

export function AuthGate({ children }: { children: (user: UserProfile) => React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        if (userDoc.exists()) {
          setUser(userDoc.data() as UserProfile);
        } else {
          // Create new user profile. Upgrade specific emails to admin.
          const isAdminEmail = firebaseUser.email === "ivatar1066@gmail.com";
          const newProfile: UserProfile = {
            uid: firebaseUser.uid,
            fullName: firebaseUser.displayName || "Usuario",
            email: firebaseUser.email || "",
            role: isAdminEmail ? "admin" : "student",
            photoURL: firebaseUser.photoURL || undefined,
            theme: "light",
          };
          await setDoc(doc(db, "users", firebaseUser.uid), newProfile);
          setUser(newProfile);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
  }, []);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login Error:", error);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505] p-4 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none" />
        
        <motion.div
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ duration: 0.5 }}
           className="z-10 w-full max-w-md"
        >
          <div className="glass p-12 rounded-[40px] border-white/10 shadow-2xl relative">
            <div className="text-center space-y-8">
              <div className="space-y-4">
                <div className="mx-auto w-20 h-20 bg-indigo-600 rounded-[28px] flex items-center justify-center shadow-glow border border-white/20">
                  <GraduationCap className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h1 className="text-5xl font-800 tracking-tighter uppercase italic text-indigo-500 leading-none">EduStream_</h1>
                  <p className="text-[10px] uppercase tracking-[0.4em] opacity-40 mt-2 font-bold">Next Generation Learning</p>
                </div>
              </div>

              <div className="space-y-6">
                <p className="text-sm font-medium opacity-60 px-4">
                  Accede a la plataforma líder en educación tecnológica y perfecciona tus habilidades.
                </p>
                
                <Button 
                  onClick={handleLogin} 
                  className="w-full h-14 bg-white text-black hover:bg-neutral-200 text-xs font-800 uppercase tracking-widest rounded-2xl flex gap-3 shadow-glow"
                >
                  <LogIn className="w-4 h-4" />
                  Conectarse con Google_
                </Button>
                
                <div className="text-[9px] uppercase tracking-widest opacity-30 font-bold">
                  Platform Core v2.4 stable build
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return <>{children(user)}</>;
}
