const socket = new WebSocket("ws://localhost:3000");

socket.addEventListener("open", (event) => {
  console.log("WebSocket verbunden.");
  const user = { id: 1, name: "John Doe" };
  const message = {
    type: "user",
    user,
  };
  socket.send(JSON.stringify(message));
});

document.addEventListener("DOMContentLoaded", () => {
  const btnSendMessage = document.getElementById("btnSendMessage");
  const messageInput = document.getElementById("messageInput");
  const btnLogout = document.getElementById("btnLogout");

  btnSendMessage.addEventListener("click", () => {
    const text = messageInput.value.trim();

    if (text) {
      const message = {
        type: "message",
        text: text,
      };
      socket.send(JSON.stringify(message));

      messageInput.value = "";
    }
  });

  messageInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      btnSendMessage.click();
    }
  });

  // Logout-Funktion
  btnLogout.addEventListener("click", () => {
    localStorage.removeItem("authToken"); 
    window.location.href = "/index.html";
  });
});

socket.addEventListener("close", (event) => {
  console.log("WebSocket geschlossen.");
});

socket.addEventListener("error", (event) => {
  console.error("WebSocket Fehler:", event);
});
