const { Server } = require("socket.io");
const http = require("http");

const server = http.createServer();
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const rooms = new Map();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
    }
    rooms.get(roomId).add(socket.id);
    
    const clients = rooms.get(roomId);
    console.log(`User ${socket.id} joined room ${roomId}. Total: ${clients.size}`);
    
    if (clients.size >= 2) {
      io.to(roomId).emit("start-game");
    }
  });

  socket.on("spawn-troop", ({ roomId, team, type }) => {
    // Broadcast to others in the room
    socket.to(roomId).emit("enemy-spawn", { team, type });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    // Cleanup rooms (omitted for brevity in this simple version)
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Socket server running on port ${PORT}`);
});
