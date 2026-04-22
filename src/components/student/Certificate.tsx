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
    
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    
    const pdf = new jsPDF("landscape", "mm", "a4");
    const width = pdf.internal.pageSize.getWidth();
    const height = pdf.internal.pageSize.getHeight();
    
    pdf.addImage(imgData, "PNG", 0, 0, width, height);
    pdf.save(`Certificado_${course.title.replace(/\s+/g, '_')}.pdf`);
    
    element.style.display = "none";
  };

  return (
    <div className="w-full">
      <Button onClick={downloadPDF} className="w-full flex gap-2 font-bold" variant="default">
        <Download className="w-4 h-4" /> Descargar Certificado
      </Button>

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
        <div className="w-full h-full border-[10px] border-emerald-500 p-8 flex flex-col items-center justify-center text-center relative">
          <div className="absolute top-10 left-10 opacity-10">
             <Award className="w-48 h-48" />
          </div>
          
          <div className="space-y-6">
            <h1 className="text-6xl font-serif italic text-emerald-600 mb-8 tracking-widest">EduStream</h1>
            
            <p className="text-xl font-sans uppercase tracking-[0.3em] text-gray-500">Certificado de Finalización</p>
            
            <div className="space-y-2">
              <p className="text-lg">Se otorga con orgullo el presente a:</p>
              <h2 className="text-5xl font-display font-bold py-4 border-b-2 border-gray-100">{studentName}</h2>
            </div>

            <p className="text-xl max-w-2xl mx-auto pt-6">
              Por haber completado satisfactoriamente el curso integral de 
              <span className="font-bold block text-3xl mt-2 text-emerald-700">{course.title}</span>
            </p>

            <div className="pt-12 flex justify-between w-full max-w-4xl px-12">
               <div className="text-center">
                  <div className="w-48 border-b border-black mb-1"></div>
                  <p className="text-sm font-bold uppercase tracking-wider">Dirección Académica</p>
               </div>
               <div className="text-center">
                  <div className="w-48 border-b border-black mb-1"></div>
                  <p className="text-sm font-bold uppercase tracking-wider">Firma del Estudiante</p>
               </div>
            </div>
            
            <p className="text-xs text-gray-400 mt-8 tracking-tighter">
              ID del Certificado: {enrollment.id} • Fecha: {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
