import { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import { collection, addDoc, onSnapshot, serverTimestamp, query, orderBy, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { UserProfile, Teacher, Course, Enrollment, Specialty, Lesson } from "../../types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Users, BookOpen, BarChart3, Plus, Trash2, LayoutDashboard, Settings, Edit, ArrowUp, ArrowDown, ExternalLink } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

import { CoursePlayer } from "../student/CoursePlayer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Upload, Eye } from "lucide-react";

export function AdminDashboard({ user }: { user: UserProfile }) {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
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

    return () => {
      unsubTeachers();
      unsubCourses();
      unsubEnrollments();
      unsubSpecialties();
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
          <TabsTrigger value="specialties" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-lg px-6 py-2 transition-all uppercase text-[10px] font-bold tracking-widest flex gap-2">
            <Settings className="w-3 h-3" /> Especialidades
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
                                    fetchData();
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
                  <Input value={newCourse.title} onChange={e => setNewCourse({...newCourse, title: e.target.value})} />
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
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {courses.map(c => (
                      <div key={c.id} className="group relative glass rounded-[32px] overflow-hidden border-white/5 hover:border-white/20 transition-all hover:translate-y-[-4px]">
                        <div className="h-40 bg-zinc-900 relative">
                           {c.bannerUrl && <img src={c.bannerUrl} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" referrerPolicy="no-referrer" />}
                           <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                           <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                              <Button variant="secondary" size="icon" className="h-8 w-8 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white" onClick={() => editCourse(c)}><Edit className="w-4 h-4 text-black" /></Button>
                              <Button variant="destructive" size="icon" className="h-8 w-8 rounded-lg" onClick={() => deleteCourse(c.id)}><Trash2 className="w-4 h-4" /></Button>
                           </div>
                        </div>
                        <div className="p-6">
                           <div className="text-[10px] font-800 text-indigo-400 uppercase tracking-widest mb-1">
                             {c.lessons.length} Lecciones • {teachers.find(t => t.id === c.teacherId)?.name}
                           </div>
                           <h3 className="text-xl font-800 tracking-tighter uppercase leading-tight line-clamp-2">{c.title}</h3>
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
