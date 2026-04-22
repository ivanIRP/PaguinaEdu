import { useState, useMemo } from "react";
import { db } from "../../lib/firebase";
import { doc, updateDoc, arrayUnion, serverTimestamp } from "firebase/firestore";
import { Course, Enrollment, Lesson } from "../../types";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { ScrollArea } from "../ui/scroll-area";
import { ArrowLeft, Play, CheckCircle2, Lock, Star, MessageSquare, Download } from "lucide-react";
import { Badge } from "../ui/badge";
import { Textarea } from "../ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Progress } from "../ui/progress";
import { Certificate } from "./Certificate";
import { motion } from "motion/react";
import { Label } from "../ui/label";

interface CoursePlayerProps {
  course: Course;
  enrollment: Enrollment;
  studentName: string;
  onBack: () => void;
}

export function CoursePlayer({ course, enrollment: initialEnrollment, studentName, onBack }: CoursePlayerProps) {
  const [enrollment, setEnrollment] = useState(initialEnrollment);
  const [activeLesson, setActiveLesson] = useState<Lesson>(course.lessons[0]);
  const [isRatingOpen, setIsRatingOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sequential Logic: A lesson is unlocked if it's the first one or the previous one is completed.
  const isLessonUnlocked = (lessonId: string) => {
    const index = course.lessons.findIndex(l => l.id === lessonId);
    if (index === 0) return true;
    const prevLessonId = course.lessons[index - 1].id;
    return enrollment.completedLessonIds.includes(prevLessonId);
  };

  const completeLesson = async (lessonId: string) => {
    if (enrollment.completedLessonIds.includes(lessonId)) return;

    const newCompleted = [...enrollment.completedLessonIds, lessonId];
    await updateDoc(doc(db, "enrollments", enrollment.id), {
      completedLessonIds: arrayUnion(lessonId)
    });
    
    setEnrollment(prev => ({ ...prev, completedLessonIds: newCompleted }));

    // Check if the whole course was finished
    if (newCompleted.length === course.lessons.length) {
      if (!enrollment.isFinished) {
        setIsRatingOpen(true);
      }
    }
  };

  const handleFinishCourse = async () => {
    if (rating === 0 || !comment) return;
    setIsSubmitting(true);
    await updateDoc(doc(db, "enrollments", enrollment.id), {
      isFinished: true,
      rating,
      comment,
      finishedAt: serverTimestamp()
    });
    setEnrollment(prev => ({ ...prev, isFinished: true, rating, comment }));
    setIsRatingOpen(false);
    setIsSubmitting(false);
  };

  const progress = Math.round((enrollment.completedLessonIds.length / course.lessons.length) * 100);

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-160px)]">
      {/* Sidebar - Lessons List */}
      <aside className="w-full lg:w-96 flex flex-col h-full glass rounded-[32px] overflow-hidden border-white/10 shrink-0 shadow-2xl">
        <CardHeader className="p-8 border-b border-white/5 space-y-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBack} className="h-10 w-10 bg-white/5 rounded-xl hover:bg-white/10 transition-all">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex flex-col">
               <div className="text-[10px] font-800 text-indigo-500 uppercase tracking-widest leading-none mb-1">Learning Path</div>
               <CardTitle className="text-xl font-800 tracking-tighter uppercase italic leading-none">{course.title}</CardTitle>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-[11px] font-800 uppercase tracking-tighter text-white/40">
              <span>Overall Progress</span>
              <span className="text-indigo-400">{progress}%</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
               <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full bg-gradient-to-r from-indigo-500 to-purple-600" />
            </div>
          </div>
        </CardHeader>
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-2">
            {course.lessons.map((lesson, idx) => {
              const unlocked = isLessonUnlocked(lesson.id);
              const completed = enrollment.completedLessonIds.includes(lesson.id);
              const active = activeLesson.id === lesson.id;

              return (
                <button
                  key={lesson.id}
                  disabled={!unlocked}
                  onClick={() => unlocked && setActiveLesson(lesson)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all border ${
                    active 
                      ? "bg-white/10 border-white/20 shadow-glow" 
                      : unlocked 
                        ? "hover:bg-white/5 border-transparent" 
                        : "opacity-30 border-transparent grayscale"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-800 transition-colors ${
                    completed ? "bg-green-500/20 text-green-500" : active ? "bg-indigo-600 text-white" : "border border-white/20"
                  }`}>
                    {completed ? <CheckCircle2 className="w-4 h-4" /> : String(idx + 1).padStart(2, '0')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-800 uppercase tracking-tighter opacity-40 leading-none mb-1">Lesson {idx+1}</p>
                    <p className={`text-sm font-bold tracking-tight uppercase leading-none truncate ${active ? "text-white" : "text-white/60"}`}>
                      {lesson.title}
                    </p>
                  </div>
                  {!unlocked && <Lock className="w-3 h-3 text-white/20" />}
                </button>
              );
            })}
          </div>
        </ScrollArea>
        {enrollment.isFinished && (
           <div className="p-6 bg-indigo-600/10 border-t border-indigo-500/20">
              <Certificate course={course} enrollment={enrollment} studentName={studentName} />
           </div>
        )}
      </aside>

      {/* Main Player Area */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="mb-8 space-y-2">
           <div className="text-sm font-bold text-indigo-500 uppercase tracking-[0.3em]">Module • Video</div>
           <h1 className="text-5xl md:text-7xl font-800 tracking-tighter leading-none uppercase">
             {activeLesson.title.split(" ").slice(0, -1).join(" ")}<br />
             <span className="bold-stroke">{activeLesson.title.split(" ").pop()}</span>
           </h1>
        </header>

        <div className="relative aspect-video rounded-[40px] overflow-hidden border border-white/10 shadow-2xl bg-black group mb-8">
           <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10 opacity-60"></div>
           <div className="absolute inset-0 flex items-center justify-center z-20">
              <div className="text-center group-hover:scale-110 transition-transform duration-500">
                 <button 
                   onClick={() => completeLesson(activeLesson.id)}
                   className="w-24 h-24 bg-white text-black rounded-full flex items-center justify-center shadow-glow hover:bg-indigo-50 transition-all mb-4 mx-auto"
                 >
                    <Play className="w-8 h-8 fill-current ml-1" />
                 </button>
                 <Badge className="bg-indigo-600/20 border-indigo-500/20 text-indigo-400 uppercase text-[10px] font-800 px-3">Mock Player Mode</Badge>
              </div>
           </div>
           
           <div className="absolute bottom-10 left-10 right-10 z-20 flex justify-between items-end">
              <div className="space-y-1">
                 <div className="text-[10px] font-800 text-indigo-400 uppercase tracking-widest opacity-80">ESTADO DE LECCIÓN</div>
                 <div className="text-2xl font-800 uppercase tracking-tighter">
                   {enrollment.completedLessonIds.includes(activeLesson.id) ? "Lección Completada ✓" : "En proceso de aprendizaje"}
                 </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                 <div className="text-[11px] font-800 font-mono text-white/40 uppercase">05:22 / 14:00</div>
                 <div className="w-48 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: enrollment.completedLessonIds.includes(activeLesson.id) ? "100%" : "30%" }}
                      className="h-full bg-indigo-500"
                    />
                 </div>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="glass p-6 rounded-3xl border-white/10">
              <div className="text-[10px] uppercase font-800 text-white/30 tracking-widest mb-2">Professor</div>
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 border border-white/20 shadow-glow" />
                 <div className="text-sm font-800 uppercase tracking-tighter">Specialist Lead</div>
              </div>
           </div>
           <div className="glass p-6 rounded-3xl border-white/10">
              <div className="text-[10px] uppercase font-800 text-white/30 tracking-widest mb-2">Social</div>
              <div className="text-2xl font-800 italic uppercase">2.4k</div>
              <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-tighter">Active Students</div>
           </div>
           <div className="glass p-6 rounded-3xl border-white/10 flex flex-col justify-center">
              <Button onClick={() => completeLesson(activeLesson.id)} className="bg-white text-black hover:bg-neutral-200 uppercase text-[10px] font-800 tracking-widest h-12 rounded-2xl">
                 Marcar Completada_
              </Button>
           </div>
        </div>
      </main>

      {/* Rating Dialog - Mandatory after finishing */}
      <Dialog open={isRatingOpen} onOpenChange={setIsRatingOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display">¡Felicidades por terminar! 🎉</DialogTitle>
            <DialogDescription>
              Tu opinión es fundamental para nosotros. Califica el curso para obtener tu certificado.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <Label className="text-lg">Calidad del curso</Label>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className={`transition-transform hover:scale-110 ${rating >= star ? "text-yellow-500" : "text-muted"}`}
                  >
                    <Star className={`w-8 h-8 ${rating >= star ? "fill-current" : ""}`} />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Comentario y Sugerencias</Label>
              <Textarea 
                placeholder="¿Qué te pareció el curso? ¿Qué mejorarías?" 
                value={comment}
                onChange={e => setComment(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              className="w-full h-12 text-lg rounded-xl"
              onClick={handleFinishCourse}
              disabled={rating === 0 || !comment || isSubmitting}
            >
              Finalizar y Generar Certificado
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
