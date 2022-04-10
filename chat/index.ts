import { Server } from "socket.io";
import { color } from "./Bonus/color";
const MongoClient = require("mongodb").MongoClient;
const url = "mongodb://localhost:27017/";
const io = new Server(3000, {
    /* options */
});

io.on("connection", async (socket) => {
    console.log("User connected");
    socket.emit(
        "fromServer",
        color.FgYellow +
            "Welcome to IRChat !\n" +
            color.FgRed +
            "'help'" +
            color.FgYellow +
            " to get more info on the commands" +
            color.Reset
    );

    // Login function
    socket.on("login", (login: string) => {
        MongoClient.connect(url, function (erreur: any, db: any) {
            if (erreur) throw erreur;
            const dbo = db.db("ircdb");
            const myobj = { username: login, visited_rooms: [], friends: [] };
            const query = { username: login };
            dbo.collection("users")
                .find(query)
                .toArray(function (err: any, result: any) {
                    if (err) throw err;
                    if (result.length === 0) {
                        dbo.collection("users").insertOne(myobj, function (erreur: any, res: any) {
                            if (erreur) throw erreur;
                            socket.emit(
                                "login response",
                                color.FgCyan + `New user created ${login}` + color.Reset
                            );
                            socket.data.login = login;
                            db.close();
                        });
                    } else {
                        socket.emit(
                            "login response",
                            color.FgCyan + `Connected as ${login}` + color.Reset
                        );
                        socket.data.login = login;
                        db.close();
                    }
                });
        });
    });

    // Join room
    let room_name = "";
    socket.on("join room", (room: string) => {
        if (room_name !== "" || room_name === room) {
            socket.leave(room_name);
            socket.emit("left room", color.FgRed + `Left room ${room_name}` + color.Reset);
        }
        room_name = room;
        socket.join(room);
        MongoClient.connect(url, (error: any, db: any) => {
            if (error) throw error;
            const dbo = db.db("ircdb");
            dbo.collection("rooms")
                .find({ name: room })
                .toArray((err: any, result: any) => {
                    if (err) throw err;
                    if (result.length > 0) {
                        dbo.collection("rooms").updateOne(
                            { name: room },
                            { $addToSet: { users: socket.data.login } }
                        );
                        socket.emit(
                            "joined room",
                            color.FgYellow + `Joined : ${room}` + color.Reset
                        );
                    } else {
                        socket.emit(
                            "joined room",
                            color.FgRed +
                                `The room ${room} you are trying to access does not exist` +
                                color.Reset
                        );
                    }
                });
        });
        // console.log(socket.rooms);
    });

    // List room
    socket.on("list room", () => {
        MongoClient.connect(url, (error: any, db: any) => {
            if (error) throw error;
            const dbo = db.db("ircdb");
            dbo.collection("rooms")
                .find()
                .toArray((error: any, result: any) => {
                    socket.emit("list room response", result);
                });
        });
    });

    // users
    socket.on("users", () => {
        MongoClient.connect(url, (error: any, db: any) => {
            if (error) throw error;
            const dbo = db.db("ircdb");
            let query = { name: room_name };
            dbo.collection("rooms")
                .find(query)
                .toArray((error: any, result: any) => {
                    if (error) throw error;
                    // console.log(socket.data);
                    if (room_name !== "") socket.emit("list users response", result);
                    else socket.emit("list users response", "Choose a room first !");
                });
        });
    });

    // Create room
    socket.on("create room", (roomName: string) => {
        MongoClient.connect(url, (err: any, db: any) => {
            if (err) throw err;
            const dbo = db.db("ircdb");
            const myNewRoom = { users: [], messages: [], name: roomName };
            dbo.collection("rooms")
                .find({ name: roomName })
                .toArray((err: any, result: any) => {
                    if (err) throw err;
                    if (result.length === 0) {
                        dbo.collection("rooms").insertOne(myNewRoom, (err: any, result: any) => {
                            if (err) throw err;
                            socket.emit(
                                "room created",
                                color.FgCyan + `Room ${roomName} has been created.` + color.Reset
                            );
                        });
                    } else {
                        socket.emit(
                            "room created",
                            color.FgRed + `Room ${roomName} already exists.` + color.Reset
                        );
                    }
                });
        });
    });

    // Send new message
    socket.on("new message", (newMessage: string) => {
        room_name = [...socket.rooms].slice(1)[0] || "";
        if (!socket.data.login) {
            socket.data.login = "Anonymous";
        }
        const mymsg = {
            content: newMessage,
            date: new Date().toLocaleString(),
            sender: socket.data.login,
            room: room_name,
        };

        MongoClient.connect(url, function (erreur: any, db: any) {
            if (erreur) throw erreur;
            const dbo = db.db("ircdb");

            dbo.collection("messages").insertOne(mymsg, function (erreur: any, res: any) {
                if (erreur) throw erreur;
                socket
                    .to(room_name)
                    .emit(
                        "send message",
                        color.FgMagenta +
                            `${socket.data.login}` +
                            color.Reset +
                            ` : ${mymsg.content}`
                    );
                db.close();
            });
        });
    });

    //leave room
    socket.on("leave room", (room: string) => {
        room_name = "";
        socket.leave(room);
        socket.emit("left room", color.FgRed + `Left room ${room}` + color.Reset);
    });

    //Quit
    socket.on("quit", () => {
        socket.emit("quit");
    });
    // Send history
    socket.on("history", () => {
        MongoClient.connect(url, function (erreur: any, db: any) {
            if (erreur) throw erreur;
            const dbo = db.db("ircdb");
            let query = { room: room_name };
            dbo.collection("messages")
                .find(query, { projection: { _id: 0, date: 1, sender: 1, content: 1, room: 1 } })
                .toArray(function (err: any, result: any) {
                    if (err) throw err;
                    socket.emit("send history", result);
                    db.close();
                });
        });
    });

    // Help
    socket.on("help", () => {
        socket.emit(
            "help",
            color.FgRed +
                "List of commands :\n" +
                color.FgGreen +
                "help : " +
                color.Reset +
                "display this message\n" +
                color.FgGreen +
                "login <username> : " +
                color.Reset +
                "sign up or login\n" +
                color.FgGreen +
                "list_room : " +
                color.Reset +
                " list all rooms\n" +
                color.FgGreen +
                "create_room <roomname> : " +
                color.Reset +
                "create a room\n" +
                color.FgGreen +
                "enter <roomname> : " +
                color.Reset +
                "join a room\n" +
                color.FgGreen +
                "users : " +
                color.Reset +
                "list users in the room\n" +
                color.FgGreen +
                "add_friend <username> : " +
                color.Reset +
                "add a new friend\n" +
                color.FgGreen +
                "list_friends : " +
                color.Reset +
                "displays all your friends\n" +
                color.FgGreen +
                "history : " +
                color.Reset +
                " display and download the history of the room\n" +
                color.FgGreen +
                "exit_room <roomname> : " +
                color.Reset +
                " leave the room\n" +
                color.FgGreen +
                "mp <username> : " +
                color.Reset +
                " create a private room\n" +
                color.FgGreen +
                "quit : " +
                color.Reset +
                " disconnect from the server"
        );
    });

    // add friend
    socket.on("add_friend", (contact: string) => {
        MongoClient.connect(url, function (erreur: any, db: any) {
            if (erreur) throw erreur;
            const dbo = db.db("ircdb");
            const query = { username: socket.data.login };
            dbo.collection("users")
                .find(query)
                .toArray(function (err: any, fresult: any) {
                    if (err) throw err;
                    dbo.collection("users")
                        .find(query)
                        .toArray(function (err: any, result: any) {
                            if (err) throw err;
                            if (result.length === 0) {
                                let message = "user " + contact + " not found !";
                                socket.emit("user_added", color.BgCyan + message + color.Reset);
                            } else {
                                dbo.collection("users").updateOne(
                                    { username: contact },
                                    { $addToSet: { friends: socket.data.login } }
                                );
                                dbo.collection("users").updateOne(
                                    { username: socket.data.login },
                                    { $addToSet: { friends: contact } },
                                    function (err: any, res: any) {
                                        if (err) throw err;
                                        let message =
                                            "User " + contact + " has been added to friends !";
                                        socket.emit("user_added", message);
                                        db.close();
                                    }
                                );
                            }
                        });
                });
        });
    });

    socket.on("list friends", () => {
        console.log("list friend");
        MongoClient.connect(url, (err: any, db: any) => {
            if (err) throw err;
            const dbo = db.db("ircdb");
            dbo.collection("users")
                .find({ username: socket.data.login })
                .toArray((err: any, result: any) => {
                    socket.emit("list friends response", result[0].friends);
                    console.log(result[0].friends);
                    db.close();
                });
        });
    });

    //Private message
    socket.on("private message", (dest: string) => {
        const receiver: any = Array.from(io.sockets.sockets.values()).find(
            (el) => el.data.login === dest
        );
        if ([...socket.rooms].length > 1) {
            socket.leave([...socket.rooms][1]);
        }
        if ([...receiver.rooms].length > 1) {
            receiver.leave([...receiver.rooms][1]);
        }
        room_name = `${dest}_${socket.data.login}`;
        socket.join(room_name);
        receiver.join(room_name);
        socket.emit("received mp", `You are now in a room with ${dest}`);
        receiver.emit("received mp", `You are now in a room with ${socket.data.login}`);
    });
});
