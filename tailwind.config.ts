import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#18201c",
        moss: "#415f45",
        clay: "#a8663f",
        sand: "#f1e6d0",
        storm: "#385065",
        ember: "#d35f36"
      },
      boxShadow: {
        panel: "0 18px 45px rgba(24, 32, 28, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
