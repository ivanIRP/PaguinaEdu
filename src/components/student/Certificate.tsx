import { useRef } from "react";
import { Course, Enrollment } from "../../types";
import { Button } from "../ui/button";
import { Download, Award } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface CertificateProps {
  course: Course;
  enrollment: Enrollment;
  studentName: string;
}

export function Certificate({ course, enrollment, studentName }: CertificateProps) {
  const certificateRef = useRef<HTMLDivElement>(null);

  const downloadPDF = async () => {
    if (!certificateRef.current) return;
    
    // Temporarily show the certificate to capture it
    const element = certificateRef.current;
    element.style.display = "block";
    
    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      
      const pdf = new jsPDF("landscape", "mm", "a4");
      const width = pdf.internal.pageSize.getWidth();
      const height = pdf.internal.pageSize.getHeight();
      
      pdf.addImage(imgData, "PNG", 0, 0, width, height);
      pdf.save(`Certificado_${course.title.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error("Error generating certificate:", error);
      alert("Error al generar el certificado. Por favor intenta de nuevo.");
    } finally {
      element.style.display = "none";
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Digital Badge Card Preview */}
      <div className="glass border-emerald-500/20 bg-emerald-500/5 p-5 md:p-6 rounded-[2rem] relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
           <Award className="w-24 h-24 text-emerald-400" />
        </div>
        <div className="relative z-10 flex flex-col h-full">
          <div className="text-[8px] md:text-[9px] font-800 text-emerald-400 uppercase tracking-widest mb-1">E-Certificate Verified</div>
          <h4 className="text-sm md:text-lg font-800 uppercase tracking-tighter italic border-l-2 border-emerald-500 pl-3 mb-4 line-clamp-2">
            {course.title}
          </h4>
          <div className="flex items-center gap-2 md:gap-3 mb-6">
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-emerald-600/20 flex items-center justify-center text-emerald-400 shrink-0">
               <Award className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[8px] md:text-[10px] font-bold text-white/40 uppercase">Otorgado a</span>
              <span className="text-[10px] md:text-xs font-800 uppercase tracking-tight truncate">{studentName}</span>
            </div>
          </div>
          <Button onClick={downloadPDF} className="mt-auto w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl h-9 md:h-10 uppercase text-[9px] md:text-[10px] font-800 tracking-widest flex gap-2 shadow-glow transition-all active:scale-95">
            <Download className="w-3 h-3 md:w-3.5 md:h-3.5" /> Descargar PDF_
          </Button>
        </div>
      </div>

      {/* Hidden Certificate HTML for capture */}
      <div 
        ref={certificateRef}
        style={{ 
          display: "none", 
          width: "297mm", 
          height: "210mm", 
          padding: "20mm",
          background: "white",
          color: "black",
          position: "fixed",
          left: "-9999px" 
        }}
      >
        <div 
          className="w-full h-full p-8 flex flex-col items-center justify-center text-center relative"
          style={{ 
            border: "10px solid #10b981", // Emerald 500
            background: "white" 
          }}
        >
          <div className="absolute top-10 left-10 opacity-10">
             <Award className="w-48 h-48" style={{ color: "#10b981" }} />
          </div>
          
          <div className="space-y-6">
            <h1 className="text-6xl font-serif italic mb-8 tracking-widest" style={{ color: "#059669" }}>wz_edustream</h1>
            
            <p className="text-xl font-sans uppercase tracking-[0.3em]" style={{ color: "#6b7280" }}>Certificado de Finalización</p>
            
            <div className="space-y-2">
              <p className="text-lg" style={{ color: "#374151" }}>Se otorga con orgullo el presente a:</p>
              <h2 className="text-5xl font-display font-bold py-4" style={{ borderBottom: "2px solid #f3f4f6", color: "#111827" }}>{studentName}</h2>
            </div>

            <p className="text-xl max-w-2xl mx-auto pt-6" style={{ color: "#374151" }}>
              Por haber completado satisfactoriamente el curso integral de 
              <span className="font-bold block text-3xl mt-2" style={{ color: "#047857" }}>{course.title}</span>
            </p>

            <div className="pt-12 flex justify-center w-full px-12">
               <div className="text-center">
                  <div className="w-64 border-b border-black mb-1"></div>
                  <p className="text-sm font-bold uppercase tracking-wider" style={{ color: "#111827" }}>Validación Académica • wz_edustream</p>
               </div>
            </div>
            
            <p className="text-xs mt-8 tracking-tighter" style={{ color: "#9ca3af" }}>
              ID del Certificado: {enrollment.id} • Fecha: {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
