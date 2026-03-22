import express, { Application } from "express";
import cors from "cors";
import routes from "./interfaces/routes";

const app: Application = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check and API routes
app.use("/api", routes);

export default app;
