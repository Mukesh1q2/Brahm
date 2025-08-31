"use client";
import React, { useEffect, useRef } from 'react';

export default function GravityCurvatureScene({ mass=0.03, center=[0.0,0.0] as [number,number] }: { mass?: number; center?: [number,number] }) {
  const ref = useRef<HTMLCanvasElement|null>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const gl = canvas.getContext('webgl'); if (!gl) return;
    const vsSrc = `attribute vec2 p; void main(){ gl_Position = vec4(p,0.0,1.0);} `;
    const fsSrc = `precision mediump float; uniform float t; uniform vec2 res; uniform float m; uniform vec2 c; 
      void main(){ vec2 uv = (gl_FragCoord.xy/res.xy)-0.5; uv -= c; float r = length(uv); float warp = m/(r*r+0.02); 
      float g = 0.5+0.5*sin(10.0*(uv.x+warp)+t); float b = 0.5+0.5*sin(10.0*(uv.y+warp)-t); gl_FragColor = vec4(0.1+warp*3.0, g*0.6, b*0.6, 1.0);} `;
    function compile(type:number, src:string){ const s=gl.createShader(type)!; gl.shaderSource(s,src); gl.compileShader(s); return s; }
    const prog = gl.createProgram()!; gl.attachShader(prog, compile(gl.VERTEX_SHADER, vsSrc)); gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fsSrc)); gl.linkProgram(prog); gl.useProgram(prog);
    const buf = gl.createBuffer()!; gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
    const uT = gl.getUniformLocation(prog,'t'); const uR = gl.getUniformLocation(prog,'res'); const uM = gl.getUniformLocation(prog,'m'); const uC = gl.getUniformLocation(prog,'c');
    let raf=0; function loop(){ const w=canvas.clientWidth||640,h=canvas.clientHeight||360; gl.viewport(0,0,w,h); gl.uniform2f(uR,w,h); gl.uniform1f(uT, performance.now()/1000); gl.uniform1f(uM, m); gl.uniform2f(uC, center[0], center[1]); gl.drawArrays(gl.TRIANGLES,0,3); raf=requestAnimationFrame(loop);} raf=requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  },[]);
  return <canvas ref={ref} className="w-full h-[360px] rounded-lg border border-white/10" />;
}
