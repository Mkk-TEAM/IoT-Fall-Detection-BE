import rootRouter from "../routes/root.router.js";
import { setupSwagger } from "./swagger.config.js";
import { errorHandler, notFoundHandler } from "../helpers/handleError.js";
import { env } from "../config/env.js";

export default async function expressLoader(app) {
  setupSwagger(app);
  app.use(env.apiPrefix, rootRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);
}
