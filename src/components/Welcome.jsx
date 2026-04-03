import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

//  register plugin
gsap.registerPlugin(useGSAP);

const FONT_WEIGHTS = {
  subtitle: { min: 100, max: 400, default: 100 },
  title: { min: 400, max: 900, default: 400 }
};

//  split text into spans
const renderText = (text, className, baseWeight = 400) => {
  return [...text].map((char, i) => (
    <span
      key={i}
      className={`${className} letter`}
      style={{
        fontVariationSettings: `'wght' ${baseWeight}`
      }}
    >
      {char === " " ? "\u00A0" : char}
    </span>
  ));
};

// ✅ hover animation setup
const setupTextHover = (container, type) => {
  if (!container) return;

  const letters = container.querySelectorAll(".letter");
  const { min, max, default: base } = FONT_WEIGHTS[type];

  const animateLetter = (letter, weight, duration = 0.25) => {
    return gsap.to(letter, {
      duration,
      ease: "power2.out",
      fontVariationSettings: `'wght' ${weight}`
    });
  };

  const handleMouseMove = (e) => {
    const { left } = container.getBoundingClientRect();
    const mouseX = e.clientX - left;

    letters.forEach((letter) => {
      const { left: l, width: w } = letter.getBoundingClientRect();
      const center = l - left + w / 2;
      const distance = Math.abs(mouseX - center);

      const intensity = Math.exp(-(distance ** 2) / 20000);

      const weight = min + (max - min) * intensity;
      animateLetter(letter, weight);
    });
  };

  const handleMouseLeave = () => {
    letters.forEach((letter) => {
      animateLetter(letter, base, 0.3);
    });
  };

  container.addEventListener("mousemove", handleMouseMove);
  container.addEventListener("mouseleave", handleMouseLeave);

  // ✅ cleanup (important)
  return () => {
    container.removeEventListener("mousemove", handleMouseMove);
    container.removeEventListener("mouseleave", handleMouseLeave);
  };
};

// ✅ main component
const Welcome = () => {
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);

  useGSAP(() => {
    const cleanupTitle = setupTextHover(titleRef.current, "title");
    const cleanupSubtitle = setupTextHover(subtitleRef.current, "subtitle");

    return () => {
      cleanupTitle && cleanupTitle();
      cleanupSubtitle && cleanupSubtitle();
    };
  }, []);

  return (
    <section id="welcome" className="p-10">
      <p ref={subtitleRef}>
        {renderText(
          "Hey, I'm Suon Ty! Welcome to my",
          "text-3xl font-georama",
          100
        )}
      </p>

      <h1 ref={titleRef} className="mt-7">
        {renderText(
          "portfolio",
          "text-9xl italic font-georama",
          400
        )}
      </h1>
    </section>
  );
};

export default Welcome;