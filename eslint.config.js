import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  // Guarda contra uso direto do client Supabase fora da fachada de
  // auth/realtime em src/lib/auth/**. Toda chamada a tabelas deve ir
  // pelo backend Hono.
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: [
      "src/lib/auth/**",
      "src/integrations/**",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/integrations/supabase/client",
              message:
                "Use a fachada '@/lib/auth' (auth/realtime) ou os helpers '@/lib/api/*' (dados). Importar o client cru só é permitido em src/lib/auth/**.",
            },
          ],
        },
      ],
    },
  },
);
