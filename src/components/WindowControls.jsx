import useWindowStore from "#store/window"
import { gsap } from "gsap";

const WindowControls = ({ target }) => {
  const { closeWindow, minimizeWindow, toggleFullscreen } = useWindowStore();

  const handleMinimize = () => {
    const windowElement = document.getElementById(target);
    if (!windowElement) return;

    // Get the dock position (bottom center of screen)
    const dockY = window.innerHeight - 80; // Assuming dock is 80px high
    const dockX = window.innerWidth / 2;

    // Get current window position
    const rect = windowElement.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Create minimize animation
    gsap.to(windowElement, {
      scale: 0.1,
      x: dockX - centerX,
      y: dockY - centerY,
      opacity: 0,
      duration: 0.3,
      ease: "power2.in",
      onComplete: () => {
        minimizeWindow(target);
        // Reset transform after animation
        gsap.set(windowElement, { scale: 1, x: 0, y: 0, opacity: 1 });
      }
    });
  };

  return (
    <div id="window-controls">
      <div className="close" onClick={() => closeWindow(target)} />
      <div className="minimize" onClick={handleMinimize} />
      <div className="maximize" onClick={() => toggleFullscreen(target)} />
    </div>
  )
}

export default WindowControls;
