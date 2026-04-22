/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AuthGate } from "./components/auth/AuthGate";
import { useState, useEffect } from "react";
import { UserProfile } from "./types";
import { Navbar } from "./components/layout/Navbar";
import { AdminDashboard } from "./components/admin/AdminDashboard";
import { StudentDashboard } from "./components/student/StudentDashboard";

export default function App() {
  return (
    <AuthGate>
      {(user) => <MainLayout user={user} />}
    </AuthGate>
  );
}

function MainLayout({ user }: { user: UserProfile }) {
  const [theme, setTheme] = useState(user.theme || "light");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  // Handle local theme toggle if needed
  const toggleTheme = () => setTheme(prev => prev === "light" ? "dark" : "light");

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} onToggleTheme={toggleTheme} currentTheme={theme} />
      <main className="container mx-auto py-8 px-4">
        {user.role === "admin" ? (
          <AdminDashboard user={user} />
        ) : (
          <StudentDashboard user={user} />
        )}
      </main>
    </div>
  );
}

