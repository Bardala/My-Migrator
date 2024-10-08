import express from "express";
import { SqlDataStore } from "./SqlDataStore.class";

const app = express();

app.use(express.json());
app.use(express.static("public"));

export type TestUser = {
  id: number;
  age: number;
  name: string;
  email: string;
};

(async () => {
  // const { PORT } = process.env;
  // if (!PORT) process.exit(1);
  const db = new SqlDataStore();
  await db.runDB();

  const port = 3000;

  app.get("/", (_req, res) => res.send("Got you!"));

  app.post("/api/test", async (req, res) => {
    const { id, age, name, email } = req.body;
    const user: TestUser = { id, age, name, email };

    await db.createTestUser(user);
    return res.status(201).send({ user });
  });

  app.listen(port, () =>
    console.log(`Server listening at http://localhost:${port}`),
  );
})();
