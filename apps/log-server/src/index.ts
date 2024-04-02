import express from "express";
import { config } from "dotenv";
config();
const app = express();

app.listen(process.env.PORT || 3002, () => {
  console.log("Listening on port 3002");
});
