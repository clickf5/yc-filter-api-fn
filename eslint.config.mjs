import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";


export default [
  {
    files: ["**/*.{js,mjs,cjs,ts}"]
  },
  {
    languageOptions: { globals: globals.node }
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  eslintPluginPrettierRecommended,
  {
    rules: {
      "@typescript-eslint/ban-types": "off",
      "@typescript-eslint/no-unused-vars": ["off"],
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/explicit-function-return-type": ["warn"],
      "prettier/prettier": [
        "error",
        {
          "singleQuote": true,
          "useTabs": true,
          "semi": true,
          "trailingComma": "all",
          "bracketSpacing": true,
          "printWidth": 100,
          "endOfLine": "auto"
        }
      ]
    }
  }
];