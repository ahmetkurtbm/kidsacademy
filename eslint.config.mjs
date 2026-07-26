import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  { ignores: [".next/**", "node_modules/**"] },
  ...nextCoreWebVitals,
  {
    rules: {
      // Flags the standard `useEffect(() => { load(); }, [load])` fetch-on-mount
      // pattern used throughout this app's client components; the setState calls
      // happen after an `await`, not synchronously in the effect body.
      "react-hooks/set-state-in-effect": "off",
    },
  },
];

export default eslintConfig;
