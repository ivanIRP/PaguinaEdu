import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Check, Loader2, Smartphone, Cpu, Globe, Zap } from 'lucide-react';

interface InstallationScannerProps {
  onComplete: () => void;
  platform: 'ios' | 'android' | 'other';
}

export const InstallationScanner: React.FC<InstallationScannerProps> = ({ onComplete, platform }) => {
  const [step, setStep] = useState(0);
  const steps = [
    { id: 'env', label: 'Verificando Entorno de Aplicación', icon: Globe },
    { id: 'auth', label: 'Validando Protocolos de Seguridad', icon: Shield },
    { id: 'manifest', label: 'Analizando Manifiesto PWA v2.4', icon: Cpu },
    { id: 'ready', label: 'Sincronizando Motor de Instalación', icon: Zap },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((prev) => {
        if (prev >= steps.length - 1) {
          clearInterval(timer);
          setTimeout(onComplete, 800);
          return prev;
        }
        return prev + 1;
      });
    }, 1200);

    return () => clearInterval(timer);
  }, [onComplete, steps.length]);

  return (
    <div className="space-y-6 py-4">
      <div className="relative h-2 w-full bg-white/5 rounded-full overflow-hidden">
        <motion.div 
          className="absolute top-0 left-0 h-full bg-indigo-500 shadow-glow"
          initial={{ width: '0%' }}
          animate={{ width: `${((step + 1) / steps.length) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      <div className="space-y-3">
        {steps.map((s, i) => {
          const Icon = s.icon;
          const isActive = i === step;
          const isCompleted = i < step;

          return (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ 
                opacity: isActive || isCompleted ? 1 : 0.3,
                x: 0,
                scale: isActive ? 1.02 : 1
              }}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                isActive 
                  ? 'bg-indigo-500/10 border-indigo-500/30' 
                  : isCompleted 
                    ? 'bg-emerald-500/5 border-emerald-500/20' 
                    : 'bg-white/5 border-white/5'
              }`}
            >
              <div className={`p-2 rounded-lg ${
                isCompleted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-zinc-400'
              }`}>
                {isCompleted ? <Check className="w-4 h-4" /> : isActive ? <Loader2 className="w-4 h-4 animate-spin text-indigo-400" /> : <Icon className="w-4 h-4" />}
              </div>
              <div className="flex flex-col">
                <span className={`text-[10px] font-bold uppercase tracking-widest ${
                  isActive ? 'text-white' : isCompleted ? 'text-zinc-400' : 'text-zinc-600'
                }`}>
                  {s.label}
                </span>
                {isActive && (
                  <motion.span 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-[8px] text-indigo-400/70 font-mono tracking-tighter"
                  >
                    STATUS: EKE_PROCESSING_DATA...
                  </motion.span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {step === steps.length - 1 && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 justify-center py-2 text-emerald-400"
        >
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-[10px] font-900 uppercase tracking-widest">SISTEMA LISTO PARA EMPAREJAR</span>
        </motion.div>
      )}
    </div>
  );
};
