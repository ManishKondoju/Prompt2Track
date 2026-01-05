import React from "react";
import Lottie from "lottie-react";

import heroAurora from "./lottie/hero-aurora.json";
import btnSpark from "./lottie/btn-spark.json";
import loadingVinyl from "./lottie/loading-vinyl.json";
import successConfetti from "./lottie/success-confetti.json";
//import emptyTurntable from "./lottie/empty-turntable.json";
import wavyOrb from "./lottie/wavy-orb.json";


const map = {
  hero: heroAurora,
  spark: btnSpark,
  loading: loadingVinyl,
  success: successConfetti,
  empty: loadingVinyl,
};

export default function LottieFx({
  name = "hero",
  className = "",
  loop = true,
  autoplay = true,
  style,
}) {
  const animationData = map[name] || heroAurora;

  return (
    <div className={className} style={style}>
      <Lottie animationData={animationData} loop={loop} autoplay={autoplay} />
    </div>
  );
}
