const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const path = require("path");
const { MongoClient } = require("mongodb");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const mongoURI = "mongodb://localhost:27017";
const client = new MongoClient(mongoURI);
let db;

client.connect()
    .then(() => {
        console.log("Connected to MongoDB");
        db = client.db("collaboration_board");
    })
    .catch(err => console.error(err));

app.use(express.static(path.join(__dirname, "../public")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../public/index.html"));
});

io.on("connection", (socket) => {
    console.log("A user connected");

    emitSavedDrawings(socket);

    socket.on("draw", (data) => {
        socket.broadcast.emit("draw", data);

        if (db) {
            db.collection("drawings").insertOne(data);
        }
    });

    socket.on("stopDrawing", () => {
        socket.broadcast.emit("stopDrawing");
    });

    socket.on("disconnect", () => {
        console.log("User disconnected");
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

async function emitSavedDrawings(socket) {
    try {
        if (db) {
            const drawings = await db.collection("drawings").find().toArray();
            socket.emit("loadSavedDrawings", drawings);
        }
    } catch (error) {
        console.error("Error emitting saved drawings:", error);
    }
}
