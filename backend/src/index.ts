import { app } from "./server";
import { PORT } from "./config";
import "./openapi";

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
