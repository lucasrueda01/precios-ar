import React from "react";

interface LogoProps {
  className?: string;
}

export function Logo({ className = "h-8 sm:h-9 w-auto" }: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 400 120"
      className={className}
      aria-label="precioAR"
    >
      <defs>
        <style>{`
          .logo-text {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
            font-size: 72px;
            letter-spacing: -1.5px;
          }
          .precio {
            font-weight: 500;
            fill: #334155; /* Gris oscuro para dar seriedad */
          }
          :is(.dark *) .precio,
          .dark .precio {
            fill: #f8fafc; /* Adaptación a modo oscuro para alta legibilidad */
          }
          .ar {
            font-weight: 800;
            fill: #0ea5e9; /* Celeste vibrante estilo "Argentina/Tech" */
          }
        `}</style>
      </defs>
      <text x="50%" y="55%" textAnchor="middle" dominantBaseline="middle" className="logo-text">
        <tspan className="precio">precio</tspan><tspan className="ar">AR</tspan>
      </text>
    </svg>
  );
}
