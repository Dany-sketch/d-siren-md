import express from "express";
import cors from "cors";
import helmet from "helmet";
import "dotenv/config";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "10kb" }));
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.json({
    name: "D SIREN MD",
    message: "Welcome to D SIREN MD",
    status: "online"
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "healthy" });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`D SIREN MD running on port ${PORT}`);
});
