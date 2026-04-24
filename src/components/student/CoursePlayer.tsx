import { useState, useMemo, useEffect } from "react";
import ReactPlayer from "react-player";
import { db } from "../../lib/firebase";
import { doc, updateDoc, arrayUnion, serverTimestamp, collection, query, where, orderBy, onSnapshot, addDoc } from "firebase/firestore";
import { Course, Enrollment, Lesson, Teacher, Specialty, Comment } from "../../types";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { ScrollArea } from "../ui/scroll-area";
import { ArrowLeft, Play, CheckCircle2, Lock, Star, MessageSquare, Download, Send, User } from "lucide-react";
import { Badge } from "../ui/badge";
import { Textarea } from "../ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Progress } from "../ui/progress";
import { Certificate } from "./Certificate";
import { motion, AnimatePresence } from "motion/react";
import { Label } from "../ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

interface CoursePlayerProps {
  course: Course;
  enrollment: Enrollment;
  studentName: string;
  studentPhoto?: string;
  teachers: Teacher[];
  specialties: Specialty[];
  onBack: () => void;
}

export function CoursePlayer({ course, enrollment: initialEnrollment, studentName, studentPhoto, teachers, specialties, onBack }: CoursePlayerProps) {
  const [enrollment, setEnrollment] = useState(initialEnrollment);
  const sortedLessons = useMemo(() => [...course.lessons].sort((a, b) => (a.order || 0) - (b.order || 0)), [course.lessons]);
  const [activeLesson, setActiveLesson] = useState<Lesson>(sortedLessons[0]);
  const [isRatingOpen, setIsRatingOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSendingComment, setIsSendingComment] = useState(false);

  const teacher = teachers.find(t => t.id === course.teacherId);
  const specialty = specialties.find(s => s.id === teacher?.specialtyId);

  // Fetch comments
  useEffect(() => {
    if (course.id === "preview") return;

    const q = query(
      collection(db, "comments"),
      where("courseId", "==", course.id),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
      setComments(data);
    });

    return () => unsubscribe();
  }, [course.id]);

  const handleSendComment = async () => {
    if (!newComment.trim() || isSendingComment) return;
    setIsSendingComment(true);
    try {
      await addDoc(collection(db, "comments"), {
        courseId: course.id,
        userId: enrollment.userId,
        userName: studentName,
        userPhoto: studentPhoto || "",
        content: newComment.trim(),
        createdAt: serverTimestamp()
      });
      setNewComment("");
    } catch (error) {
      console.error("Error sending comment:", error);
    } finally {
      setIsSendingComment(false);
    }
  };

  // Sequential Logic: A lesson is unlocked if it's the first one or the previous one is completed.
  const isLessonUnlocked = (lessonId: string) => {
    const index = sortedLessons.findIndex(l => l.id === lessonId);
    if (index === 0) return true;
    const prevLessonId = sortedLessons[index - 1].id;
    return enrollment.completedLessonIds.includes(prevLessonId);
  };

  const completeLesson = async (lessonId: string) => {
    if (enrollment.completedLessonIds.includes(lessonId)) return;

    const newCompleted = [...enrollment.completedLessonIds, lessonId];
    
    // Only update DB if not in preview mode
    if (course.id !== "preview") {
      await updateDoc(doc(db, "enrollments", enrollment.id), {
        completedLessonIds: arrayUnion(lessonId)
      });
    }
    
    setEnrollment(prev => ({ ...prev, completedLessonIds: newCompleted }));

    // Check if the whole course was finished
    if (newCompleted.length === sortedLessons.length) {
      if (!enrollment.isFinished) {
        setIsRatingOpen(true);
      }
    }
  };

  const handleFinishCourse = async () => {
    if (rating === 0 || !commentText) return;
    setIsSubmitting(true);
    
    if (course.id !== "preview") {
      await updateDoc(doc(db, "enrollments", enrollment.id), {
        isFinished: true,
        rating,
        comment: commentText,
        finishedAt: serverTimestamp()
      });
    }
    
    setEnrollment(prev => ({ ...prev, isFinished: true, rating, comment: commentText }));
    setIsRatingOpen(false);
    setIsSubmitting(false);
  };

  const progress = Math.round((enrollment.completedLessonIds.length / sortedLessons.length) * 100);

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 h-full min-h-0">
      {/* Sidebar - Lessons List */}
      <aside className="w-full lg:w-96 flex flex-col h-[300px] md:h-[400px] lg:h-auto glass rounded-[24px] lg:rounded-[32px] overflow-hidden border-white/10 shrink-0 shadow-2xl">
        <CardHeader className="p-8 border-b border-white/5 space-y-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBack} className="h-10 w-10 bg-white/5 rounded-xl hover:bg-white/10 transition-all shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex flex-col min-w-0">
               <div className="text-[10px] font-800 text-indigo-500 uppercase tracking-widest leading-none mb-1">Learning Path</div>
               <CardTitle className="text-lg font-800 tracking-tighter uppercase italic leading-none truncate">{course.title}</CardTitle>
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
            {sortedLessons.map((lesson, idx) => {
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
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-800 transition-colors shrink-0 ${
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
                  {!unlocked && <Lock className="w-3 h-3 text-white/20 shrink-0" />}
                </button>
              );
            })}
          </div>
        </ScrollArea>
        {enrollment.isFinished && (
           <div className="p-6 bg-indigo-600/10 border-t border-indigo-500/20 mt-auto">
              <Certificate course={course} enrollment={enrollment} studentName={studentName} />
           </div>
        )}
      </aside>

      {/* Main Player Area */}
      <main className="flex-1 flex flex-col min-w-0 pb-12">
        <header className="mb-4 lg:mb-6 space-y-2">
           <div className="text-[10px] md:text-xs font-bold text-indigo-500 uppercase tracking-[0.3em]">Module • Video Training</div>
           <h1 className="text-2xl md:text-5xl lg:text-7xl font-800 tracking-tighter leading-[0.9] uppercase break-words">
             {activeLesson.title}
           </h1>
        </header>

        <div className="relative aspect-video rounded-2xl md:rounded-[2rem] lg:rounded-[3rem] overflow-hidden border border-white/10 shadow-3xl bg-black group mb-6 md:mb-8">
           <AnimatePresence mode="wait">
             <motion.div
               key={activeLesson.id}
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="w-full h-full"
             >
                <ReactPlayer
                  url={activeLesson.videoUrl}
                  width="100%"
                  height="100%"
                  controls
                  playing={false}
                  onEnded={() => completeLesson(activeLesson.id)}
                  onReady={() => setPlayerReady(true)}
                  config={{
                    youtube: { playerVars: { showinfo: 0, rel: 0 } },
                    vimeo: { playerOptions: { title: 0, byline: 0, portrait: 0 } }
                  }}
                  className="absolute inset-0"
                  style={{ position: 'absolute', top: 0, left: 0 }}
                />
             </motion.div>
           </AnimatePresence>
           
           {!playerReady && (
             <div className="absolute inset-0 flex items-center justify-center bg-zinc-950 z-10">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full"
                />
             </div>
           )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
           <div className="glass p-4 md:p-6 rounded-[1.5rem] md:rounded-[2.5rem] border-white/10 flex items-center justify-between">
              <div>
                <div className="text-[9px] uppercase font-800 text-white/30 tracking-widest mb-2 px-1">Professor</div>
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 border border-white/20 shadow-glow shrink-0 overflow-hidden" />
                   <div className="flex flex-col min-w-0">
                      <div className="text-xs md:text-sm font-800 uppercase tracking-tighter leading-none truncate">{teacher?.name || "Specialist"}</div>
                      <div className="text-[9px] font-bold text-indigo-400 uppercase tracking-tighter mt-1 truncate">{specialty?.name || "Senior Lead"}</div>
                   </div>
                </div>
              </div>
           </div>
           
           <div className="glass p-4 md:p-6 rounded-[1.5rem] md:rounded-[2.5rem] border-white/10 flex flex-col justify-center">
              <div className="text-[9px] uppercase font-800 text-white/30 tracking-widest mb-1 px-1">Course Content</div>
              <div className="flex items-end justify-between">
                 <div className="text-2xl md:text-3xl font-800 italic uppercase leading-none">{sortedLessons.length}</div>
                 <div className="text-[9px] text-white/40 font-bold uppercase tracking-tighter">Total Lessons</div>
              </div>
           </div>

           <div className="glass p-6 rounded-[2.5rem] border-white/10 flex flex-col justify-center">
              <Button 
                onClick={() => completeLesson(activeLesson.id)} 
                disabled={enrollment.completedLessonIds.includes(activeLesson.id)}
                className="bg-white text-black hover:bg-neutral-200 uppercase text-[10px] font-800 tracking-widest h-14 rounded-3xl shadow-glow disabled:bg-white/5 disabled:text-white/20 disabled:shadow-none transition-all"
              >
                 {enrollment.completedLessonIds.includes(activeLesson.id) ? "Lesson Completed ✓" : "Mark as Completed_"}
              </Button>
           </div>
        </div>
      </main>

      {/* Comments Section */}
      <div className="mt-12 space-y-8">
        <header className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 flex items-center justify-center text-indigo-400">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-800 uppercase tracking-tighter italic">Comunidad • Feedback_</h2>
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Comparte tus dudas o comentarios con otros estudiantes</p>
          </div>
        </header>

        <Card className="glass border-white/10 rounded-[2.5rem] p-6 md:p-8 shadow-2xl">
          <div className="flex gap-4 items-start mb-8">
            <Avatar className="h-10 w-10 border border-white/10 shrink-0">
              <AvatarImage src={studentPhoto} />
              <AvatarFallback className="bg-indigo-600 text-white font-800 text-xs">
                {studentName.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-3">
              <Textarea 
                placeholder="Escribe un comentario..." 
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="bg-white/5 border-white/5 rounded-2xl min-h-[100px] resize-none focus:border-indigo-500/50 transition-colors uppercase text-xs font-bold tracking-tight placeholder:text-white/20"
              />
              <div className="flex justify-end">
                <Button 
                  onClick={handleSendComment}
                  disabled={!newComment.trim() || isSendingComment}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-6 h-10 uppercase text-[10px] font-800 tracking-widest flex gap-2 shadow-glow"
                >
                  {isSendingComment ? "Enviando..." : <><Send className="w-3.5 h-3.5" /> Publicar_</>}
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {comments.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-3xl">
                <p className="text-[10px] font-800 uppercase tracking-widest text-white/20">No hay comentarios aún. ¡Sé el primero!</p>
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-4 items-start group">
                  <Avatar className="h-8 w-8 border border-white/5 shrink-0">
                    <AvatarImage src={comment.userPhoto} />
                    <AvatarFallback className="bg-zinc-800 text-white/40 font-800 text-[10px]">
                      {comment.userName.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-800 uppercase tracking-tighter">{comment.userName}</span>
                      <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">
                        {comment.createdAt ? new Date(comment.createdAt.seconds * 1000).toLocaleDateString() : 'Justo ahora'}
                      </span>
                    </div>
                    <p className="text-sm text-white/70 leading-relaxed font-medium">
                      {comment.content}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Rating Dialog - Mandatory after finishing */}
      <Dialog open={isRatingOpen} onOpenChange={setIsRatingOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-3xl font-800 uppercase italic tracking-tighter">¡Mastery Achieved! 🎉</DialogTitle>
            <DialogDescription className="uppercase text-[10px] font-bold tracking-widest opacity-60">
              Tu feedback es vital para la comunidad_
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-8 py-6">
            <div className="space-y-4">
              <Label className="uppercase text-[10px] font-800 tracking-widest text-indigo-400">Calidad del Training</Label>
              <div className="flex justify-center gap-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className={`transition-all hover:scale-125 ${rating >= star ? "text-indigo-500 shadow-glow" : "text-white/10"}`}
                  >
                    <Star className={`w-10 h-10 ${rating >= star ? "fill-current" : ""}`} />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <Label className="uppercase text-[10px] font-800 tracking-widest text-indigo-400">Review Final_</Label>
              <Textarea 
                placeholder="¿Qué te pareció el curso? ¿Qué mejorarías?" 
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                className="min-h-[120px] bg-white/5 border-white/10 rounded-2xl uppercase text-[11px] font-bold resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              className="w-full h-14 bg-indigo-600 hover:bg-indigo-500 text-white font-800 uppercase tracking-widest rounded-2xl shadow-glow"
              onClick={handleFinishCourse}
              disabled={rating === 0 || !commentText || isSubmitting}
            >
              Cerrar Path y Ver Certificado_
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
