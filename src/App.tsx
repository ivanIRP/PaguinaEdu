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
import { Smartphone, Download, CheckCircle, ExternalLink, Apple } from "lucide-react";
import { Button } from "./components/ui/button";

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
      />
      <main className="container mx-auto py-4 md:py-8 px-4">
        {user.role === "admin" ? (
          <AdminDashboard user={user} />
        ) : (
          <StudentDashboard user={user} />
        )}
      </main>

      {/* Mobile Alert / PWA Prompt */}
      <Dialog open={isMobileAlertOpen} onOpenChange={setIsMobileAlertOpen}>
        <DialogContent className="glass border-white/10 max-w-[90vw] md:max-w-md bg-zinc-950/90 backdrop-blur-2xl rounded-[32px] overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-indigo-600 shadow-glow" />
          
          <DialogHeader className="flex flex-col items-center gap-4 text-center pt-4">
            <div className="bg-indigo-600/20 p-4 rounded-2xl border border-indigo-500/30 ring-4 ring-indigo-500/5">
              <Smartphone className="w-8 h-8 text-indigo-400" />
            </div>
            <DialogTitle className="text-3xl font-800 tracking-tighter uppercase italic leading-none">
              EduStream Móvil_
            </DialogTitle>
            <DialogDescription className="text-sm text-zinc-400 font-medium leading-relaxed max-w-[280px]">
              Lleva tu aprendizaje a todas partes con nuestra aplicación oficial.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 py-4">
            <div className="flex items-center gap-3 p-3 glass rounded-xl border-white/5 bg-white/5">
              <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                <CheckCircle className="w-4 h-4 text-green-500" />
              </div>
              <p className="text-xs text-zinc-300 font-bold uppercase tracking-wide">Acceso instantáneo</p>
            </div>
            <div className="flex items-center gap-3 p-3 glass rounded-xl border-white/5 bg-white/5">
              <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                <CheckCircle className="w-4 h-4 text-green-500" />
              </div>
              <p className="text-xs text-zinc-300 font-bold uppercase tracking-wide">Sin distracciones</p>
            </div>
          </div>

          <DialogFooter className="flex flex-col gap-3 pb-2 pt-2">
            {window.self !== window.top ? (
              <Button 
                className="w-full h-14 bg-indigo-600 hover:bg-indigo-500 text-white font-900 uppercase text-xs tracking-widest rounded-2xl shadow-glow flex gap-3 transition-all active:scale-95"
                onClick={() => window.open(window.location.href, '_blank')}
              >
                <ExternalLink className="w-5 h-5" /> ABRIR PARA INSTALAR_
              </Button>
            ) : (
              <Button 
                className="w-full h-14 bg-indigo-600 hover:bg-indigo-500 text-white font-900 uppercase text-xs tracking-widest rounded-2xl shadow-glow flex gap-3 transition-all active:scale-95"
                onClick={handleInstallClick}
                disabled={platform === "ios" && !deferredPrompt}
              >
                {platform === "ios" ? <Apple className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
                {platform === "ios" ? 'GUÍA DE INSTALACIÓN_' : 'INSTALAR APLICACIÓN_'}
              </Button>
            )}
            
            <div className="px-2">
              <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold text-center leading-relaxed">
                {window.self !== window.top 
                  ? "Para instalar la aplicación real, primero debes abrirla en una pestaña propia fuera de la vista previa."
                  : platform === "ios"
                    ? "En iOS, pulsa Compartir > 'Añadir a pantalla de inicio' para instalar como App oficial."
                    : deferredPrompt 
                      ? "Presiona el botón para abrir el instalador oficial de tu sistema para tener acceso total."
                      : "La instalación automática dependerá de tu navegador móvil y estado de conexión."}
              </p>
            </div>
            <Button 
              variant="ghost" 
              className="w-full h-10 text-zinc-500 text-[10px] font-bold uppercase tracking-widest hover:text-white"
              onClick={() => {
                setIsMobileAlertOpen(false);
              }}
            >
              Continuar en el navegador
            </Button>
          </DialogFooter>
          
          {!deferredPrompt && (
            <div className="mt-2 text-center bg-indigo-500/10 p-4 rounded-2xl border border-indigo-500/20">
              <p className="text-[10px] text-indigo-300 uppercase tracking-widest font-900 mb-2">
                Instalación Manual_
              </p>
              <p className="text-[9px] text-zinc-400 font-medium leading-relaxed">
                Si no ves el botón de instalar, usa la opción <span className="text-white font-bold">"Añadir a pantalla de inicio"</span> en el menú de compartir de tu navegador.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
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

