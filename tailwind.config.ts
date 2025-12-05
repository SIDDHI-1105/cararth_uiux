import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";
import tailwindcssTypography from "@tailwindcss/typography";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      // Spinny Design System (Dec 2025) - Spacing & Typography
      spacing:{
        4: '0.4rem', 8: '0.8rem', 12:'1.2rem', 16:'1.6rem',
        20:'2rem', 24:'2.4rem', 32:'3.2rem', 40:'4rem', 48:'4.8rem'
      },
      fontSize:{
        xs:['1.2rem',{lineHeight:'1.4',letterSpacing:'0.03em'}],
        sm:['1.3rem',{lineHeight:'1.45',letterSpacing:'0.02em'}],
        base:['1.6rem',{lineHeight:'1.5'}],
        lg:['1.8rem',{lineHeight:'1.45'}],
        xl:['2rem', {lineHeight:'1.4',letterSpacing:'-0.01em'}],
        '2xl':['2.4rem',{lineHeight:'1.3',letterSpacing:'-0.01em'}],
        '3xl':['3rem', {lineHeight:'1.2',letterSpacing:'-0.02em'}],
        '4xl':['3.6rem',{lineHeight:'1.1',letterSpacing:'-0.02em'}]
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        chart: {
          "1": "var(--chart-1)",
          "2": "var(--chart-2)",
          "3": "var(--chart-3)",
          "4": "var(--chart-4)",
          "5": "var(--chart-5)",
        },
        "carbon-primary": "var(--carbon-primary)",
        "carbon-secondary": "var(--carbon-secondary)",
        "steel-primary": "var(--steel-primary)",
        "steel-secondary": "var(--steel-secondary)",
        "metallic-accent": "var(--metallic-accent)",
        sidebar: {
          DEFAULT: "var(--sidebar-background)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["SF Mono", "Monaco", "Cascadia Code", "Roboto Mono", "monospace"],
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [tailwindcssAnimate, tailwindcssTypography],
} satisfies Config;
