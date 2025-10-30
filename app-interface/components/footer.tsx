"use client";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUp } from "lucide-react";
import Image from "next/image";
interface LinkItem {
  href: string;
  label: string;
}

interface FooterProps {
  leftLinks: LinkItem[];
  rightLinks: LinkItem[];
  copyrightText: string;
  barCount?: number;
}

export const Footer: React.FC<FooterProps> = ({
  leftLinks,
  rightLinks,
  copyrightText,
}) => {
  const waveRefs = useRef<(HTMLDivElement | null)[]>([]);
  const footerRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.2 },
    );

    const currentFooterRef = footerRef.current;
    if (currentFooterRef) {
      observer.observe(currentFooterRef);
    }

    return () => {
      if (currentFooterRef) {
        observer.unobserve(currentFooterRef);
      }
    };
  }, []);

  useEffect(() => {
    let t = 0;

    const animateWave = () => {
      const waveElements = waveRefs.current;
      let offset = 0;

      waveElements.forEach((element, index) => {
        if (element) {
          offset += Math.max(0, 20 * Math.sin((t + index) * 0.3));
          element.style.transform = `translateY(${index + offset}px)`;
        }
      });

      t += 0.1;
      animationFrameRef.current = requestAnimationFrame(animateWave);
    };

    if (isVisible) {
      animateWave();
    } else if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isVisible]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer
      ref={footerRef}
      className="bg-[#2A423D] text-white relative flex flex-col w-full h-full justify-between select-none"
    >
      <div className="container mx-auto flex flex-col md:flex-row justify-between w-full gap-8 py-16 px-6 lg:px-12">
        <div className="space-y-6">
          <div className="flex items-center space-x-3 mb-6">
            <Image
              src="/SpoutWhite.png"
              alt="spout finance logo"
              width={120}
              height={120}
            />
          </div>

          <ul className="flex flex-wrap gap-6">
            {leftLinks.map((link, index) => (
              <li key={index}>
                <Link
                  href={link.href}
                  className="text-slate-300 hover:text-emerald-400 transition-colors duration-300 font-medium"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="pt-6">
            <p className="text-sm text-slate-400 flex items-center gap-2">
              <svg className="size-4" viewBox="0 0 80 80">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  fill="currentColor"
                  d="M67.4307 11.5693C52.005 -3.85643 26.995 -3.85643 11.5693 11.5693C-3.85643 26.995 -3.85643 52.005 11.5693 67.4307C26.995 82.8564 52.005 82.8564 67.4307 67.4307C82.8564 52.005 82.8564 26.995 67.4307 11.5693ZM17.9332 17.9332C29.8442 6.02225 49.1558 6.02225 61.0668 17.9332C72.9777 29.8442 72.9777 49.1558 61.0668 61.0668C59.7316 62.4019 58.3035 63.5874 56.8032 64.6232L56.8241 64.6023C46.8657 54.6439 46.8657 38.4982 56.8241 28.5398L58.2383 27.1256L51.8744 20.7617L50.4602 22.1759C40.5018 32.1343 24.3561 32.1343 14.3977 22.1759L14.3768 22.1968C15.4126 20.6965 16.5981 19.2684 17.9332 17.9332ZM34.0282 38.6078C25.6372 38.9948 17.1318 36.3344 10.3131 30.6265C7.56889 39.6809 9.12599 49.76 14.9844 57.6517L34.0282 38.6078ZM21.3483 64.0156C29.24 69.874 39.3191 71.4311 48.3735 68.6869C42.6656 61.8682 40.0052 53.3628 40.3922 44.9718L21.3483 64.0156Z"
                />
              </svg>
              {copyrightText}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-8">
            <div>
              <h4 className="font-semibold text-white mb-4 text-lg">
                Platform
              </h4>
              <ul className="space-y-3">
                {rightLinks.map((link, index) => (
                  <li key={index}>
                    <Link
                      href={link.href}
                      className="text-slate-300 hover:text-emerald-400 transition-colors duration-300"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Socials Section */}
          <div className="pt-6 border-t border-slate-700">
            <div className="flex items-center justify-end">
              <button
                onClick={scrollToTop}
                className="flex items-center gap-2 text-sm text-slate-300 hover:text-emerald-400 transition-colors duration-300 group"
                style={{ alignSelf: "flex-start" }}
              >
                <span>Back to top</span>
                <ArrowUp className="h-4 w-4 group-hover:-translate-y-1 transition-transform duration-300" />
              </button>
            </div>
            {/* Socials Section */}
            <div className="flex gap-4 mt-8" style={{ marginLeft: 0 }}>
              {/* Telegram */}
              <a
                href="https://t.me/+f1rc4o4A3Yw0MmMx"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Telegram"
                className="text-slate-300 hover:text-emerald-400 transition-colors duration-300"
              >
                <svg
                  width="22"
                  height="22"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                </svg>
              </a>
              {/* Twitter */}
              <a
                href="https://x.com/0xspout"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter"
                className="text-slate-300 hover:text-emerald-400 transition-colors duration-300"
              >
                <svg
                  width="22"
                  height="22"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M22.46 5.924c-.793.352-1.646.59-2.542.698a4.48 4.48 0 0 0 1.965-2.475 8.94 8.94 0 0 1-2.828 1.082 4.48 4.48 0 0 0-7.635 4.086A12.72 12.72 0 0 1 3.112 4.89a4.48 4.48 0 0 0 1.388 5.976 4.44 4.44 0 0 1-2.03-.561v.057a4.48 4.48 0 0 0 3.594 4.393 4.48 4.48 0 0 1-2.025.077 4.48 4.48 0 0 0 4.184 3.112A8.98 8.98 0 0 1 2 19.54a12.67 12.67 0 0 0 6.88 2.017c8.26 0 12.78-6.84 12.78-12.78 0-.195-.004-.39-.013-.583A9.14 9.14 0 0 0 24 4.59a8.93 8.93 0 0 1-2.54.697z" />
                </svg>
              </a>
              {/* LinkedIn */}
              <a
                href="https://www.linkedin.com/company/spoutfinance/posts/?feedView=all" // TODO: Replace with actual company page
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="text-slate-300 hover:text-emerald-400 transition-colors duration-300"
              >
                <svg
                  width="22"
                  height="22"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M19 0h-14c-2.76 0-5 2.24-5 5v14c0 2.76 2.24 5 5 5h14c2.76 0 5-2.24 5-5v-14c0-2.76-2.24-5-5-5zm-11 19h-3v-9h3v9zm-1.5-10.28c-.966 0-1.75-.784-1.75-1.75s.784-1.75 1.75-1.75 1.75.784 1.75 1.75-.784 1.75-1.75 1.75zm15.5 10.28h-3v-4.5c0-1.07-.02-2.44-1.49-2.44-1.49 0-1.72 1.16-1.72 2.36v4.58h-3v-9h2.89v1.23h.04c.4-.76 1.38-1.56 2.84-1.56 3.04 0 3.6 2 3.6 4.59v4.74z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

// Default footer component with Spout Finance links
const DefaultFooter = () => {
  const leftLinks = [
    // { href: "/app/markets", label: "Markets" }, // Not ready yet
    { href: "/app/portfolio", label: "Portfolio" },
    { href: "/app/trade", label: "Trading" },
    // { href: "/app/earn", label: "Earn" },
  ];

  const rightLinks = [
    { href: "/company", label: "Company" },
    {
      href: "https://drive.google.com/file/d/1fklbqmZhgxzIzXN0aEjsf2NFat2QdpFp/view",
      label: "Whitepaper",
    },
    // { href: "/company", label: "Company" }, // Removed company link
    // { href: "/help", label: "Help Center" },
    // { href: "/privacy", label: "Privacy Policy" },
    // { href: "/terms", label: "Terms of Service" },
    // { href: "/careers", label: "Careers" },
    // { href: "/blog", label: "Blog" },
    // { href: "/security", label: "Security" },
  ];

  return (
    <Footer
      leftLinks={leftLinks}
      rightLinks={rightLinks}
      copyrightText={`© ${new Date().getFullYear()} Spout Finance. All rights reserved.`}
      barCount={25}
    />
  );
};

export default DefaultFooter;
