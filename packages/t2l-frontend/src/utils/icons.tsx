import React from "react";

export function ArrowRight() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      height="24px"
      viewBox="0 0 24 24"
      width="24px"
      fill="currentColor"
    >
      {/* <path d="M0 0h24v24H0V0z" fill="none" /> */}
      <path d="M5 13h11.17l-4.88 4.88c-.39.39-.39 1.03 0 1.42.39.39 1.02.39 1.41 0l6.59-6.59c.39-.39.39-1.02 0-1.41l-6.58-6.6c-.39-.39-1.02-.39-1.41 0-.39.39-.39 1.02 0 1.41L16.17 11H5c-.55 0-1 .45-1 1s.45 1 1 1z" />
    </svg>
  );
}

export function Warning(props: React.SVGAttributes<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      height="18px"
      viewBox="0 0 24 24"
      width="18px"
      fill="currentColor"
      {...props}
    >
      <path d="M4.47 21h15.06c1.54 0 2.5-1.67 1.73-3L13.73 4.99c-.77-1.33-2.69-1.33-3.46 0L2.74 18c-.77 1.33.19 3 1.73 3zM12 14c-.55 0-1-.45-1-1v-2c0-.55.45-1 1-1s1 .45 1 1v2c0 .55-.45 1-1 1zm1 4h-2v-2h2v2z" />
    </svg>
  );
}

export function Error() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      height="18px"
      viewBox="0 0 24 24"
      width="18px"
      fill="currentColor"
    >
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 11c-.55 0-1-.45-1-1V8c0-.55.45-1 1-1s1 .45 1 1v4c0 .55-.45 1-1 1zm1 4h-2v-2h2v2z" />
    </svg>
  );
}

export function ArrowLeft(props: React.SVGAttributes<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      height="20px"
      viewBox="0 0 24 24"
      width="20px"
      fill="currentColor"
      {...props}
    >
      <path d="M0 0h24v24H0V0z" fill="none" />
      <path d="M19 11H7.83l4.88-4.88c.39-.39.39-1.03 0-1.42-.39-.39-1.02-.39-1.41 0l-6.59 6.59c-.39.39-.39 1.02 0 1.41l6.59 6.59c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41L7.83 13H19c.55 0 1-.45 1-1s-.45-1-1-1z" />
    </svg>
  );
}

export function Check(props: React.SVGAttributes<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      height="18px"
      viewBox="0 0 24 24"
      width="18px"
      fill="currentColor"
      {...props}
    >
      <path d="M0 0h24v24H0V0z" fill="none" />
      <path d="M9 16.17L5.53 12.7c-.39-.39-1.02-.39-1.41 0-.39.39-.39 1.02 0 1.41l4.18 4.18c.39.39 1.02.39 1.41 0L20.29 7.71c.39-.39.39-1.02 0-1.41-.39-.39-1.02-.39-1.41 0L9 16.17z" />
    </svg>
  );
}

export function Spinner(props: React.SVGAttributes<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      height="24px"
      viewBox="0 0 24 24"
      width="24px"
      fill="none"
      {...props}
    >
      <circle cx="12" cy="12" r="10" stroke="#E4E6E6" stroke-width="2" />
      <path
        d="M3.95077 17.9338C2.68566 16.2177 2.00215 14.1421 2.00001 12.0101C1.99786 9.87801 2.67719 7.80108 3.93885 6.0824C5.20052 4.36373 6.97846 3.09328 9.01318 2.45647C11.0479 1.81967 13.2329 1.84985 15.2493 2.54261"
        stroke="currentColor"
        stroke-width="2"
      />
    </svg>
  );
}
