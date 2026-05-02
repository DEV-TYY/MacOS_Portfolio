import { WindowControls } from "#components/index.js";
import WindowWrapper from "#hoc/WindowWrapper.jsx";
import useWindowStore from "#store/window.js";

const Image = () => {
  const { windows } = useWindowStore();
  const data = windows.imgfile?.data;
  if (!data) return null;

  const { name, imageUrl } = data;

  return (
    <>
      <div id="window-header">
        <WindowControls target="imgfile" />
        <h2>{name}</h2>
      </div>

      <div className="space-y-6 bg-white">
        <div className="w-full h-full flex items-center justify-center">
          {imageUrl && (
            <img src={imageUrl} alt={name} className="max-w-full max-h-full object-contain" />
          )}
        </div>
      </div>
    </>
  );
};

const ImageFileWindow = WindowWrapper(Image, "imgfile");

export default ImageFileWindow;
