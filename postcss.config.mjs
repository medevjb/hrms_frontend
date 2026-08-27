// Mantine owns components/theme; Tailwind owns page layout only (docs/PRD.md §6.2).
// postcss-preset-mantine compiles Mantine's own component CSS (light-dark(), rem(), em()).
// @tailwindcss/postcss compiles Tailwind, with Preflight excluded in app/globals.css.
const config = {
  plugins: {
    "postcss-preset-mantine": {},
    "postcss-simple-vars": {
      variables: {
        "mantine-breakpoint-xs": "36em",
        "mantine-breakpoint-sm": "48em",
        "mantine-breakpoint-md": "62em",
        "mantine-breakpoint-lg": "75em",
        "mantine-breakpoint-xl": "88em",
      },
    },
    "@tailwindcss/postcss": {},
  },
};

export default config;
