const socket = new WebSocket("ws://localhost:3000");

socket.addEventListener("open", (event) => {
  console.log("WebSocket verbunden.");
  
  // Token und benutzername damit extrahieren
  const token = localStorage.getItem("authToken");
  if (token) {
    const decoded = JSON.parse(atob(token.split('.')[1]));
    const username = decoded.username;
    
    // Benutzernamens im Header setzen
    document.getElementById('usernameDisplay').innerText = username;
    
    const user = { id: decoded.userId, name: username };
    const message = {
      type: "user",
      user,
    };
    socket.send(JSON.stringify(message));
  } else {
    window.location.href = "/index.html";
  }
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
