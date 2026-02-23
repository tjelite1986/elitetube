import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        yt: {
          bg: "#0f0f0f",
          surface: "#212121",
          surface2: "#282828",
          border: "#3f3f3f",
          red: "#ff0000",
          text: "#f1f1f1",
          muted: "#aaaaaa",
          hover: "#272727",
        },
      },
      fontFamily: {
        sans: ["Roboto", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [require("@tailwindcss/line-clamp")],
};

export default config;
