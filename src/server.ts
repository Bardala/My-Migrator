import express from "express";
import { SqlDataStore } from "./SqlDataStore.class";
import { TestUser } from "./types";
const app = express();

app.use(express.json());
app.use(express.static("public"));

const port = 3000;

app.get("/", (_req, res) => res.send("Got you!"));
const db = new SqlDataStore();
db.runDB();

app.post("/api/test", async (req, res) => {
  const { id, age, name, email } = req.body;
  const user: TestUser = { id, age, name, email };

  await db.createTestUser(user);
  return res.status(201).send({ user });
});

app.listen(port, () =>
  console.log(`Server listening at http://localhost:${port}`),
);
