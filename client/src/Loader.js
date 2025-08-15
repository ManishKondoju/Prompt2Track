// components/Loader.js
import React from "react";
import "./index.css";

const Loader = () => {
  return (
    <div className="flex justify-center items-center">
      <div className="loader-ring">
        <div></div><div></div><div></div><div></div>
      </div>
      <p className="ml-4 text-lg text-blue-400 animate-pulse">Crafting your vibe...</p>
    </div>
  );
};

export default Loader;