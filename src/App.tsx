import { Terminal, Safari, Resume, Finder, Text } from "#windows";
import { Navbar, Welcome, Dock } from "#components";
import { Draggable } from "gsap/Draggable";



import gsap from "gsap";

gsap.registerPlugin(Draggable);

function App() {
   
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
   </main>
  )
}

export default App
