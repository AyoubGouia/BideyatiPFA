import app from "./app";
import { env } from "./infrastructure/config/env";

const PORT = env.PORT;

app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT} (0.0.0.0)`);
});
