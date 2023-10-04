import express from "express";
import cors from "cors";

const app = express();

app.use(cors());

app.use(express.static("./.ryunix"));

app.get("/api/hello", (req, res) => {
  res.send({
    message: "hello",
  });
});

app.listen(3001, () => {
  console.log("port: 3001");
});
