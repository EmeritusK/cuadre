import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

const token = (name: string) => `hsl(var(--${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        night: {
          DEFAULT: token("night"),
          raised: token("night-raised"),
          fg: token("night-fg"),
          muted: token("night-muted"),
        },
        ground: token("ground"),
        panel: { DEFAULT: token("panel"), sunken: token("panel-sunken") },
        ink: { DEFAULT: token("ink"), muted: token("ink-muted") },
        rule: { DEFAULT: token("rule"), strong: token("rule-strong") },
        scarlet: token("scarlet"),
        cobalt: token("cobalt"),
        link: token("link"),
        amber: token("amber"),
        green: token("green"),
        short: token("short"),
        over: token("over"),
        matched: token("matched"),
        pending: token("pending"),
      },
      borderRadius: {
        DEFAULT: "var(--radius)",
        sm: "2px",
        md: "var(--radius)",
        lg: "6px",
      },
      fontFamily: {
        sans: ["var(--font-sans)", ...fontFamily.sans],
      },
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1rem", letterSpacing: "0.06em" }],
      },
      keyframes: {
        "station-pulse": {
          "0%": { transform: "scale(1)", opacity: "0.7" },
          "100%": { transform: "scale(2.4)", opacity: "0" },
        },
        "sheet-in": {
          from: { transform: "translateX(24px)", opacity: "0" },
          to: { transform: "translateX(0)", opacity: "1" },
        },
      },
      animation: {
        "station-pulse": "station-pulse 900ms cubic-bezier(0.16, 1, 0.3, 1) 1",
        "sheet-in": "sheet-in 200ms cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
