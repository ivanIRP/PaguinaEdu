import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Smartphone, ExternalLink, Info } from 'lucide-react';
import { motion } from 'motion/react';

export const QRCodeBridge: React.FC = () => {
  const currentUrl = window.location.href;

  return (
    <div className="flex flex-col items-center gap-6 p-6 text-center">
      <div className="relative group">
        <div className="absolute -inset-4 bg-indigo-500/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="bg-white p-4 rounded-3xl shadow-2xl relative">
          <QRCodeSVG 
            value={currentUrl} 
            size={180}
            level="H"
            includeMargin={true}
            imageSettings={{
              src: "https://cdn-icons-png.flaticon.com/512/3135/3135673.png",
              x: undefined,
              y: undefined,
              height: 30,
              width: 30,
              excavate: true,
            }}
          />
        </div>
      </div>

      <div className="space-y-2 max-w-xs text-center">
        <h3 className="text-sm font-900 uppercase italic tracking-tighter text-indigo-400">Escanea con tu Móvil_</h3>
        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest leading-relaxed">
          Escanea este código con la cámara de tu smartphone para abrir la plataforma directamente y activar la instalación automática.
        </p>
      </div>

      <div className="flex flex-col gap-2 w-full">
        <div className="flex items-center gap-2 p-3 bg-white/5 rounded-xl border border-white/10 text-left">
          <Info className="w-4 h-4 text-indigo-400 shrink-0" />
          <span className="text-[8px] text-zinc-500 font-medium uppercase leading-tight">
            Nota: La instalación requiere que el sitio esté abierto en el navegador nativo (Safari en iOS, Chrome en Android).
          </span>
        </div>
      </div>
    </div>
  );
};
