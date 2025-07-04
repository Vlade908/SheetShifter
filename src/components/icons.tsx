import type { SVGProps } from 'react';

export const AppLogo = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12 3v12" />
    <path d="M18.37 7.63 7.07 18.93" />
    <path d="m5.63 7.63 11.31 11.31" />
    <path d="M19.41 12H4.59" />
    <circle cx="12" cy="12" r="10" />
  </svg>
);
