/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "#09090b", // Zinc 950
                surface: "rgba(24, 24, 27, 0.6)", // Zinc 900 + opacity
                primary: "#bef264", // Lime 400 (Volt)
                secondary: "#3b82f6", // Blue 500
                text: {
                    primary: "#ffffff",
                    muted: "#a1a1aa", // Zinc 400
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                heading: ['Outfit', 'sans-serif'],
                mono: ['Chakra Petch', 'monospace'],
            },
            backgroundImage: {
                'glass-gradient': 'linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)',
            }
        },
    },
    plugins: [],
}
