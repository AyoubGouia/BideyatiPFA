import express, { Application } from "express";
import cors from "cors";
import morgan from "morgan";
import routes from "./interfaces/routes";

const app: Application = express();

app.use(morgan("dev")); // <-- Request logging package

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check and API routes
app.use("/api", routes);

export default app;
