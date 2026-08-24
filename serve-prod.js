import { preview } from "vite";

const server = await preview({
    preview: {
        port: 1430,
        host: true,
        allowedHosts: ["compcube.net", "cocu.shyyluna.dev", "localhost", "127.0.0.1"],
    },
});