interface OngilLogoProps {
  size?: 'sm' | 'md';
}

export function OngilLogo({ size = 'md' }: OngilLogoProps) {
  const dimension = size === 'sm' ? 'h-6 w-6' : 'h-8 w-8';

  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${dimension} shrink-0`}
      aria-hidden="true"
    >
      {/* Rounded organic arch container in warm sage-teal */}
      <rect x="2" y="2" width="36" height="36" rx="11" fill="#2D7A6E" />
      <rect
        x="2.5"
        y="2.5"
        width="35"
        height="35"
        rx="10.5"
        stroke="#1F5B51"
        strokeOpacity="0.25"
      />

      {/* Warm buttercream rising sun & gentle compass glint */}
      <circle cx="24.5" cy="13.5" r="5" fill="#F8DCA0" />
      <path
        d="M24.5 5.5V7.3M32.5 13.5H30.7M30.1 7.9L28.8 9.2M18.9 7.9L20.2 9.2"
        stroke="#F8DCA0"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Soft pastel apricot distant hill */}
      <path
        d="M2 27.5C8.5 22.5 15.5 22.8 22.5 26.2C27.5 28.6 33 27.8 38 24.5V27C38 33.075 33.075 38 27 38H13C6.925 38 2 33.075 2 27V27.5Z"
        fill="#E79B78"
      />

      {/* Soft sage-mint foreground hill */}
      <path
        d="M2 31C9.5 27.5 18 28.5 25.5 31.5C30.8 33.6 34.8 33.2 38 31.2V27C38 33.075 33.075 38 27 38H13C6.925 38 2 33.075 2 27V31Z"
        fill="#489688"
      />

      {/* Winding warm ivory path leading toward the sunrise */}
      <path
        d="M15.2 38C16.2 33.2 21.8 31.4 22.8 28.1C23.5 25.8 20.5 24.3 21.8 22.2C22.4 21.2 23.8 20.7 24.4 20.5C24.4 20.5 23.6 22.2 24.6 23.6C25.9 25.5 28.6 26.9 27.4 29.8C26.1 32.9 21.6 34.4 21.8 38H15.2Z"
        fill="#FAF8F5"
      />
    </svg>
  );
}
