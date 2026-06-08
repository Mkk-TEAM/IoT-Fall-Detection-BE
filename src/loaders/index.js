import expressLoader from "./express.js";
import { connectDB } from "./dbLoader.js";

export default async function loaders(app) {
  await connectDB();
  await expressLoader(app);
  console.log("✅ Express routes, Swagger and error handlers loaded");
}
