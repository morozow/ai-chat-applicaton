/**
 * Application configuration loaded from environment variables.
 * Uses Vite's import.meta.env for environment variable access.
 */

interface Config {
    apiUrl: string;
    apiToken: string;
}

/**
 * Validates and returns the application configuration.
 * Throws an error if required environment variables are missing.
 */
function loadConfig(): Config {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const apiToken = import.meta.env.VITE_API_TOKEN;

    if (!apiToken) {
        throw new Error(
            'Missing required environment variable: VITE_API_TOKEN. ' +
            'Please create a .env.local file with your API token.'
        );
    }

    return {
        apiUrl,
        apiToken,
    };
}

export const config = loadConfig();

export type { Config };
