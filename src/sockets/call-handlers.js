export const registerCallHandlers = (io, socket) => {
  console.log("🔌 Connected:", socket.id);

  // 🔹 Join Room
  socket.on("join", ({ roomId }) => {
    socket.join(roomId);

    const clients = io.sockets.adapter.rooms.get(roomId) || new Set();

    // notify existing users
    socket.to(roomId).emit("user-joined", {
      socketId: socket.id,
    });

    // send existing users to new user
    socket.emit("existing-users", Array.from(clients));
  });

  // 🔹 Offer
  socket.on("offer", ({ to, offer }) => {
    io.to(to).emit("offer", {
      from: socket.id,
      offer,
    });
  });

  // 🔹 Answer
  socket.on("answer", ({ to, answer }) => {
    io.to(to).emit("answer", {
      from: socket.id,
      answer,
    });
  });

  // 🔹 ICE Candidate
  socket.on("ice-candidate", ({ to, candidate }) => {
    io.to(to).emit("ice-candidate", {
      from: socket.id,
      candidate,
    });
  });

  // 🔹 Disconnect
  socket.on("disconnect", () => {
    console.log("❌ Disconnected:", socket.id);

    socket.broadcast.emit("user-left", {
      socketId: socket.id,
    });
  });
};