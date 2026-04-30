import { Navbar, Welcome, Dock } from "#components";
import gsap from "gsap";
import { Draggable } from "gsap/Draggable";
import { Terminal } from "#windows";
gsap.registerPlugin(Draggable);

function App() {
   
  return (
   <main>
       <Navbar/>
       <Welcome/>
       <Dock/>

       <Terminal />
   </main>
  )
}

export default App
