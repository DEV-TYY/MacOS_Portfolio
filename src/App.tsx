import { useEffect, useState } from "react";
import { Terminal, Safari, Resume, Finder, Text, Image, Contact, Photos, Music, Video, Dashboard } from "./windows";
import { Navbar, Welcome, Dock, Home } from "./components";
import DashboardLogin from "./components/DashboardLogin.jsx";
import { Draggable } from "gsap/Draggable";
import gsap from "gsap";
import useWindowStore from "./store/window.js";

gsap.registerPlugin(Draggable);

function App() {
  const { openWindow, closeWindow } = useWindowStore();
  const [authToken, setAuthToken] = useState<string | null>(() =>
    sessionStorage.getItem("dashboardToken")
  );
  const [pathname] = useState<string>(() =>
    window.location.pathname.replace(/\/+/g, "/")
  );
  const showDashboardLogin = pathname === "/dashboard" && !authToken;

  useEffect(() => {
    if (pathname !== "/dashboard") return;

    if (authToken) {
      openWindow("dashboard");
    } else {
      closeWindow("dashboard");
    }
  }, [authToken, closeWindow, openWindow, pathname]);

  const handleDashboardLogin = async (
    username: string,
    password: string
  ): Promise<boolean> => {
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) return false;

      const data = await response.json();
      if (data.success && data.token) {
        sessionStorage.setItem("dashboardToken", data.token);
        setAuthToken(data.token);
        openWindow("dashboard");
        return true;
      }
    } catch (error) {
      console.error("Dashboard login failed:", error);
    }

    return false;
  };

  return (
   <main>
      <Navbar/>
      <Welcome/>
      <Dock/>
      <Terminal/>
      <Safari/>
      <Resume/>
      <Finder/>
      <Text/>
      <Image/>
      <Contact/>
      <Music/>
      <Video/>
      <Dashboard/>
      <Home/>
      <Photos/>
      {showDashboardLogin && <DashboardLogin onLogin={handleDashboardLogin} />}
   </main>
  )
}

export default App
