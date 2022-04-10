import { io } from "socket.io-client";
import { color } from "./Bonus/color";
var MongoClient = require("mongodb").MongoClient;
var url = "mongodb://localhost:27017/";
const readline = require("readline");
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "",
});

const socket = io("ws://localhost:3000");

socket.on("fromServer", (arg) => {
    console.log(arg);
});

const fetchReadline = (): void => {
    rl.on("line", (input: string) => {
        const commands = input.split(" ");
        switch (commands[0]) {
            case "history":
                socket.emit("history");
                break;
            case "list_room":
                socket.emit("list room");
                break;
            case "users":
                socket.emit("users");
                break;
            case "create_room":
                socket.emit("create room", commands[1]);
                break;
            case "login":
                socket.emit("login", commands[1]);
                break;
            case "enter":
                socket.emit("join room", commands[1]);
                break;
            case "add_friend":
                socket.emit("add_friend", commands[1]);
                break;
            case "list_friends":
                socket.emit("list friends");
                break;
            case "mp":
                socket.emit("private message", commands[1]);
                break;
            case "exit_room":
                socket.emit("leave room", commands[1]);
                break;
            case "help":
                socket.emit("help", commands[1]);
                break;
            case "quit":
                socket.emit("quit", commands[1]);
                break;
            default:
                socket.emit("new message", input);
        }
    });
};
fetchReadline();

//Event listeners
socket.on("send history", (result: any) => {
    const fs = require("fs");
    let fileName = "./history_" + result[0].room + ".csv";
    let content = "Date,Sender,Message\n";
    result.forEach(
        (res: any) => (
            console.log(res.date, " - ", res.sender, " - ", res.content),
            (content = content + res.date + "," + res.sender + "," + res.content + "\n")
        )
    );
    fs.writeFileSync(fileName, content, function (err: any) {
        if (err) {
            return console.log("error while writing in file");
        }
    });
});
socket.on("room created", (result: string) => {
    console.log(result);
});
socket.on("login response", (result: string) => {
    console.log(result);
});
socket.on("joined room", (result: string) => {
    console.log(result);
});
socket.on("send message", (arg: string) => {
    console.log(arg);
});

socket.on("user_added", (arg: string) => {
    console.log(arg);
});

socket.on("list friends response", (arg: string[]) => {
    console.log("--------------");
    console.log("|   friends   |");
    console.log("--------------");
    for (let i = 0; i < arg.length; i++) {
        console.log("   ", arg[i], "  ");
        console.log("--------------");
    }
});

socket.on("list users response", (arg: any) => {
    console.log("--------------");
    console.log("|  users list |");
    console.log("--------------");
    if (typeof arg === "string") {
        console.log(arg);
    } else {
        for (let i = 0; i < arg[0].users.length; i++) {
            console.log("    ", arg[0].users[i], "  ");
            console.log("--------------");
        }
    }
});

socket.on("list room response", (rooms: any) => {
    console.log("--------------");
    console.log("|  rooms list |");
    console.log("--------------");
    rooms.forEach((room: any) => (console.log("    ", room.name), console.log("--------------")));
});

socket.on("received mp", (result: string) => {
    console.log("\x1b[36m%s\x1b[0m", result);
});
socket.on("left room", (arg: string) => {
    console.log(arg);
});

socket.on("help", (arg: string) => {
    console.log(arg);
});

socket.on("quit", () => {
    console.log(color.FgBlue + "Goodbye !" + color.Reset);
    process.exit();
});
