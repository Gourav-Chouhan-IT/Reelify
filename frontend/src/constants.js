export const API_URL = import.meta.env.VITE_API_URL;
export const API_KEY = import.meta.env.VITE_API_KEY;
export const initialReels = () => Array(3).fill(null).map(() => ({ url: "", file: null }));
