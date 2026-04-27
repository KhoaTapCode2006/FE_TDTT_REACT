export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#00346f",
        "primary-container": "#004a99",
        "primary-fixed": "#d7e2ff",
        "on-primary": "#ffffff",
        secondary: "#775a19",
        "secondary-container": "#fed488",
        "on-secondary-container": "#785a1a",
        tertiary: "#003b4e",
        "tertiary-container": "#00536c",
        background: "#f7f9fc",
        surface: "#f7f9fc",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f2f4f7",
        "surface-container": "#eceef1",
        "surface-container-high": "#e6e8eb",
        "surface-container-highest": "#e0e3e6",
        "on-surface": "#191c1e",
        "on-surface-variant": "#424751",
        outline: "#737783",
        "outline-variant": "#c2c6d3",
        "surface-tint": "#255dad",
      },
      fontFamily: {
        headline: ["Manrope", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
      boxShadow: {
        editorial: "0px 12px 32px rgba(0,52,111,0.08)",
        card: "0px 4px 16px rgba(0,52,111,0.06)",
      },
    },
  },
  plugins: [],
}