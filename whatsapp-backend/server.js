//importing
import express from "express";
import mongoose from "mongoose";
import Messages from "./dbMessages.js";
import Pusher from "pusher";
import cors from 'cors'

//app config
const app = express();
const port = process.env.PORT || 9000;

//pusher
const pusher = new Pusher({
  appId: "1366337",
  key: "c0c934b33ccfe516268f",
  secret: "00c50bcc4a1daccf120c",
  cluster: "us2",
  useTLS: true,
});

//middleware
app.use(express.json());

app.use(cors())

// app.use((req, res, next)=>{
//     res.setHeader("Access-Control-Allow-Origin", "*")
//     res.setHeader("Access-Control-Allow-Header", "*")
//     next();
// })

//DB config
const connection__url =
  "mongodb+srv://admin:BTDishk2WJYHONia@cluster0.9ibgv.mongodb.net/whatsappdb?retryWrites=true&w=majority";

mongoose.connect(connection__url, {
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.once("open", () => {
  console.log("DB connected");

  const msgCollection = db.collection("messagecontents");
  const changeStream = msgCollection.watch();

  changeStream.on("change", (change) => {
    console.log("A Change occured", change);

    if (change.operationType === "insert") {
      const messageDetails = change.fullDocument;
      pusher.trigger("messages", "inserted", {
        name: messageDetails.name,
        message: messageDetails.message,
        timestamp:messageDetails.timestamp,
        received: messageDetails.received

      });
    } else {
      console.log("Error Triggering Pusher");
    }
  });
});

//api routes
app.get("/", (req, res) => res.status(200).send("hello world"));

app.get("/messages/sync", (req, res) => {
  Messages.find((err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(200).send(data);
    }
  });
});

app.post("/messages/new", (req, res) => {
  const dbMessage = req.body;
  Messages.create(dbMessage, (err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(201).send(data);
    }
  });
});

//listen
app.listen(port, () => console.log(`Listening on localhost:${port}`));
