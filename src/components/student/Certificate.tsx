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
            <h1 className="text-6xl font-serif italic mb-8 tracking-widest" style={{ color: "#059669" }}>EduStream</h1>
            
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
                  <p className="text-sm font-bold uppercase tracking-wider" style={{ color: "#111827" }}>Validación Académica • EduStream</p>
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
