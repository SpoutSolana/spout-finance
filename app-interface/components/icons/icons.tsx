import React from "react";
import colorPattern from "@/style/colorpattern.json";

const UserProfile = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="lucide lucide-circle-user-round-icon lucide-circle-user-round"
    {...props}
  >
    <path d="M18 20a6 6 0 0 0-12 0" />
    <circle cx="12" cy="10" r="4" />
    <circle cx="12" cy="12" r="10" />
  </svg>
);

const DollarSign = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="24"
    viewBox="0 0 18 18"
    {...props}
  >
    <path
      fill={colorPattern.colors.primary}
      fillRule="evenodd"
      d="M6 11c-2.66 0-4-1.629-4-3.5C2 5.691 3.271 4 6 4v7zm6 5.5c0 1.809-1.27 3.5-4 3.5v-7c2.661 0 4 1.629 4 3.5zm2 0c0-2.768-2.025-5.5-6-5.5V4h2a2 2 0 0 1 2 2h2a4 4 0 0 0-4-4H8V0H6v2C2.042 2 0 4.722 0 7.5 0 10.268 2.025 13 6 13v7H4a2 2 0 0 1-2-2H0a4 4 0 0 0 4 4h2v2h2v-2c3.958 0 6-2.722 6-5.5z"
    />
  </svg>
);

export const Icons = {
  UserProfile,
  DollarSign,
};
