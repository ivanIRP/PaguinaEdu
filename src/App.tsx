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
      alert("¡WZ_EDUSTREAM instalado con éxito!");
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
      alert("Para instalar la aplicación, se abrirá en una pestaña nueva. Vuelve a pulsar 'DESCARGAR' allí.");
      window.open(window.location.href, '_blank');
      return;
    }

    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setDeferredPrompt(null);
          setIsMobileAlertOpen(false);
        }
      } catch (err) {
        console.error("Error al mostrar el prompt:", err);
        // Fallback to manual instructions if even prompt fails
        if (platform === "ios") {
          alert("PARA INSTALAR:\n1. Pulsa 'Compartir'\n2. 'Añadir a pantalla de inicio'");
        } else {
          alert("Pulsa el menú (⋮) y elige 'Instalar aplicación'.");
        }
      }
    } else if (platform === "ios") {
      alert("INSTALACIÓN EN IPHONE:\n\n1. Pulsa el botón de COMPARTIR (cuadrado con flecha abajo en el navegador).\n2. Elige la opción 'Añadir a pantalla de inicio'.\n3. Pulsa 'Añadir'.");
    } else {
      alert("PARA INSTALAR:\n\nPulsa los tres puntos (⋮) en tu navegador y selecciona 'Instalar aplicación' o 'Añadir a pantalla de inicio'.");
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
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-2 left-2 right-2 md:top-4 md:left-auto md:right-4 md:w-96 z-[100] pointer-events-none"
          >
            <div className="bg-zinc-900/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] pointer-events-auto flex items-center gap-4 ring-1 ring-white/20">
              <div className="w-11 h-11 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/30">
                <Smartphone className="w-5 h-5 text-white animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-black uppercase tracking-tight text-white leading-tight">Instalar wz_edustream_</h4>
                <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest truncate">App Nativa • Sin Navegador</p>
              </div>
              <div className="flex items-center gap-1">
                <Button 
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[9px] px-4 h-8 rounded-lg shadow-glow transition-all active:scale-90"
                  onClick={handleInstallClick}
                >
                  DESCARGAR
                </Button>
                <button 
                  onClick={() => setIsMobileAlertOpen(false)}
                  className="p-1.5 text-zinc-500 hover:text-white transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
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

