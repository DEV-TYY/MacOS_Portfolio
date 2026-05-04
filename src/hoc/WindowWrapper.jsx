import useWindowStore from "#store/window.js";
import { useGSAP } from "@gsap/react";
import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { Draggable } from "gsap/Draggable";


const WindowWrapper = (Component, windowKey) => {
  const Wrapped = (props) => {
    const { focusWindow, windows } = useWindowStore();
    const { isOpen, isMinimized, isFullscreen, zIndex } = windows[windowKey];
    const ref = useRef(null);

    useGSAP(() => {
      const el = ref.current;
      if(!el || !isOpen) return;

      el.style.display = "block";

      gsap.fromTo(
        el,
        { scale: 0.8, opacity: 0, y: 40},
        { scale: 1, opacity: 1, y: 0, duration: 0.2, ease: "power3.out"},
      )

    }, [isOpen]);

    useGSAP(() => {
      const el = ref.current;
      if (!el) return;

      const [instance] = Draggable.create(el, {
        type: "x,y",
        allowEventDefault: true,
        dragClickables: true,
        ignore: "input, textarea, select, button, label",
        onPress: () => focusWindow(windowKey),
      });
      return () => instance.kill();
    }, []);

    useLayoutEffect(() => {
      const el = ref.current;
      if(!el) return;

      if (isOpen && !isMinimized) {
        el.style.display = "block";
        // Restore animation - window appears from dock
        gsap.fromTo(
          el,
          { scale: 0.1, opacity: 0, y: 50 },
          { scale: 1, opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }
        );
      } else {
        el.style.display = "none";
      }
    }, [isOpen, isMinimized]);

    const fullscreenStyle = isFullscreen
      ? {
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          borderRadius: "0",
        }
      : {};

    return (
      <section
        id={windowKey}
        ref={ref}
        style={{ zIndex, ...fullscreenStyle }}
        className={`absolute p-5 ${isFullscreen ? "rounded-none" : "rounded-lg"}`}>
        <Component {...props} />
      </section>
    );
  };

  Wrapped.displayName = `WindowWrapper(${Component.displayName || Component.name || "Component"})`;
  return Wrapped;
  return <div>WindowWrapper</div>;
};

export default WindowWrapper;
