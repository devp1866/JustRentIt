
import nextPlugin from "@next/eslint-plugin-next"

export default [
    {
        plugins: {
            "@next/next": nextPlugin,
        },
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            parserOptions: {
                ecmaVersion: "latest",
                ecmaFeatures: {
                    jsx: true
                }
            }
        },
        rules: {
            ...nextPlugin.configs.recommended.rules,
            ...nextPlugin.configs["core-web-vitals"].rules,
        },
        ignores: [
            ".next/*",
            "node_modules/*",
            "out/*",
            "build/*"
        ]
    }
];
