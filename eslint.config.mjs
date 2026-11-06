import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const eslintConfig = [...nextCoreWebVitals, ...nextTypescript, {
  rules: {
    // TypeScript
    // no-explicit-any permanece off: o app consome payloads dinâmicos do motor
    // via socket.io e valida na borda (Zod/guards) — qualquer mudança entra no CI
    "@typescript-eslint/no-unused-vars": ["error", {
      argsIgnorePattern: "^_",
      varsIgnorePattern: "^_",
      caughtErrorsIgnorePattern: "^_",
      ignoreRestSiblings: true,
    }],
    "@typescript-eslint/no-non-null-assertion": "error",
    "@typescript-eslint/ban-ts-comment": "warn",

    // React
    "react-hooks/exhaustive-deps": "warn",
    "react/no-unescaped-entities": "off",
    "react/display-name": "off",
    "react/prop-types": "off",
    "react-compiler/react-compiler": "off",

    // Next.js
    "@next/next/no-img-element": "off",
    "@next/next/no-html-link-for-pages": "off",

    // JavaScript — bugs clássicos voltam a ser bloqueados
    "prefer-const": "error",
    "no-debugger": "error",
    "no-unreachable": "error",
    "no-redeclare": "error",
    "no-useless-escape": "error",
    "no-case-declarations": "error",
    "no-fallthrough": "error",
    "no-mixed-spaces-and-tabs": "error",
    "no-irregular-whitespace": "error",
    "no-empty": ["error", { allowEmptyCatch: true }],
    "no-unused-vars": "off", // coberto por @typescript-eslint/no-unused-vars
    "no-undef": "off", // TS já verifica
  },
}, {
  // componentes shadcn/ui vendidos: código de biblioteca — regras de pureza do
  // React Compiler geram falso positivo (ex.: Math.random no sidebar); não reescrever
  files: ["src/components/ui/**", "src/hooks/use-toast.ts"],
  rules: {
    "react-hooks/purity": "off",
  },
}, {
  ignores: ["node_modules/**", ".next/**", "out/**", "build/**", "next-env.d.ts", "examples/**", "mini-services/**", "capyber/**", "skills"]
}];

export default eslintConfig;
