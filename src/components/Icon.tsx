const paths = {
  home: "m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z",
  orders: "M8 4H5v17h14V4h-3M8 3h8v4H8ZM8 12h8M8 16h5",
  tag: "M3 3h8l10 10-8 8L3 11ZM7 7h.01",
  user: "M20 21v-2a7 7 0 0 0-14 0v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
  cart: "M2 3h3l3 12h10l3-9H6M9 20h.01M18 20h.01",
  pin: "M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0ZM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4",
  arrow: "M5 12h14m-6-6 6 6-6 6",
  back: "M19 12H5m6-6-6 6 6 6",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  check: "m5 12 4 4L19 6",
  gas: "M9 3h6v4H9ZM8 7h8a3 3 0 0 1 3 3v9a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-9a3 3 0 0 1 3-3ZM5 12h14M8 21v1m8-1v1",
  water: "M12 2S4 11 4 15a8 8 0 0 0 16 0c0-4-8-13-8-13ZM8 15c0 3 2 4 4 4",
  truck:
    "M1 4h13v13H1ZM14 8h5l4 5v4h-9M6 20a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm13 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  chart: "M3 3v18h18M7 16v-4m5 4V7m5 9v-6",
  clock: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm0-16v6l4 2",
  logout: "M9 3H3v18h6M9 12h12m-5-5 5 5-5 5",
  edit: "m16 3 5 5-12 12-6 1 1-6ZM14 5l5 5",
  trash: "M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7",
  shield: "m12 2 9 4v6c0 6-9 10-9 10S3 18 3 12V6Zm-5 9 3 3 7-7",
  search: "M21 21l-5-5M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z",
  close: "m6 6 12 12M6 18 18 6",
  refresh: "M20 7a9 9 0 1 0 1 9M20 2v6h-6",
} as const;
export type IconName = keyof typeof paths;
export default function Icon({
  name,
  size = 20,
}: {
  name: IconName;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}
