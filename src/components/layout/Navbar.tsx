import { Role, UserProfile } from "../../types";
import { auth } from "../../lib/firebase";
import { signOut } from "firebase/auth";
import { Button } from "../ui/button";
import { LogOut, Sun, Moon, GraduationCap, User, Smartphone, Download, BookOpen } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

interface NavbarProps {
  user: UserProfile;
  onToggleTheme: () => void;
  currentTheme: string;
  onInstall?: () => void;
  isInstallAvailable?: boolean;
}

export function Navbar({ user, onToggleTheme, currentTheme, onInstall, isInstallAvailable }: NavbarProps) {
  return (
    <nav className="border-b border-white/5 glass sticky top-0 z-50">
      <div className="container mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-xl border border-white/20 shadow-glow">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-800 text-2xl tracking-tighter uppercase italic text-indigo-500 leading-none">EduStream_</span>
            <span className="text-[9px] uppercase tracking-[0.3em] opacity-40">Core learning v2.4</span>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-6">
          <div className="hidden lg:flex items-center gap-8 text-[11px] font-bold uppercase tracking-widest text-white/40">
            <span className="text-white">Learning</span>
            <span className="hover:text-white cursor-pointer transition-colors">Courses</span>
            <span className="hover:text-white cursor-pointer transition-colors">Resources</span>
          </div>
          
          {isInstallAvailable && onInstall && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onInstall}
              className="hidden sm:flex border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 gap-2 h-9 px-4 rounded-xl uppercase text-[10px] font-bold tracking-widest transition-all"
            >
              <Download className="w-3 h-3" /> Instalar App
            </Button>
          )}

          <Button variant="ghost" size="icon" onClick={onToggleTheme} className="rounded-full w-9 h-9 md:w-10 md:h-10">
            {currentTheme === "light" ? <Moon className="w-4 h-4 md:w-5 md:h-5" /> : <Sun className="w-4 h-4 md:w-5 md:h-5" />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger className="relative h-9 w-9 md:h-10 md:h-10 rounded-full bg-transparent hover:bg-white/5 transition-colors outline-none cursor-pointer flex items-center justify-center">
              <Avatar className="h-9 w-9 md:h-10 md:h-10 pointer-events-none">
                <AvatarImage src={user.photoURL} alt={user.fullName} />
                <AvatarFallback>{user.fullName.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 glass border-white/10" align="end">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.fullName}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-primary mt-1">
                      {user.role}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="lg:hidden">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Cursos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {}}>
                  <User className="mr-2 h-4 w-4" />
                  Perfil
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut(auth)}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
