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
      
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const nav = window.navigator as any;
      const isStandalone = nav?.standalone || (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
      
      if (isMobile && !isStandalone) {
        setIsMobileAlertOpen(true);
      }
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsMobileAlertOpen(false);
      alert("¡EduStream instalado con éxito!");
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Initial check for mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const nav = window.navigator as any;
    const isStandalone = nav?.standalone || (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
    
    // Only show if mobile and not standalone
    // If deferredPrompt is already there, it will be handled by the listener, 
    // but IOS doesn't have beforeinstallprompt so we show the guide after a delay
    if (isMobile && !isStandalone) {
      setTimeout(() => {
        setIsMobileAlertOpen(true);
      }, 2000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    const isInIframe = window.self !== window.top;
    if (isInIframe) {
      window.open(window.location.href, '_blank');
      return;
    }

    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setIsMobileAlertOpen(false);
      }
    } else if (platform === "ios") {
      alert("Para descargar en iPhone:\n\n1. Pulsa 'Compartir'\n2. 'Añadir a pantalla de inicio'\n3. 'Añadir'");
    } else {
      alert("Haz clic en los tres puntos (⋮) y selecciona 'Instalar aplicación'.");
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
        isInstallAvailable={!!deferredPrompt || (platform === "ios" && !(window.navigator as any).standalone)}
      />
      <main className="container mx-auto py-4 md:py-8 px-4">
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
            className="fixed bottom-0 left-0 right-0 z-[100] p-4 pointer-events-none"
          >
            <div className="max-w-md mx-auto bg-indigo-600 border border-white/20 rounded-2xl p-4 shadow-2xl pointer-events-auto flex items-center gap-4">
              <div className="bg-white/20 p-2 rounded-xl">
                <Download className="w-5 h-5 text-white animate-bounce" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-black text-white uppercase tracking-tight">Descargar EduStream_</p>
              </div>
              <div className="flex gap-1">
                <Button 
                  size="sm"
                  className="bg-white text-indigo-600 hover:bg-zinc-100 font-black text-[10px] px-5 h-9 rounded-xl shadow-lg transition-transform active:scale-95"
                  onClick={handleInstallClick}
                >
                  DESCARGAR AHORA
                </Button>
                <button onClick={() => setIsMobileAlertOpen(false)} className="p-2 text-white/50 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
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

