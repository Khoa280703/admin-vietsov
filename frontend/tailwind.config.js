/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
        },
        "vietsov-green": {
          DEFAULT: "#006d38",
          50: "#e6f5ec",
          100: "#b3e0c9",
          200: "#80cca6",
          300: "#4db883",
          400: "#1ba360",
          500: "#006d38",
          600: "#00572d",
          700: "#004122",
          800: "#002b17",
          900: "#00150c",
        },
        vietsov: {
          green: "#006d38",
          black: "#242424",
          blue: "#2563eb",
          cyan: "#06b6d4",
          gray: "#6b7280",
          "light-gray": "#919296",
          skin: "#ebf7f0",
          skin2: "#edf8f2",
          "green-bold": "#014f29",
          yellow: "#fad882",
          "green-label": "#10954f",
        },
        pvn: {
          blue: "#364185",
          green: "#009d48",
        },
      },
    },
  },
  plugins: [],
};
