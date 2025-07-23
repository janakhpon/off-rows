import { app } from "./server";
import { PORT } from "./config";
import "./openapi";

app.listen(PORT || 3001, () => {
  console.log(`Server listening on port ${PORT}`);
});
