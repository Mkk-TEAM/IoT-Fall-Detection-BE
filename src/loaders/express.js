import rootRouter from "../routes/root.router.js";
import { errorHandler, notFoundHandler } from "../helpers/handleError.js";
import { setupSwagger } from "./swagger.config.js";

export default async (app) => {
  const apiPrefix = process.env.API_PREFIX || "/api/v1";

  setupSwagger(app);

  app.use(apiPrefix, rootRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);
};
