import { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import { collection, addDoc, onSnapshot, serverTimestamp, query, orderBy, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { UserProfile, Teacher, Course, Enrollment, Specialty, Lesson, Comment } from "../../types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Users, BookOpen, BarChart3, Plus, Trash2, LayoutDashboard, Settings, Edit, ArrowUp, ArrowDown, ExternalLink, Upload, Eye, MessageSquare, TrendingUp, Star, CheckCircle2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import { motion } from "motion/react";

import { CoursePlayer } from "../student/CoursePlayer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";

export function AdminDashboard({ user }: { user: UserProfile }) {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [newSpecialty, setNewSpecialty] = useState("");
  const [editingSpecialtyId, setEditingSpecialtyId] = useState<string | null>(null);
  
  const [newTeacher, setNewTeacher] = useState({ name: "", email: "", specialtyId: "" });
  const [editingTeacherId, setEditingTeacherId] = useState<string | null>(null);

  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [newCourse, setNewCourse] = useState({ 
    title: "", 
    description: "", 
    teacherId: "", 
    bannerUrl: "",
    lessons: [{ id: "1", title: "", videoUrl: "", order: 1 }] 
  });

  useEffect(() => {
    setLoading(true);
    const unsubTeachers = onSnapshot(collection(db, "teachers"), (snap) => {
      setTeachers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Teacher)));
    });
    const unsubCourses = onSnapshot(query(collection(db, "courses"), orderBy("createdAt", "desc")), (snap) => {
      setCourses(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course)));
    });
    const unsubEnrollments = onSnapshot(collection(db, "enrollments"), (snap) => {
      setEnrollments(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Enrollment)));
      setLoading(false);
    });
    const unsubSpecialties = onSnapshot(collection(db, "specialties"), (snap) => {
      setSpecialties(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Specialty)));
    });
    const unsubComments = onSnapshot(query(collection(db, "comments"), orderBy("createdAt", "desc")), (snap) => {
      setComments(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment)));
    });

    return () => {
      unsubTeachers();
      unsubCourses();
      unsubEnrollments();
      unsubSpecialties();
      unsubComments();
    };
  }, []);

  const addSpecialty = async () => {
    if (!newSpecialty) return;
    if (editingSpecialtyId) {
      await updateDoc(doc(db, "specialties", editingSpecialtyId), { name: newSpecialty });
      setEditingSpecialtyId(null);
    } else {
      await addDoc(collection(db, "specialties"), { name: newSpecialty, createdAt: serverTimestamp() });
    }
    setNewSpecialty("");
  };

  const editSpecialty = (s: Specialty) => {
    setNewSpecialty(s.name);
    setEditingSpecialtyId(s.id);
  };

  const deleteSpecialty = async (id: string) => {
    if (!confirm("¿Eliminar especialidad?")) return;
    await deleteDoc(doc(db, "specialties", id));
  };

  const addTeacher = async () => {
    if (!newTeacher.name || !newTeacher.email || !newTeacher.specialtyId) return;
    if (editingTeacherId) {
      await updateDoc(doc(db, "teachers", editingTeacherId), newTeacher);
      setEditingTeacherId(null);
    } else {
      await addDoc(collection(db, "teachers"), newTeacher);
    }
    setNewTeacher({ name: "", email: "", specialtyId: "" });
  };

  const editTeacher = (t: Teacher) => {
    setNewTeacher({ name: t.name, email: t.email, specialtyId: t.specialtyId });
    setEditingTeacherId(t.id);
  };

  const addLesson = () => {
    const nextOrder = newCourse.lessons.length + 1;
    setNewCourse({
      ...newCourse,
      lessons: [...newCourse.lessons, { id: Date.now().toString(), title: "", videoUrl: "", order: nextOrder }]
    });
  };

  const moveLesson = (index: number, direction: "up" | "down") => {
    const lessons = [...newCourse.lessons];
    if (direction === "up" && index > 0) {
      [lessons[index], lessons[index - 1]] = [lessons[index - 1], lessons[index]];
    } else if (direction === "down" && index < lessons.length - 1) {
      [lessons[index], lessons[index + 1]] = [lessons[index + 1], lessons[index]];
    }
    // Update orders
    const updatedLessons = lessons.map((l, i) => ({ ...l, order: i + 1 }));
    setNewCourse({ ...newCourse, lessons: updatedLessons });
  };

  const handleLessonChange = (index: number, field: "title" | "videoUrl", value: string) => {
    const lessons = [...newCourse.lessons];
    lessons[index][field] = value;
    setNewCourse({ ...newCourse, lessons });
  };

  const handleFileUpload = (index: number, file: File | null) => {
    if (!file) return;
    // In a real app, you'd upload this to Firebase Storage.
    // For this demo/preview, we'll create a local Object URL.
    const url = URL.createObjectURL(file);
    handleLessonChange(index, "videoUrl", url);
  };

  const addCourse = async () => {
    if (!newCourse.title || !newCourse.teacherId) return;
    
    if (editingCourseId) {
      await updateDoc(doc(db, "courses", editingCourseId), {
        ...newCourse,
        updatedAt: serverTimestamp()
      });
      setEditingCourseId(null);
    } else {
      await addDoc(collection(db, "courses"), {
        ...newCourse,
        createdAt: serverTimestamp()
      });
    }
    
    setNewCourse({ 
      title: "", 
      description: "", 
      teacherId: "", 
      bannerUrl: "", 
      lessons: [{ id: "1", title: "", videoUrl: "", order: 1 }] 
    });
  };

  const editCourse = (course: Course) => {
    setEditingCourseId(course.id);
    setNewCourse({
      title: course.title,
      description: course.description,
      teacherId: course.teacherId,
      bannerUrl: course.bannerUrl,
      lessons: course.lessons.sort((a, b) => a.order - b.order) || [{ id: "1", title: "", videoUrl: "", order: 1 }]
    });
    // Scroll to form or switch tab if needed - courses tab is likely already active
  };

  const deleteCourse = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este curso?")) return;
    await deleteDoc(doc(db, "courses", id));
  };

  const deleteComment = async (id: string) => {
    if (!confirm("¿Eliminar este comentario permanentemente?")) return;
    await deleteDoc(doc(db, "comments", id));
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
      <header className="mb-8 overflow-hidden">
        <div className="space-y-1">
          <div className="text-[10px] md:text-xs font-bold text-indigo-500 uppercase tracking-widest opacity-80">Admin Hub</div>
          <h1 className="text-4xl md:text-7xl font-900 tracking-tighter leading-none uppercase">
            Platform<br />
            <span className="bold-stroke opacity-40 italic">Control_</span>
          </h1>
        </div>
      </header>

      <Tabs defaultValue="overview" className="w-full flex flex-col items-start gap-8" orientation="horizontal">
        <div className="w-full overflow-x-auto no-scrollbar scroll-smooth -mx-4 px-4 md:mx-0 md:px-0">
          <TabsList className="glass p-1 h-10 w-max md:w-auto gap-0.5 border-white/5 bg-white/5 rounded-xl border flex shrink-0 shadow-lg">
            <TabsTrigger value="overview" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-lg px-3 md:px-5 py-1.5 transition-all md:uppercase text-[10px] font-bold tracking-widest flex items-center gap-2 shrink-0">
              <LayoutDashboard className="w-3.5 h-3.5" /> <span className="hidden xs:inline">Resumen</span>
            </TabsTrigger>
            <TabsTrigger value="teachers" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-lg px-3 md:px-5 py-1.5 transition-all md:uppercase text-[10px] font-bold tracking-widest flex items-center gap-2 shrink-0">
              <Users className="w-3.5 h-3.5" /> <span className="hidden xs:inline">Profesores</span>
            </TabsTrigger>
            <TabsTrigger value="courses" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-lg px-3 md:px-5 py-1.5 transition-all md:uppercase text-[10px] font-bold tracking-widest flex items-center gap-2 shrink-0">
              <BookOpen className="w-3.5 h-3.5" /> <span className="hidden xs:inline">Cursos</span>
            </TabsTrigger>
            <TabsTrigger value="specialties" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-lg px-3 md:px-5 py-1.5 transition-all md:uppercase text-[10px] font-bold tracking-widest flex items-center gap-2 shrink-0">
              <Settings className="w-3.5 h-3.5" /> <span className="hidden xs:inline">Ajustes</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-lg px-3 md:px-5 py-1.5 transition-all md:uppercase text-[10px] font-bold tracking-widest flex items-center gap-2 shrink-0">
              <BarChart3 className="w-3.5 h-3.5" /> <span className="hidden xs:inline">Reportes</span>
            </TabsTrigger>
            <TabsTrigger value="community" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-lg px-3 md:px-5 py-1.5 transition-all md:uppercase text-[10px] font-bold tracking-widest flex items-center gap-2 shrink-0">
              <MessageSquare className="w-3.5 h-3.5" /> <span className="hidden xs:inline">Comentarios</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="glass border-white/5 p-8 rounded-[32px]">
              <CardHeader className="p-0 mb-6">
                <CardTitle className="text-2xl font-800 tracking-tighter uppercase italic flex items-center gap-3">
                  <TrendingUp className="w-6 h-6 text-indigo-500" />
                  Top Popularidad_
                </CardTitle>
                <CardDescription className="text-[10px] uppercase font-bold tracking-widest text-white/40">Cursos con mayor ratio de tracción y estudiantes activos.</CardDescription>
              </CardHeader>
              <div className="space-y-6">
                {courses.map(course => ({
                  ...course,
                  count: enrollments.filter(e => e.courseId === course.id).length
                })).sort((a, b) => b.count - a.count).slice(0, 3).map((c, i) => (
                  <div key={c.id} className="flex items-center gap-4 group">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-xl font-900 italic text-indigo-500 shadow-glow">
                      0{i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-800 uppercase tracking-tighter truncate">{c.title}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="h-1.5 flex-1 bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-indigo-500/50" 
                            style={{ width: `${(c.count / (enrollments.length || 1)) * 100}%` }} 
                          />
                        </div>
                        <span className="text-[10px] font-bold text-white/40 uppercase">{c.count} st_</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="glass border-white/5 p-8 rounded-[32px]">
              <CardHeader className="p-0 mb-6">
                <CardTitle className="text-2xl font-800 tracking-tighter uppercase italic flex items-center gap-3">
                  <Star className="w-6 h-6 text-yellow-500" />
                  Calidad de Contenido_
                </CardTitle>
                <CardDescription className="text-[10px] uppercase font-bold tracking-widest text-white/40">Ranking basado en el feedback directo de los estudiantes.</CardDescription>
              </CardHeader>
              <div className="space-y-6">
                {statsData.slice(0, 3).map((s, i) => (
                  <div key={i} className="flex items-center justify-between group">
                    <div className="flex flex-col">
                      <span className="text-sm font-800 uppercase tracking-tighter max-w-[200px] truncate">{s.name}</span>
                      <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{s.votes} reviews_</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <span className="text-2xl font-900 italic text-yellow-500">{s.score.toFixed(1)}</span>
                       <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="teachers">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>{editingTeacherId ? "Editar Profesor" : "Agregar Profesor"}</CardTitle>
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
                  <Select 
                    value={newTeacher.specialtyId || ""} 
                    onValueChange={val => setNewTeacher({...newTeacher, specialtyId: val || ""})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar especialidad" />
                    </SelectTrigger>
                    <SelectContent>
                      {specialties.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                   {editingTeacherId && (
                     <Button variant="outline" onClick={() => {
                        setEditingTeacherId(null);
                        setNewTeacher({ name: "", email: "", specialtyId: "" });
                     }} className="flex-1">Cancelar</Button>
                   )}
                   <Button onClick={addTeacher} className="flex-[2]">{editingTeacherId ? "Guardar Cambios" : "Registrar Profesor"}</Button>
                </div>
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
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teachers.map(t => (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">{t.name}</TableCell>
                        <TableCell>{specialties.find(s => s.id === t.specialtyId)?.name || 'Sin especialidad'}</TableCell>
                        <TableCell>{t.email}</TableCell>
                        <TableCell className="text-right">
                           <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => editTeacher(t)}>
                                 <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={async () => {
                                 if(confirm("¿Eliminar profesor?")) {
                                    await deleteDoc(doc(db, "teachers", t.id));
                                 }
                              }}>
                                 <Trash2 className="w-4 h-4" />
                              </Button>
                           </div>
                        </TableCell>
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
                <CardTitle>{editingCourseId ? "Editar Curso" : "Crear Curso"}</CardTitle>
                <CardDescription>Define el curso y su secuencia de lecciones.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Título del Curso</Label>
                  <Input value={newCourse.title} onChange={e => setNewCourse({...newCourse, title: e.target.value})} placeholder="Ej: React Avanzado" />
                </div>
                <div className="space-y-2">
                  <Label>Breve Descripción</Label>
                  <textarea 
                    className="w-full flex min-h-[80px] rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Describe de qué trata el curso..."
                    value={newCourse.description}
                    onChange={e => setNewCourse({...newCourse, description: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Profesor</Label>
                  <Select 
                    value={newCourse.teacherId || ""} 
                    onValueChange={val => setNewCourse({...newCourse, teacherId: val || ""})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar profesor" />
                    </SelectTrigger>
                    <SelectContent>
                      {teachers.map(t => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name} ({specialties.find(s => s.id === t.specialtyId)?.name || 'Sin especialidad'})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Banner URL (Imagen)</Label>
                  <Input value={newCourse.bannerUrl} onChange={e => setNewCourse({...newCourse, bannerUrl: e.target.value})} placeholder="https://..." />
                </div>
                
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <Label className="font-bold text-indigo-400 uppercase text-[10px] tracking-widest underline decoration-indigo-500/50 underline-offset-4">Lecciones (Arrastrables)</Label>
                    <Button variant="outline" size="sm" onClick={addLesson} className="h-8 w-8 rounded-lg bg-white/5 border-white/10 hover:bg-white/10 transition-all"><Plus className="w-4 h-4" /></Button>
                  </div>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {newCourse.lessons.map((lesson, idx) => (
                      <div key={lesson.id} className="p-4 glass rounded-2xl space-y-3 relative border-white/5 group hover:border-indigo-500/30 transition-all">
                        <div className="flex justify-between items-center mb-1">
                           <span className="text-[10px] font-800 text-indigo-500 tracking-widest uppercase">Lesson {idx + 1}</span>
                           <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md hover:bg-white/5" onClick={() => moveLesson(idx, "up")} disabled={idx === 0}><ArrowUp className="w-3 h-3" /></Button>
                              <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md hover:bg-white/5" onClick={() => moveLesson(idx, "down")} disabled={idx === newCourse.lessons.length - 1}><ArrowDown className="w-3 h-3" /></Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 rounded-md text-red-500/50 hover:text-red-500 hover:bg-red-500/10"
                                onClick={() => {
                                  const lessons = [...newCourse.lessons];
                                  lessons.splice(idx, 1);
                                  setNewCourse({ ...newCourse, lessons });
                                }}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                           </div>
                        </div>
                        <Input placeholder="Título de lección" className="h-10 text-xs font-bold rounded-xl border-white/5 bg-white/5" value={lesson.title} onChange={e => handleLessonChange(idx, "title", e.target.value)} />
                        <div className="flex gap-2">
                           <Input placeholder="Video URL o Link Directo" className="flex-1 h-10 text-xs font-mono rounded-xl border-white/5 bg-white/5" value={lesson.videoUrl} onChange={e => handleLessonChange(idx, "videoUrl", e.target.value)} />
                           <Label className="h-10 px-4 flex items-center justify-center bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:bg-white/10 transition-all shrink-0">
                             <Upload className="w-4 h-4" />
                             <input type="file" accept="video/*" className="hidden" onChange={(e) => handleFileUpload(idx, e.target.files?.[0] || null)} />
                           </Label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                   <div className="flex gap-2">
                      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                        <DialogTrigger 
                          render={
                            <Button 
                              variant="outline"
                              disabled={!newCourse.title || newCourse.lessons.length === 0}
                              className="flex-1 rounded-2xl h-12 uppercase text-[10px] font-800 tracking-widest bg-white/5 border-white/10"
                            />
                          }
                        >
                          <Eye className="w-4 h-4 mr-2" /> Vista Previa
                        </DialogTrigger>
                        <DialogContent className="max-w-[95vw] w-[1400px] h-[90vh] p-0 overflow-hidden bg-black border-none">
                           <DialogHeader className="p-4 bg-zinc-950 border-b border-white/10 shrink-0">
                             <DialogTitle className="uppercase tracking-tighter font-800 italic text-indigo-400">Preview: {newCourse.title || "Untitled Course"}</DialogTitle>
                           </DialogHeader>
                           <div className="flex-1 overflow-auto p-4 md:p-12">
                              <CoursePlayer 
                                course={{...newCourse, id: "preview", createdAt: new Date().toISOString()} as any}
                                enrollment={{ id: "preview-enroll", userId: user.uid, courseId: "preview", completedLessonIds: [], isFinished: false }} 
                                studentName={user.fullName}
                                teachers={teachers}
                                specialties={specialties}
                                onBack={() => setIsPreviewOpen(false)} 
                              />
                           </div>
                        </DialogContent>
                      </Dialog>

                      {editingCourseId && (
                        <Button variant="outline" onClick={() => {
                          setEditingCourseId(null);
                          setNewCourse({ title: "", description: "", teacherId: "", bannerUrl: "", lessons: [{ id: "1", title: "", videoUrl: "", order: 1 }] });
                        }} className="flex-1 rounded-2xl h-12 uppercase text-[10px] font-800 tracking-widest">Cancelar</Button>
                      )}
                   </div>
                   <Button onClick={addCourse} className="w-full bg-indigo-600 hover:bg-indigo-500 rounded-2xl h-14 uppercase text-[10px] font-800 tracking-widest shadow-glow">
                     {editingCourseId ? "Guardar Cambios" : "Publicar Curso_"}
                   </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 glass border-white/5">
              <CardHeader>
                <CardTitle>Cursos Publicados</CardTitle>
                <CardDescription>Gestiona tus rutas de aprendizaje activas.</CardDescription>
              </CardHeader>
              <CardContent>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    {courses.map(c => (
                      <div key={c.id} className="group relative glass rounded-[24px] md:rounded-[32px] overflow-hidden border-white/5 hover:border-white/20 transition-all hover:translate-y-[-4px]">
                        <div className="h-32 md:h-40 bg-zinc-900 relative">
                           {c.bannerUrl && <img src={c.bannerUrl} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" referrerPolicy="no-referrer" />}
                           <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                           <div className="absolute top-3 right-3 md:top-4 md:right-4 flex gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity z-10">
                              <Button variant="secondary" size="icon" className="h-8 w-8 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white" onClick={() => editCourse(c)}><Edit className="w-4 h-4 text-black" /></Button>
                              <Button variant="destructive" size="icon" className="h-8 w-8 rounded-lg" onClick={() => deleteCourse(c.id)}><Trash2 className="w-4 h-4" /></Button>
                           </div>
                        </div>
                        <div className="p-4 md:p-6">
                           <div className="text-[9px] md:text-[10px] font-800 text-indigo-400 uppercase tracking-widest mb-1 truncate">
                             {c.lessons.length} Lecciones • {
                                specialties.find(s => s.id === teachers.find(t => t.id === c.teacherId)?.specialtyId)?.name || 'Especialidad'
                             }
                           </div>
                           <h3 className="text-base md:text-xl font-800 tracking-tighter uppercase leading-tight line-clamp-2">{c.title}</h3>
                        </div>
                      </div>
                    ))}
                    {courses.length === 0 && (
                      <div className="col-span-2 h-64 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[40px] text-white/20">
                         <BookOpen className="w-12 h-12 mb-4" />
                         <p className="font-800 uppercase tracking-widest text-[10px]">No hay cursos creados aún_</p>
                      </div>
                    )}
                 </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="specialties">
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className="lg:col-span-1 glass border-white/5">
                 <CardHeader>
                    <CardTitle>{editingSpecialtyId ? "Editar Especialidad" : "Nueva Especialidad"}</CardTitle>
                    <CardDescription>Agrega categorías para clasificar a tus profesores.</CardDescription>
                 </CardHeader>
                 <CardContent className="space-y-4">
                    <div className="space-y-2">
                       <Label>Nombre de la Especialidad</Label>
                       <Input value={newSpecialty} onChange={e => setNewSpecialty(e.target.value)} placeholder="Ej: Programación React" className="rounded-xl border-white/5 bg-white/5" />
                    </div>
                    <div className="flex gap-2">
                       {editingSpecialtyId && (
                         <Button variant="outline" onClick={() => {
                            setEditingSpecialtyId(null);
                            setNewSpecialty("");
                         }} className="flex-1 h-12">Cancelar</Button>
                       )}
                       <Button onClick={addSpecialty} className="flex-[2] bg-indigo-600 rounded-2xl h-12 uppercase text-[10px] font-800 tracking-widest">
                          {editingSpecialtyId ? "Actualizar" : "Agregar Especialidad"}
                       </Button>
                    </div>
                 </CardContent>
              </Card>

              <Card className="lg:col-span-2 glass border-white/5">
                 <CardHeader>
                    <CardTitle>Listado de Especialidades</CardTitle>
                 </CardHeader>
                 <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                       {specialties.map(s => (
                          <div key={s.id} className="p-4 glass rounded-2xl border-white/5 flex justify-between items-center group hover:border-indigo-500/30 transition-all">
                             <span className="font-bold tracking-tight uppercase text-sm">{s.name}</span>
                             <div className="flex gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-white/20 hover:text-white" onClick={() => editSpecialty(s)}>
                                   <Edit className="w-3 h-3" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-white/20 hover:text-red-500 transition-colors" onClick={() => deleteSpecialty(s.id)}>
                                   <Trash2 className="w-3 h-3" />
                                </Button>
                             </div>
                          </div>
                       ))}
                       {specialties.length === 0 && <p className="col-span-3 text-center py-10 opacity-20 font-800 uppercase text-[10px] tracking-[0.3em]">No hay especialidades_</p>}
                    </div>
                 </CardContent>
              </Card>
           </div>
        </TabsContent>

        <TabsContent value="stats" className="w-full">
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="glass border-white/5 p-6 space-y-2">
                <div className="flex justify-between items-center text-white/30 truncate">
                  <span className="text-[10px] font-800 uppercase tracking-widest">Popularidad Avg</span>
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div className="text-3xl font-900 border-l-2 border-indigo-500 pl-3">
                  {(enrollments.length / (courses.length || 1)).toFixed(1)}
                  <span className="text-[10px] font-bold text-white/20 ml-2">alumnos/curso</span>
                </div>
              </Card>
              <Card className="glass border-white/5 p-6 space-y-2">
                <div className="flex justify-between items-center text-white/30">
                  <span className="text-[10px] font-800 uppercase tracking-widest">Feedback Activo</span>
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div className="text-3xl font-900 border-l-2 border-purple-500 pl-3">
                  {comments.length}
                  <span className="text-[10px] font-bold text-white/20 ml-2">comentarios_</span>
                </div>
              </Card>
              <Card className="glass border-white/5 p-6 space-y-2">
                <div className="flex justify-between items-center text-white/30">
                  <span className="text-[10px] font-800 uppercase tracking-widest">Satisfacción</span>
                  <Star className="w-4 h-4" />
                </div>
                <div className="text-3xl font-900 border-l-2 border-yellow-500 pl-3">
                  {(enrollments.filter(e => e.rating).reduce((acc, curr) => acc + (curr.rating || 0), 0) / (enrollments.filter(e => e.rating).length || 1)).toFixed(1)}
                  <span className="text-[10px] font-bold text-white/20 ml-2">avg stars_</span>
                </div>
              </Card>
              <Card className="glass border-white/5 p-6 space-y-2">
                <div className="flex justify-between items-center text-white/30">
                  <span className="text-[10px] font-800 uppercase tracking-widest">Tasa Completación</span>
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="text-3xl font-900 border-l-2 border-green-500 pl-3">
                  {((enrollments.filter(e => e.isFinished).length / (enrollments.length || 1)) * 100).toFixed(0)}%
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="glass border-white/5 p-6">
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="text-lg font-800 tracking-tighter uppercase italic">Popularidad (Enrollments)_</CardTitle>
                  <CardDescription className="text-[10px] uppercase font-bold tracking-widest text-white/40">Cursos con mayor cantidad de estudiantes registrados</CardDescription>
                </CardHeader>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={courses.map(c => ({
                      name: c.title.substring(0, 15) + '...',
                      students: enrollments.filter(e => e.courseId === c.id).length
                    })).sort((a, b) => b.students - a.students)}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                      <XAxis dataKey="name" fontSize={10} tick={{ fill: "#ffffff40" }} />
                      <YAxis fontSize={10} tick={{ fill: "#ffffff40" }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#000', border: '1px solid #ffffff10', borderRadius: '12px' }}
                        itemStyle={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase' }}
                      />
                      <Bar dataKey="students" radius={[4, 4, 0, 0]}>
                        {courses.map((_, index) => (
                           <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="glass border-white/5 p-6 space-y-6">
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="text-lg font-800 tracking-tighter uppercase italic">Distribución de Ratings_</CardTitle>
                </CardHeader>
                <div className="space-y-4">
                  {[5, 4, 3, 2, 1].map(star => {
                    const count = enrollments.filter(e => e.rating === star).length;
                    const percentage = (count / (enrollments.filter(e => e.rating).length || 1)) * 100;
                    return (
                      <div key={star} className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                          <span className="flex items-center gap-1">{star} <Star className="w-2.5 h-2.5 fill-yellow-500 text-yellow-500" /></span>
                          <span className="text-white/40">{count} reviews</span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${percentage}%` }} className="h-full bg-indigo-500" />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="pt-4 border-t border-white/5">
                   <div className="text-[10px] font-800 text-white/30 uppercase tracking-widest mb-4">Top Courses By Rating</div>
                   <div className="space-y-3">
                      {statsData.map((s, i) => (
                        <div key={i} className="flex justify-between items-center text-xs">
                           <span className="font-bold truncate max-w-[200px]">{s.name}</span>
                           <span className="text-indigo-400 font-900 italic">{s.score.toFixed(1)} ★</span>
                        </div>
                      ))}
                   </div>
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="community" className="w-full">
          <Card className="glass border-white/5">
            <CardHeader>
              <CardTitle className="text-2xl font-900 tracking-tighter uppercase italic flex items-center gap-3">
                <MessageSquare className="w-6 h-6 text-indigo-500" />
                Feedback & Reviews_
              </CardTitle>
              <CardDescription className="text-xs uppercase font-bold tracking-widest text-white/40">Visualiza las reseñas finales de los estudiantes al completar sus cursos.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {enrollments.filter(e => e.comment).length === 0 ? (
                  <div className="text-center py-24 border-2 border-dashed border-white/5 rounded-3xl opacity-20">
                    <p className="font-800 uppercase tracking-widest text-sm">No hay reseñas aún_</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/5">
                        <TableHead className="uppercase text-[10px] font-800">Curso</TableHead>
                        <TableHead className="uppercase text-[10px] font-800">Review</TableHead>
                        <TableHead className="uppercase text-[10px] font-800">Rating</TableHead>
                        <TableHead className="uppercase text-[10px] font-800">Fecha</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {enrollments.filter(e => e.comment).map((review) => {
                        const course = courses.find(c => c.id === review.courseId);
                        return (
                          <TableRow key={review.id} className="border-white/5 hover:bg-white/5 transition-colors">
                            <TableCell className="text-xs font-bold text-indigo-400 uppercase tracking-tighter max-w-[200px] truncate">
                              {course?.title || "Curso Eliminado"}
                            </TableCell>
                            <TableCell className="text-xs text-zinc-400 italic max-w-[400px] whitespace-normal leading-relaxed">
                              "{review.comment}"
                            </TableCell>
                            <TableCell>
                               <div className="flex gap-0.5 text-yellow-500">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star key={i} className={`w-3 h-3 ${i < (review.rating || 0) ? 'fill-current' : 'opacity-20'}`} />
                                  ))}
                               </div>
                            </TableCell>
                            <TableCell className="text-[10px] font-bold text-white/20 uppercase whitespace-nowrap">
                              {review.finishedAt ? new Date(review.finishedAt.seconds * 1000).toLocaleDateString() : '--'}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
