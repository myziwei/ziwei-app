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
        ziwei: {
          50: "#faf6f1",
          100: "#f3ebe0",
          200: "#e6d5bc",
          300: "#d4b894",
          400: "#c49a6c",
          500: "#b8834f",
          600: "#a66d3f",
          700: "#8a5636",
          800: "#714730",
          900: "#5c3c2a",
        },
        ink: {
          50: "#f7f6f5",
          100: "#eceae8",
          200: "#d9d5d1",
          300: "#bdb6b0",
          400: "#9c928a",
          500: "#80766e",
          600: "#6a615a",
          700: "#574f4a",
          800: "#473f3a",
          900: "#3e3733",
        },
      },
    },
  },
  plugins: [],
};
export default config;
