import * as React from "react";

interface MarqueeProps extends React.HTMLAttributes<HTMLDivElement> {
  pauseOnHover?: boolean;
  reverse?: boolean;
}

export const Marquee: React.FC<MarqueeProps> = ({
  children,
  pauseOnHover = false,
  reverse = false,
  className = "",
  ...props
}) => {
  const marqueeRef = React.useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = React.useState(false);

  const handleMouseEnter = () => {
    if (pauseOnHover) setIsPaused(true);
  };
  const handleMouseLeave = () => {
    if (pauseOnHover) setIsPaused(false);
  };

  return (
    <div
      ref={marqueeRef}
      className={`relative w-full overflow-hidden ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      <div
        className={`flex whitespace-nowrap animate-marquee ${reverse ? "animate-marquee-reverse" : ""} ${isPaused ? "paused" : ""}`}
        style={{
          animationDuration: "var(--duration, 20s)",
          animationPlayState: isPaused ? "paused" : "running",
        }}
      >
        {children}
        {children}
      </div>
      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        @keyframes marquee-reverse {
          0% {
            transform: translateX(-50%);
          }
          100% {
            transform: translateX(0);
          }
        }
        .animate-marquee {
          animation: marquee linear infinite;
        }
        .animate-marquee-reverse {
          animation: marquee-reverse linear infinite;
        }
        .paused {
          animation-play-state: paused !important;
        }
      `}</style>
    </div>
  );
};
