import { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import { collection, onSnapshot, query, orderBy, doc, setDoc, updateDoc } from "firebase/firestore";
import { UserProfile, Course, Enrollment, Teacher } from "../../types";
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

export function StudentDashboard({ user }: { user: UserProfile }) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile local state
  const [profileData, setProfileData] = useState({ fullName: user.fullName, photoURL: user.photoURL || "" });

  useEffect(() => {
    const unsubCourses = onSnapshot(query(collection(db, "courses"), orderBy("createdAt", "desc")), (snap) => {
      setCourses(snap.docs.map(d => ({ id: d.id, ...d.data() } as Course)));
    });
    const unsubTeachers = onSnapshot(collection(db, "teachers"), (snap) => {
      setTeachers(snap.docs.map(d => ({ id: d.id, ...d.data() } as Teacher)));
    });
    const unsubEnrollments = onSnapshot(collection(db, "enrollments"), (snap) => {
      setEnrollments(snap.docs.map(d => ({ id: d.id, ...d.data() } as Enrollment)).filter(e => e.userId === user.uid));
      setLoading(false);
    });

    return () => {
      unsubCourses();
      unsubTeachers();
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
        onBack={() => setSelectedCourse(null)} 
      />
    );
  }

  return (
    <div className="space-y-12">
      <header className="flex justify-between items-end">
        <div className="space-y-2">
          <div className="text-sm font-bold text-indigo-500 uppercase tracking-[0.3em]">Student • Portal</div>
          <h1 className="text-6xl md:text-8xl font-800 tracking-tighter leading-none uppercase">
            Hola, {user.fullName.split(" ")[0]}<br />
            <span className="bold-stroke opacity-60">Learning_</span>
          </h1>
        </div>
      </header>

      <Tabs defaultValue="browser" className="w-full">
        <TabsList className="glass p-1 h-auto w-fit mb-8 gap-1">
          <TabsTrigger value="browser" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-lg px-6 py-2 transition-all uppercase text-[10px] font-bold tracking-widest flex gap-2">
            <Search className="w-3 h-3" /> Explorar
          </TabsTrigger>
          <TabsTrigger value="my-courses" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-lg px-6 py-2 transition-all uppercase text-[10px] font-bold tracking-widest flex gap-2">
            <BookOpen className="w-3 h-3" /> Mis Cursos
          </TabsTrigger>
          <TabsTrigger value="profile" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-lg px-6 py-2 transition-all uppercase text-[10px] font-bold tracking-widest flex gap-2">
            <User className="w-3 h-3" /> Perfil
          </TabsTrigger>
        </TabsList>

        <TabsContent value="browser" className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map(course => {
              const enrolled = enrollments.find(e => e.courseId === course.id);
              return (
                <Card key={course.id} className="glass overflow-hidden border-white/10 group transition-all hover:scale-[1.02]">
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
                    <div className="text-[10px] font-800 text-indigo-400 uppercase tracking-widest">Tecnología</div>
                    <CardTitle className="text-2xl font-800 uppercase tracking-tighter truncate leading-none pt-1">{course.title}</CardTitle>
                    <CardDescription className="uppercase text-[10px] font-bold tracking-wider opacity-60">
                      Prof. {teachers.find(t => t.id === course.teacherId)?.name} • {course.lessons.length} Módulos
                    </CardDescription>
                  </CardHeader>
                  <CardFooter className="pt-4 px-6 pb-6">
                    {enrolled ? (
                      <Button onClick={() => setSelectedCourse(course)} className="w-full bg-white/10 hover:bg-white/20 text-white border-white/10 uppercase text-[11px] font-800 h-12 tracking-widest rounded-xl">
                        Continuar
                      </Button>
                    ) : (
                      <Button onClick={() => enrollInCourse(course)} className="w-full bg-white text-black hover:bg-indigo-50 uppercase text-[11px] font-800 h-12 tracking-widest rounded-xl">
                        Iniciarse_
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
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
