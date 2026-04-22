import { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import { collection, addDoc, getDocs, serverTimestamp, query, orderBy } from "firebase/firestore";
import { UserProfile, Teacher, Course, Enrollment } from "../../types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Users, BookOpen, BarChart3, Plus, Trash2, LayoutDashboard } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

export function AdminDashboard({ user }: { user: UserProfile }) {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [newTeacher, setNewTeacher] = useState({ name: "", email: "", specialty: "" });
  const [newCourse, setNewCourse] = useState({ 
    title: "", 
    description: "", 
    teacherId: "", 
    bannerUrl: "",
    lessons: [{ id: "1", title: "", videoUrl: "" }] 
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const teacherSnap = await getDocs(collection(db, "teachers"));
    const courseSnap = await getDocs(query(collection(db, "courses"), orderBy("createdAt", "desc")));
    const enrollmentSnap = await getDocs(collection(db, "enrollments"));
    
    setTeachers(teacherSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Teacher)));
    setCourses(courseSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course)));
    setEnrollments(enrollmentSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Enrollment)));
    setLoading(false);
  };

  const addTeacher = async () => {
    if (!newTeacher.name || !newTeacher.email) return;
    await addDoc(collection(db, "teachers"), newTeacher);
    setNewTeacher({ name: "", email: "", specialty: "" });
    fetchData();
  };

  const addLesson = () => {
    setNewCourse({
      ...newCourse,
      lessons: [...newCourse.lessons, { id: Date.now().toString(), title: "", videoUrl: "" }]
    });
  };

  const removeLesson = (index: number) => {
    const lessons = [...newCourse.lessons];
    lessons.splice(index, 1);
    setNewCourse({ ...newCourse, lessons });
  };

  const handleLessonChange = (index: number, field: "title" | "videoUrl", value: string) => {
    const lessons = [...newCourse.lessons];
    lessons[index][field] = value;
    setNewCourse({ ...newCourse, lessons });
  };

  const addCourse = async () => {
    if (!newCourse.title || !newCourse.teacherId) return;
    await addDoc(collection(db, "courses"), {
      ...newCourse,
      createdAt: serverTimestamp()
    });
    setNewCourse({ title: "", description: "", teacherId: "", bannerUrl: "", lessons: [{ id: "1", title: "", videoUrl: "" }] });
    fetchData();
  };

  // Stats calculation
  const statsData = courses.map(course => {
    const courseEnrollments = enrollments.filter(e => e.courseId === course.id && e.rating !== undefined);
    const avgRating = courseEnrollments.length > 0 
      ? courseEnrollments.reduce((acc, curr) => acc + (curr.rating || 0), 0) / courseEnrollments.length 
      : 0;
    return {
      name: course.title,
      score: avgRating,
      votes: courseEnrollments.length
    };
  }).filter(d => d.votes > 0).sort((a, b) => b.score - a.score).slice(0, 5);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="text-sm font-bold text-indigo-500 uppercase tracking-[0.3em]">Administrator • Core</div>
          <h1 className="text-6xl md:text-8xl font-800 tracking-tighter leading-none uppercase">
            Platform<br />
            <span className="bold-stroke opacity-60 italic">Control_</span>
          </h1>
        </div>
      </header>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="glass p-1 h-auto w-fit mb-12 gap-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-lg px-6 py-2 transition-all uppercase text-[10px] font-bold tracking-widest flex gap-2">
            <LayoutDashboard className="w-3 h-3" /> Resumen
          </TabsTrigger>
          <TabsTrigger value="teachers" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-lg px-6 py-2 transition-all uppercase text-[10px] font-bold tracking-widest flex gap-2">
            <Users className="w-3 h-3" /> Profesores
          </TabsTrigger>
          <TabsTrigger value="courses" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-lg px-6 py-2 transition-all uppercase text-[10px] font-bold tracking-widest flex gap-2">
            <BookOpen className="w-3 h-3" /> Cursos
          </TabsTrigger>
          <TabsTrigger value="stats" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-lg px-6 py-2 transition-all uppercase text-[10px] font-bold tracking-widest flex gap-2">
            <BarChart3 className="w-3 h-3" /> Reportes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass p-8 rounded-[32px] relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-600/10 blur-[40px] group-hover:bg-indigo-600/20 transition-all"></div>
              <div className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-4">Total Profesores</div>
              <div className="text-6xl font-800 italic leading-none">{teachers.length}</div>
              <div className="text-[10px] text-indigo-400 font-bold uppercase mt-2 tracking-tighter">Verified Specialists</div>
            </div>
            
            <div className="glass p-8 rounded-[32px] relative overflow-hidden group">
               <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-600/10 blur-[40px] group-hover:bg-purple-600/20 transition-all"></div>
              <div className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-4">Cursos Activos</div>
              <div className="text-6xl font-800 italic leading-none">{courses.length}</div>
              <div className="text-[10px] text-purple-400 font-bold uppercase mt-2 tracking-tighter">Live Learning Paths</div>
            </div>

            <div className="glass p-8 rounded-[32px] relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-green-600/10 blur-[40px] group-hover:bg-green-600/20 transition-all"></div>
              <div className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-4">Matriculados</div>
              <div className="text-6xl font-800 italic leading-none">{enrollments.length}</div>
              <div className="text-[10px] text-green-400 font-bold uppercase mt-2 tracking-tighter">Active Students</div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="teachers">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Agregar Profesor</CardTitle>
                <CardDescription>Crea un nuevo perfil de docente especializado.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Nombre Completo</Label>
                  <Input value={newTeacher.name} onChange={e => setNewTeacher({...newTeacher, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Correo Electrónico</Label>
                  <Input type="email" value={newTeacher.email} onChange={e => setNewTeacher({...newTeacher, email: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Especialidad</Label>
                  <Input placeholder="Ej: React, Backend, IA..." value={newTeacher.specialty} onChange={e => setNewTeacher({...newTeacher, specialty: e.target.value})} />
                </div>
                <Button onClick={addTeacher} className="w-full">Registrar Profesor</Button>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Listado de Profesores</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Especialidad</TableHead>
                      <TableHead>Email</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teachers.map(t => (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">{t.name}</TableCell>
                        <TableCell>{t.specialty}</TableCell>
                        <TableCell>{t.email}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="courses">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-1 h-fit">
              <CardHeader>
                <CardTitle>Crear Curso</CardTitle>
                <CardDescription>Define el curso y su secuencia de lecciones.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Título del Curso</Label>
                  <Input value={newCourse.title} onChange={e => setNewCourse({...newCourse, title: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Profesor</Label>
                  <Select onValueChange={val => setNewCourse({...newCourse, teacherId: val})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar profesor" />
                    </SelectTrigger>
                    <SelectContent>
                      {teachers.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Banner URL (Imagen)</Label>
                  <Input value={newCourse.bannerUrl} onChange={e => setNewCourse({...newCourse, bannerUrl: e.target.value})} />
                </div>
                
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <Label className="font-bold">Lecciones (Secuenciales)</Label>
                    <Button variant="outline" size="sm" onClick={addLesson}><Plus className="w-4 h-4" /></Button>
                  </div>
                  {newCourse.lessons.map((lesson, idx) => (
                    <div key={lesson.id} className="p-3 border rounded-lg space-y-2 relative">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute right-1 top-1 h-6 w-6 text-destructive"
                        onClick={() => removeLesson(idx)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                      <Input placeholder="Título de lección" value={lesson.title} onChange={e => handleLessonChange(idx, "title", e.target.value)} />
                      <Input placeholder="Video URL (Vimeo/YT)" value={lesson.videoUrl} onChange={e => handleLessonChange(idx, "videoUrl", e.target.value)} />
                    </div>
                  ))}
                </div>

                <Button onClick={addCourse} className="w-full mt-4">Publicar Curso</Button>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Cursos Publicados</CardTitle>
              </CardHeader>
              <CardContent>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {courses.map(c => (
                      <Card key={c.id} className="overflow-hidden">
                        <div className="h-32 bg-muted relative">
                           {c.bannerUrl && <img src={c.bannerUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />}
                           {!c.bannerUrl && <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-8 h-8 opacity-20" /></div>}
                        </div>
                        <CardHeader className="p-4">
                          <CardTitle className="text-lg">{c.title}</CardTitle>
                          <CardDescription>
                            {teachers.find(t => t.id === c.teacherId)?.name} • {c.lessons.length} Lecciones
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    ))}
                 </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="stats">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Top 5 Cursos con Mejor Calificación</CardTitle>
                <CardDescription>Puntaje promedio basado en reseñas de usuarios.</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statsData} layout="vertical" margin={{ left: 40, right: 40, top: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis type="number" domain={[0, 5]} hide />
                    <YAxis dataKey="name" type="category" width={120} />
                    <Tooltip />
                    <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                       {statsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Últimas reseñas</CardTitle>
                <CardDescription>Comentarios y sugerencias de la comunidad.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                 {enrollments.filter(e => e.comment).slice(0, 6).map(e => (
                   <div key={e.id} className="border-b pb-4 last:border-0 last:pb-0">
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-sm">Curso: {courses.find(c => c.id === e.courseId)?.title}</span>
                        <span className="text-yellow-500 font-bold">{"★".repeat(e.rating || 0)}</span>
                      </div>
                      <p className="text-sm italic text-muted-foreground mt-1">"{e.comment}"</p>
                   </div>
                 ))}
                 {enrollments.filter(e => e.comment).length === 0 && <p className="text-center text-muted-foreground py-10">No hay reseñas aún.</p>}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
