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

  useEffect(() => {
    window.addEventListener('appinstalled', () => {
      console.log('EduStream was installed');
      setIsMobileAlertOpen(false);
      alert("¡Increíble! EduStream ya está instalado en tu dispositivo.");
    });
  }, []);

  const handleInstallClick = async () => {
    // Check if we are in an iframe
    const isInIframe = window.self !== window.top;
    
    if (isInIframe) {
      // In iframe, we can't show the install prompt. Must open in new tab.
      window.open(window.location.href, '_blank');
      return;
    }

    if (!deferredPrompt && platform !== "ios") {
      // If we are in a tab but prompt hasn't fired yet
      const nav = window.navigator as any;
      const isStandalone = nav?.standalone || (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
      
      if (isStandalone) {
        alert("¡EduStream ya está instalado y funcionando como aplicación!");
        setIsMobileAlertOpen(false);
        return;
      }

      alert("El instalador automático se está preparando. Si no aparece en 5 segundos, por favor usa la opción 'Instalar aplicación' o 'Añadir a pantalla de inicio' en el menú (⋮) de tu navegador.");
      setIsMobileAlertOpen(false);
      return;
    }

    // Show the install prompt
    try {
      if (platform === "ios") {
        alert("Instalación automática no disponible en iOS por restricciones de Apple.\n\nPasos para instalar:\n1. Pulsa el icono 'Compartir' (cuadrado con flecha)\n2. Elige 'Añadir a la pantalla de inicio'\n3. Pulsa 'Añadir'");
        setIsMobileAlertOpen(false);
        return;
      }

      if (deferredPrompt) {
        await deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
          setDeferredPrompt(null);
        }
      }
    } catch (err) {
      console.error("Installation failed:", err);
      // Fallback for some browsers where prompt() might fail
      alert("Para instalar: Pulsa los tres puntos (⋮) de tu navegador y elige 'Instalar aplicación'.");
    } finally {
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
                  <h3 className="text-lg font-900 tracking-tighter uppercase italic leading-none mb-1 text-indigo-400">
                    EduStream Móvil_
                  </h3>
                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest leading-normal">
                    {window.self !== window.top 
                      ? "MODO SEGURO: Pulsa ABRIR para activar la instalación de la App oficial."
                      : "SISTEMA LISTO: Instala ahora para tener acceso total sin navegador."}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex gap-2">
                {window.self !== window.top ? (
                  <Button 
                    className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-500 text-white font-900 uppercase text-[10px] tracking-widest rounded-xl shadow-glow flex gap-2 transition-all active:scale-95 animate-pulse"
                    onClick={() => window.open(window.location.href, '_blank')}
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> ABRIR PARA INSTALAR_
                  </Button>
                ) : (
                  <Button 
                    className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-500 text-white font-900 uppercase text-[10px] tracking-widest rounded-xl shadow-glow flex gap-2 transition-all active:scale-95 animate-pulse"
                    onClick={handleInstallClick}
                  >
                    {platform === "ios" ? <Apple className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
                    {platform === "ios" ? 'VER GUÍA' : 'INSTALAR AHORA_'}
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

