/// <reference types="vite/client" />

// Add app-specific Vite env types so `import.meta.env.VITE_API_URL` is recognized
interface ImportMetaEnv {
	readonly VITE_API_URL?: string;
	// add more env vars here as needed
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
