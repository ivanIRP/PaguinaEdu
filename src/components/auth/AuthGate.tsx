import React, { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile 
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { UserProfile } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Loader2, GraduationCap, Mail, User, Lock, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

type AuthMode = "google" | "login" | "register";

export function AuthGate({ children }: { children: (user: UserProfile) => React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState<AuthMode>("google");
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        if (userDoc.exists()) {
          setUser(userDoc.data() as UserProfile);
        } else {
          // Create new user profile for first-time login
          const isAdminEmail = firebaseUser.email === "ivatar1066@gmail.com";
          const newProfile: UserProfile = {
            uid: firebaseUser.uid,
            fullName: firebaseUser.displayName || fullName || "Usuario",
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
  }, [fullName]);

  const handleGoogleLogin = async () => {
    try {
      setError(null);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setAuthLoading(true);

    try {
      if (authMode === "register") {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(res.user, { displayName: fullName });
        // User profile creation is handled by useEffect
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#050505]">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
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
          <div className="glass p-8 md:p-12 rounded-[40px] border-white/10 shadow-2xl relative">
            <AnimatePresence mode="wait">
              {authMode === "google" && (
                <motion.div
                  key="google"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="text-center space-y-8"
                >
                  <div className="space-y-4">
                    <div className="mx-auto w-20 h-20 bg-indigo-600 rounded-[28px] flex items-center justify-center shadow-glow border border-white/20">
                      <GraduationCap className="w-10 h-10 text-white" />
                    </div>
                    <div>
                      <h1 className="text-5xl font-800 tracking-tighter uppercase italic text-indigo-500 leading-none">EduStream_</h1>
                      <p className="text-[10px] uppercase tracking-[0.4em] opacity-40 mt-2 font-bold">Next Generation Learning</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Button 
                      onClick={handleGoogleLogin} 
                      className="w-full h-14 bg-white text-black hover:bg-neutral-200 text-xs font-800 uppercase tracking-widest rounded-2xl flex gap-3 shadow-glow"
                    >
                      <LogIn className="w-4 h-4" />
                      Conectarse con Google_
                    </Button>
                    
                    <div className="flex items-center gap-4 py-2">
                       <div className="h-px flex-1 bg-white/10" />
                       <span className="text-[10px] font-bold uppercase opacity-30">o también</span>
                       <div className="h-px flex-1 bg-white/10" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <Button 
                         variant="outline" 
                         onClick={() => setAuthMode("login")}
                         className="border-white/10 bg-white/5 hover:bg-white/10 text-white uppercase text-[10px] font-800 tracking-widest h-12 rounded-xl"
                       >
                         Email Login
                       </Button>
                       <Button 
                         variant="outline" 
                         onClick={() => setAuthMode("register")}
                         className="border-white/10 bg-white/5 hover:bg-white/10 text-white uppercase text-[10px] font-800 tracking-widest h-12 rounded-xl"
                       >
                         Registrarse
                       </Button>
                    </div>
                  </div>
                </motion.div>
              )}

              {(authMode === "login" || authMode === "register") && (
                <motion.div
                  key="email-form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <button 
                    onClick={() => setAuthMode("google")}
                    className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-indigo-500 hover:text-indigo-400 transition-colors"
                  >
                    <ArrowLeft className="w-3 h-3" /> Volver
                  </button>

                  <div className="space-y-2">
                    <h2 className="text-3xl font-800 uppercase tracking-tighter leading-none">
                      {authMode === "login" ? "Acceder_" : "Registrarse_"}
                    </h2>
                    <p className="text-xs text-white/40 uppercase font-bold tracking-widest">
                      {authMode === "login" ? "Ingresa tus credenciales" : "Crea tu cuenta educativa"}
                    </p>
                  </div>

                  <form onSubmit={handleEmailAuth} className="space-y-4">
                    {authMode === "register" && (
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase tracking-widest opacity-60">Nombre Completo</Label>
                        <div className="relative">
                          <Input 
                            required
                            placeholder="John Doe"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="bg-white/5 border-white/10 h-12 pl-10 rounded-xl"
                          />
                          <User className="absolute left-3 top-3.5 w-4 h-4 opacity-30" />
                        </div>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase tracking-widest opacity-60">Email</Label>
                      <div className="relative">
                        <Input 
                          required
                          type="email"
                          placeholder="tu@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="bg-white/5 border-white/10 h-12 pl-10 rounded-xl"
                        />
                        <Mail className="absolute left-3 top-3.5 w-4 h-4 opacity-30" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase tracking-widest opacity-60">Contraseña</Label>
                      <div className="relative">
                        <Input 
                          required
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="bg-white/5 border-white/10 h-12 pl-10 rounded-xl"
                        />
                        <Lock className="absolute left-3 top-3.5 w-4 h-4 opacity-30" />
                      </div>
                    </div>

                    {error && (
                      <p className="text-[10px] font-bold text-red-500 uppercase italic">
                        Error: {error}
                      </p>
                    )}

                    <Button 
                      type="submit"
                      disabled={authLoading}
                      className="w-full h-14 bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-800 uppercase tracking-widest rounded-2xl shadow-glow"
                    >
                      {authLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : (authMode === "login" ? "Entrar_" : "Crear Cuenta_")}
                    </Button>
                  </form>
                  
                  <button 
                    onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}
                    className="w-full text-[10px] font-bold uppercase tracking-widest text-white/30 hover:text-white transition-colors text-center"
                  >
                    {authMode === "login" ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Inicia sesión"}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-8 text-center">
               <div className="text-[9px] uppercase tracking-widest opacity-20 font-bold">
                 Platform Core v2.4 stable build
               </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return <>{children(user)}</>;
}
