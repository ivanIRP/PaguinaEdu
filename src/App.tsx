/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { AuthGate } from "./components/auth/AuthGate";
import { UserProfile } from "./types";
import { Navbar } from "./components/layout/Navbar";
import { AdminDashboard } from "./components/admin/AdminDashboard";
import { StudentDashboard } from "./components/student/StudentDashboard";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "./lib/firebase";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./components/ui/dialog";
import { Smartphone, Download, CheckCircle, ExternalLink, Apple, X } from "lucide-react";
import { Button } from "./components/ui/button";
import { motion, AnimatePresence } from "motion/react";

function MainLayout({ user }: { user: UserProfile }) {
  const [theme, setTheme] = useState(user.theme || "dark");
  const [isMobileAlertOpen, setIsMobileAlertOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [platform, setPlatform] = useState<"ios" | "android" | "other">("other");

  useEffect(() => {
    // Detect platform
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isAndroid = /Android/.test(navigator.userAgent);
    if (isIOS) setPlatform("ios");
    else if (isAndroid) setPlatform("android");
    
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    // Listen for PWA install prompt
    const handleBeforeInstallPrompt = (e: any) => {
      console.log("PWA beforeinstallprompt event captured");
      e.preventDefault();
      setDeferredPrompt(e);
      // Show dialog if not in standalone mode
      const nav = window.navigator as any;
      const isStandalone = nav?.standalone || (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
      if (!isStandalone) {
        setIsMobileAlertOpen(true);
      }
    };

    const handleAppInstalled = () => {
      console.log("PWA was installed");
      setDeferredPrompt(null);
      setIsMobileAlertOpen(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Initial check for mobile/standalone
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const nav = window.navigator as any;
    const isStandalone = nav?.standalone || (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
    
    if (isMobile && !isStandalone) {
      setTimeout(() => setIsMobileAlertOpen(true), 1500);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    // Check if we are in an iframe
    const isInIframe = window.self !== window.top;
    if (isInIframe) {
      window.open(window.location.href, '_blank');
      return;
    }

    if (!deferredPrompt) {
      // If no prompt, it might be iOS or already installed but prompt missed
      console.log("No deferred prompt available");
      setIsMobileAlertOpen(false);
      return;
    }

    // Show the install prompt
    try {
      if (platform === "ios") {
        // iOS doesn't support programmatic prompt
        alert("Para instalar en iOS: Pulsa el icono 'Compartir' en Safari y luego 'Añadir a la pantalla de inicio'.");
        return;
      }

      await deferredPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      const choiceResult = await deferredPrompt.userChoice;
      console.log(`User response to the install prompt: ${choiceResult.outcome}`);
      
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
        sessionStorage.setItem('pwa_alert_seen', 'true');
      } else {
        console.log('User dismissed the install prompt');
      }
    } catch (err) {
      console.error("Installation failed:", err);
    } finally {
      // Always clear the prompt and close the dialog
      setDeferredPrompt(null);
      setIsMobileAlertOpen(false);
    }
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
      <Navbar 
        user={user} 
        onToggleTheme={toggleTheme} 
        currentTheme={theme} 
        onInstall={handleInstallClick}
        isInstallAvailable={!!deferredPrompt}
      />      <main className="container mx-auto py-4 md:py-8 px-4">
        {user.role === "admin" ? (
          <AdminDashboard user={user} />
        ) : (
          <StudentDashboard user={user} />
        )}
      </main>

      {/* Mobile PWA Notification Toast */}
      <AnimatePresence>
        {isMobileAlertOpen && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-4 right-4 z-50 md:left-auto md:right-6 md:w-96"
          >
            <div className="glass border-white/10 bg-zinc-950/90 backdrop-blur-2xl rounded-[2rem] p-5 shadow-2xl relative overflow-hidden ring-1 ring-white/20">
              <div className="absolute top-0 left-0 w-full h-1 bg-indigo-600 shadow-glow" />
              
              <button 
                onClick={() => setIsMobileAlertOpen(false)}
                className="absolute top-4 right-4 p-2 text-white/20 hover:text-white transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-start gap-4 pr-6">
                <div className="bg-indigo-600/20 p-3 rounded-2xl border border-indigo-500/30 shrink-0">
                  <Smartphone className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-lg font-800 tracking-tighter uppercase italic leading-none mb-1">
                    Instala la App_
                  </h3>
                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest leading-normal">
                    Lleva EduStream a tu pantalla de inicio para una experiencia fluida.
                  </p>
                </div>
              </div>

              <div className="mt-5 flex gap-2">
                {window.self !== window.top ? (
                  <Button 
                    className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-500 text-white font-900 uppercase text-[10px] tracking-widest rounded-xl shadow-glow flex gap-2 transition-all active:scale-95"
                    onClick={() => window.open(window.location.href, '_blank')}
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> ABRIR
                  </Button>
                ) : (
                  <Button 
                    className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-500 text-white font-900 uppercase text-[10px] tracking-widest rounded-xl shadow-glow flex gap-2 transition-all active:scale-95"
                    onClick={handleInstallClick}
                  >
                    {platform === "ios" ? <Apple className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
                    {platform === "ios" ? 'VER GUÍA' : 'INSTALAR'}
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  className="flex-1 h-12 border-white/10 text-zinc-400 hover:text-white font-900 uppercase text-[10px] tracking-widest rounded-xl"
                  onClick={() => setIsMobileAlertOpen(false)}
                >
                  CERRAR
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <AuthGate>
      {(user) => <MainLayout user={user} />}
    </AuthGate>
  );
}

