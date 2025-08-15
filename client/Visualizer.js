import React, { useEffect, useRef } from "react";

const Visualizer = ({ audioUrl }) => {
  const canvasRef = useRef(null);
  const audioRef = useRef(null);
  const audioContextRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const analyserRef = useRef(null);
  const animationIdRef = useRef(null);

  useEffect(() => {
    if (!audioUrl) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // Reset previous audio context and source
    if (audioContextRef.current) {
      audioContextRef.current.close();
      cancelAnimationFrame(animationIdRef.current);
    }

    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    audioContextRef.current = audioContext;

    const source = audioContext.createMediaElementSource(audio);
    sourceNodeRef.current = source;

    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    analyser.connect(audioContext.destination);
    analyserRef.current = analyser;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = dataArray[i];
        ctx.fillStyle = "rgba(0, 200, 255, 0.7)";
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }

      animationIdRef.current = requestAnimationFrame(draw);
    };

    draw();
    audio.play();

    return () => {
      audio.pause();
      audio.src = "";
      cancelAnimationFrame(animationIdRef.current);
      if (audioContext) audioContext.close();
    };
  }, [audioUrl]);

  return (
    <div className="w-full">
      <canvas ref={canvasRef} width="600" height="200" className="w-full h-48" />
    </div>
  );
};

export default Visualizer;
