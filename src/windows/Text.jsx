import { WindowControls } from "#components/index.js";
import WindowWrapper from "#hoc/WindowWrapper.jsx";
import useWindowStore from "#store/window.js";

const Text = () => {
  const { windows } = useWindowStore();
  const data = windows.txtfile?.data;
  if (!data) return null;

const { name, image, subtitle, description } = data;

  return (
    <>
      <div id="window-header">
        <WindowControls target="txtfile" />
        <h2>{name}</h2>
      </div>

      <div className="space-y-6 bg-white">
        <div className="w-full">
          {image && (
            <img src={image} alt={name} className="txtfile-image" />
          )}
        </div>

        {subtitle ? <h3 className="text-lg font-semibold">{subtitle}</h3> : null}

        {Array.isArray(description) ? (
        <div className="space-y-3 leading-relaxed text-base text-gray-800">
            {description.map((desc, index) => (
            <p key={index}>{desc}</p>
            ))}
        </div>
        ) : null}
      </div>
    </>
  );
};

const TextFileWindow = WindowWrapper(Text, "txtfile");

export default TextFileWindow;
