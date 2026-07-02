import localFont from "next/font/local";

/** Display — Syne (geometric, premium, full Turkish support). */
export const fontDisplay = localFont({
  src: "./fonts/Syne-Variable.ttf",
  variable: "--font-display",
  weight: "400 800",
  display: "swap",
});

/** Body — Outfit (clean variable sans, full Turkish support). */
export const fontBody = localFont({
  src: "./fonts/Outfit-Variable.ttf",
  variable: "--font-body",
  weight: "100 900",
  display: "swap",
});

/** Accent — Instrument Serif (italic editorial flourishes). */
export const fontSerif = localFont({
  src: "./fonts/InstrumentSerif-Regular.ttf",
  variable: "--font-serif",
  weight: "400",
  display: "swap",
});
