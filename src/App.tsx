/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AuthGate } from "./components/auth/AuthGate";
import { useState, useEffect } from "react";
import { UserProfile } from "./types";
import { Navbar } from "./components/layout/Navbar";
import { AdminDashboard } from "./components/admin/AdminDashboard";
import { StudentDashboard } from "./components/student/StudentDashboard";

export default function App() {
  return (
    <AuthGate>
      {(user) => <MainLayout user={user} />}
    </AuthGate>
  );
}

import { doc, updateDoc } from "firebase/firestore";
import { db } from "./lib/firebase";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./components/ui/dialog";
import { Smartphone, Download, CheckCircle } from "lucide-react";
import { Button } from "./components/ui/button";

function MainLayout({ user }: { user: UserProfile }) {
  const [theme, setTheme] = useState(user.theme || "dark");
  const [isMobileAlertOpen, setIsMobileAlertOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    // Detect mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
      setIsMobileAlertOpen(true);
    }

    // Listen for PWA install prompt
    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      setIsMobileAlertOpen(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setIsMobileAlertOpen(false);
  };

  const toggleTheme = async () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    try {
      await updateDoc(doc(db, "users", user.uid), { theme: newTheme });
    } catch (e) {
      console.error("Error updating theme:", e);
    }
  };

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <Navbar user={user} onToggleTheme={toggleTheme} currentTheme={theme} />
      <main className="container mx-auto py-4 md:py-8 px-4">
        {user.role === "admin" ? (
          <AdminDashboard user={user} />
        ) : (
          <StudentDashboard user={user} />
        )}
      </main>

      {/* Mobile Alert / PWA Prompt */}
      <Dialog open={isMobileAlertOpen} onOpenChange={setIsMobileAlertOpen}>
        <DialogContent className="glass border-white/10 max-w-[90vw] md:max-w-md bg-zinc-950/90 backdrop-blur-2xl rounded-[32px]">
          <DialogHeader className="flex flex-col items-center gap-4 text-center">
            <div className="bg-indigo-600/20 p-4 rounded-2xl border border-indigo-500/30">
              <Smartphone className="w-8 h-8 text-indigo-400" />
            </div>
            <DialogTitle className="text-3xl font-800 tracking-tighter uppercase italic leading-none">
              EduStream en tu Móvil_
            </DialogTitle>
            <DialogDescription className="text-sm text-zinc-400 font-medium leading-relaxed">
              Para una mejor experiencia, puedes instalar EduStream como una aplicación móvil.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-start gap-3 p-3 glass rounded-xl border-white/5">
              <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
              <p className="text-xs text-zinc-300">Acceso rápido desde tu pantalla de inicio.</p>
            </div>
            <div className="flex items-start gap-3 p-3 glass rounded-xl border-white/5">
              <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
              <p className="text-xs text-zinc-300">Experiencia de aprendizaje fluida y a pantalla completa.</p>
            </div>
          </div>

          <DialogFooter className="flex flex-col gap-2">
            {deferredPrompt ? (
              <Button 
                className="w-full h-12 bg-indigo-600 hover:bg-indigo-500 text-white font-800 uppercase text-[10px] tracking-widest rounded-xl shadow-glow flex gap-2"
                onClick={handleInstallClick}
              >
                <Download className="w-4 h-4" /> Instalar Ahora_
              </Button>
            ) : (
              <Button 
                className="w-full h-12 bg-zinc-800 hover:bg-zinc-700 text-white font-800 uppercase text-[10px] tracking-widest rounded-xl"
                onClick={() => setIsMobileAlertOpen(false)}
              >
                Comprendido_
              </Button>
            )}
            {!deferredPrompt && (
              <p className="text-[9px] text-zinc-500 text-center uppercase tracking-widest font-bold">
                Usa "Añadir a pantalla de inicio" en tu navegador
              </p>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

