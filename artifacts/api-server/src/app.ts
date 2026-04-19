import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { createProxyMiddleware } from "http-proxy-middleware";
import router from "./routes";
import { logger } from "./lib/logger";

const BRANDING = {
  provider: "CASPER TECH DEVS",
  creator: "TRABY CASPER",
};

const app: Express = express();

app.set("json spaces", 2);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Inject branding into every JSON response
app.use((_req: Request, res: Response, next: NextFunction) => {
  const originalJson = res.json.bind(res);
  res.json = function (body: unknown) {
    if (body !== null && typeof body === "object" && !Array.isArray(body)) {
      body = { ...BRANDING, ...(body as Record<string, unknown>) };
    }
    return originalJson(body);
  };
  next();
});

app.use("/api", router);

// In development, proxy the scraper-ui Vite dev server through the api-server.
// This lets the frontend be reachable at /scraper-ui/ via the main port (8080 → 80).
if (process.env.NODE_ENV === "development") {
  const VITE_PORT = 22742;
  const viteProxy = createProxyMiddleware({
    target: `http://localhost:${VITE_PORT}`,
    changeOrigin: true,
    ws: true,
    on: {
      error: (_err, _req, res) => {
        if (res && "writeHead" in res && typeof res.writeHead === "function") {
          (res as Response).writeHead(502, { "Content-Type": "text/plain" });
          (res as Response).end("Frontend dev server starting…");
        }
      },
    },
  });
  app.use("/scraper-ui", viteProxy);
}

export default app;
