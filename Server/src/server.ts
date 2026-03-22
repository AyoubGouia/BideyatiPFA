import app from "./app";
import { env } from "./infrastructure/config/env";

const PORT = env.PORT;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
