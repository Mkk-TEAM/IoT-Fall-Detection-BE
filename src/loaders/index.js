import expressLoader from "./express.js";
import { connectDB } from "./dbLoader.js";

export default async (app) => {
  await connectDB();
  console.log("✅ Database loader đã nạp");

  await expressLoader(app);
  console.log("✅ Express routes, Swagger và error handler đã nạp");
};
