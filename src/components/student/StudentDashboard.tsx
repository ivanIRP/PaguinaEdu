import { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import { collection, onSnapshot, query, orderBy, doc, setDoc, updateDoc, where } from "firebase/firestore";
import { UserProfile, Course, Enrollment, Teacher, Specialty } from "../../types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { Search, BookOpen, GraduationCap, PlayCircle, CheckCircle2, User } from "lucide-react";
import { CoursePlayer } from "./CoursePlayer";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";

export function StudentDashboard({ user }: { user: UserProfile }) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterSpecialtyId, setFilterSpecialtyId] = useState<string | null>(null);
  const [viewingCourseDetail, setViewingCourseDetail] = useState<Course | null>(null);

  // Profile local state
  const [profileData, setProfileData] = useState({ fullName: user.fullName, photoURL: user.photoURL || "" });

  useEffect(() => {
    const unsubCourses = onSnapshot(query(collection(db, "courses"), orderBy("createdAt", "desc")), (snap) => {
      setCourses(snap.docs.map(d => ({ id: d.id, ...d.data() } as Course)));
    });
    const unsubTeachers = onSnapshot(collection(db, "teachers"), (snap) => {
      setTeachers(snap.docs.map(d => ({ id: d.id, ...d.data() } as Teacher)));
    });
    const unsubSpecialties = onSnapshot(collection(db, "specialties"), (snap) => {
      setSpecialties(snap.docs.map(d => ({ id: d.id, ...d.data() } as Specialty)));
    });
    const unsubEnrollments = onSnapshot(query(collection(db, "enrollments"), where("userId", "==", user.uid)), (snap) => {
      setEnrollments(snap.docs.map(d => ({ id: d.id, ...d.data() } as Enrollment)));
      setLoading(false);
    });

    return () => {
      unsubCourses();
      unsubTeachers();
      unsubSpecialties();
      unsubEnrollments();
    };
  }, [user.uid]);

  const enrollInCourse = async (course: Course) => {
    const enrollmentId = `${user.uid}_${course.id}`;
    const newEnrollment: Enrollment = {
      id: enrollmentId,
      userId: user.uid,
      courseId: course.id,
      completedLessonIds: [],
      isFinished: false
    };
    await setDoc(doc(db, "enrollments", enrollmentId), newEnrollment);
  };

  const updateProfile = async () => {
    await updateDoc(doc(db, "users", user.uid), {
      fullName: profileData.fullName,
      photoURL: profileData.photoURL
    });
    alert("Perfil actualizado");
  };

  if (selectedCourse) {
    const enrollment = enrollments.find(e => e.courseId === selectedCourse.id);
    return (
      <CoursePlayer 
        course={selectedCourse} 
        enrollment={enrollment!} 
        studentName={user.fullName}
        teachers={teachers}
        specialties={specialties}
        onBack={() => setSelectedCourse(null)} 
      />
    );
  }

  return (
    <div className="space-y-12">
      <header className="mb-8">
        <div className="space-y-1">
          <div className="text-[10px] md:text-xs font-bold text-indigo-500 uppercase tracking-widest opacity-80">Student • Portal</div>
          <h1 className="text-4xl md:text-7xl font-900 tracking-tighter leading-none uppercase">
            Hola, {user.fullName.split(" ")[0]}<br />
            <span className="bold-stroke opacity-40">Learning_</span>
          </h1>
        </div>
      </header>

      <Tabs defaultValue="browser" className="w-full flex flex-col items-start gap-8" orientation="horizontal">
        <div className="w-full overflow-x-auto no-scrollbar scroll-smooth -mx-4 px-4 md:mx-0 md:px-0">
          <TabsList className="glass p-1 h-10 w-max md:w-auto gap-0.5 border-white/5 bg-white/5 rounded-xl border flex shrink-0 shadow-lg">
            <TabsTrigger value="browser" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-lg px-4 md:px-6 py-1.5 transition-all md:uppercase text-[10px] font-bold tracking-widest flex items-center gap-2 shrink-0">
              <Search className="w-3.5 h-3.5" /> <span>Explorar</span>
            </TabsTrigger>
            <TabsTrigger value="my-courses" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-lg px-4 md:px-6 py-1.5 transition-all md:uppercase text-[10px] font-bold tracking-widest flex items-center gap-2 shrink-0">
              <BookOpen className="w-3.5 h-3.5" /> <span>Mis Cursos</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-lg px-4 md:px-6 py-1.5 transition-all md:uppercase text-[10px] font-bold tracking-widest flex items-center gap-2 shrink-0">
              <User className="w-3.5 h-3.5" /> <span>Perfil</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="browser" className="pt-0">
          <div className="flex items-center gap-2 mb-8 overflow-x-auto no-scrollbar pb-2">
            <span className="text-[10px] font-800 uppercase tracking-widest text-indigo-400 mr-2 shrink-0">Filtrar por Especialidad:</span>
            <Button 
              variant={filterSpecialtyId === null ? "default" : "outline"} 
              size="sm" 
              onClick={() => setFilterSpecialtyId(null)}
              className="rounded-full px-4 h-8 uppercase text-[10px] font-800 tracking-wider shrink-0"
            >
              Todos
            </Button>
            {specialties.map(spec => (
              <Button 
                key={spec.id}
                variant={filterSpecialtyId === spec.id ? "default" : "outline"} 
                size="sm" 
                onClick={() => setFilterSpecialtyId(spec.id)}
                className="rounded-full px-4 h-8 uppercase text-[10px] font-800 tracking-wider shrink-0"
              >
                {spec.name}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses
              .filter(c => filterSpecialtyId ? teachers.find(t => t.id === c.teacherId)?.specialtyId === filterSpecialtyId : true)
              .map(course => {
                const enrolled = enrollments.find(e => e.courseId === course.id);
                const teacher = teachers.find(t => t.id === course.teacherId);
                const specialty = specialties.find(s => s.id === teacher?.specialtyId);
                
                return (
                  <Card 
                    key={course.id} 
                    className="glass overflow-hidden border-white/10 group transition-all hover:scale-[1.02] cursor-pointer"
                    onClick={() => setViewingCourseDetail(course)}
                  >
                    <div className="h-56 relative overflow-hidden bg-black/40">
                      {course.bannerUrl ? (
                        <img src={course.bannerUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <GraduationCap className="w-16 h-16 opacity-5" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                      {enrolled?.isFinished && (
                        <Badge className="absolute top-4 right-4 bg-indigo-600 border-none uppercase text-[10px] font-800">Completado</Badge>
                      )}
                    </div>
                    <CardHeader className="space-y-1">
                      <div className="text-[10px] font-800 text-indigo-400 uppercase tracking-widest">{specialty?.name || "Sin Especialidad"}</div>
                      <CardTitle className="text-2xl font-800 uppercase tracking-tighter truncate leading-none pt-1">{course.title}</CardTitle>
                      <CardDescription className="uppercase text-[10px] font-bold tracking-wider opacity-60">
                        Prof. {teacher?.name} • {course.lessons.length} Módulos
                      </CardDescription>
                    </CardHeader>
                    <CardFooter className="pt-4 px-6 pb-6">
                      {enrolled ? (
                        <Button 
                          onClick={(e) => { e.stopPropagation(); setSelectedCourse(course); }} 
                          className="w-full bg-white/10 hover:bg-white/20 text-white border-white/10 uppercase text-[11px] font-800 h-12 tracking-widest rounded-xl"
                        >
                          Continuar
                        </Button>
                      ) : (
                        <Button 
                          onClick={(e) => { e.stopPropagation(); enrollInCourse(course); }} 
                          className="w-full bg-white text-black hover:bg-indigo-50 uppercase text-[11px] font-800 h-12 tracking-widest rounded-xl"
                        >
                          Iniciarse_
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                );
              })}
          </div>

          <Dialog open={!!viewingCourseDetail} onOpenChange={(open) => !open && setViewingCourseDetail(null)}>
            <DialogContent className="glass border-white/10 max-w-2xl bg-zinc-950/80 backdrop-blur-xl">
              <DialogHeader>
                <div className="text-[10px] font-800 text-indigo-400 uppercase tracking-[0.3em] mb-2">Detalles del Curso</div>
                <DialogTitle className="text-4xl font-800 uppercase tracking-tighter leading-none italic">{viewingCourseDetail?.title}</DialogTitle>
                <DialogDescription className="text-zinc-400 mt-4 leading-relaxed font-medium">
                  {viewingCourseDetail?.description || "No hay una descripción breve disponible para este curso aún."}
                </DialogDescription>
              </DialogHeader>
              <div className="pt-6 flex gap-4">
                <div className="flex-1 p-4 glass rounded-2xl border-white/5">
                  <div className="text-[10px] font-800 uppercase opacity-30 tracking-widest mb-1">Instructor</div>
                  <div className="font-bold">{teachers.find(t => t.id === viewingCourseDetail?.teacherId)?.name}</div>
                </div>
                <div className="flex-1 p-4 glass rounded-2xl border-white/5">
                  <div className="text-[10px] font-800 uppercase opacity-30 tracking-widest mb-1">Módulos</div>
                  <div className="font-bold">{viewingCourseDetail?.lessons.length} Módulos de Aprendizaje</div>
                </div>
              </div>
              <div className="pt-6">
                {enrollments.find(e => e.courseId === viewingCourseDetail?.id) ? (
                  <Button 
                    onClick={() => { setSelectedCourse(viewingCourseDetail); setViewingCourseDetail(null); }} 
                    className="w-full bg-indigo-600 hover:bg-indigo-500 rounded-2xl h-14 uppercase text-[11px] font-800 tracking-widest shadow-glow"
                  >
                    Continuar Aprendiendo_
                  </Button>
                ) : (
                  <Button 
                    onClick={() => { if(viewingCourseDetail) enrollInCourse(viewingCourseDetail); setViewingCourseDetail(null); }} 
                    className="w-full bg-white text-black hover:bg-zinc-200 rounded-2xl h-14 uppercase text-[11px] font-800 tracking-widest"
                  >
                    Comenzar Ruta Ahora_
                  </Button>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="my-courses" className="pt-6">
          {enrollments.length === 0 ? (
            <div className="text-center py-20 bg-muted/20 rounded-2xl border-2 border-dashed">
               <GraduationCap className="w-12 h-12 mx-auto opacity-20" />
               <p className="mt-4 text-muted-foreground">Aún no te has inscrito en ningún curso.</p>
               <Button variant="link" onClick={() => {}}>¡Explora el catálogo!</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrollments.map(enrollment => {
                const course = courses.find(c => c.id === enrollment.courseId);
                if (!course) return null;
                const progress = Math.round((enrollment.completedLessonIds.length / course.lessons.length) * 100);
                
                return (
                  <Card key={enrollment.id} className="cursor-pointer" onClick={() => setSelectedCourse(course)}>
                    <CardHeader className="pb-2">
                       <CardTitle className="text-lg">{course.title}</CardTitle>
                       <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>{progress}% Progreso</span>
                          <span>{enrollment.completedLessonIds.length}/{course.lessons.length} Lecciones</span>
                       </div>
                    </CardHeader>
                    <CardContent>
                      <Progress value={progress} className="h-2" />
                    </CardContent>
                    <CardFooter className="flex justify-between items-center">
                       {enrollment.isFinished ? (
                         <div className="flex items-center gap-1 text-primary text-sm font-bold">
                           <CheckCircle2 className="w-4 h-4" /> Completado
                         </div>
                       ) : (
                         <div className="flex items-center gap-1 text-muted-foreground text-sm">
                           <PlayCircle className="w-4 h-4" /> En curso
                         </div>
                       )}
                       <Button size="sm" variant="ghost">Ver lecciones</Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="profile" className="pt-6">
           <Card className="max-w-xl mx-auto">
             <CardHeader>
               <CardTitle>Configuración de Perfil</CardTitle>
               <CardDescription>Personaliza cómo te ven los demás en la plataforma.</CardDescription>
             </CardHeader>
             <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar className="w-20 h-20">
                      <AvatarImage src={profileData.photoURL} />
                      <AvatarFallback className="text-xl font-bold">{user.fullName.substring(0,2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-lg">{user.fullName}</h3>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>

                <div className="grid gap-4 pt-4">
                  <div className="space-y-2">
                    <Label>Nombre Completo</Label>
                    <Input value={profileData.fullName} onChange={e => setProfileData({...profileData, fullName: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Imagen URL (Avatar)</Label>
                    <Input value={profileData.photoURL} onChange={e => setProfileData({...profileData, photoURL: e.target.value})} placeholder="https://..." />
                  </div>
                </div>
             </CardContent>
             <CardFooter className="border-t pt-6 bg-muted/10">
               <Button onClick={updateProfile} className="ml-auto">Guardar Cambios</Button>
             </CardFooter>
           </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
