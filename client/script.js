const socket = new WebSocket("ws://localhost:3000");

socket.addEventListener("open", (event) => {
  console.log("WebSocket verbunden.");

  // Token und Benutzernamen extrahieren
  const token = localStorage.getItem("authToken");
  if (token) {
    const decoded = JSON.parse(atob(token.split('.')[1]));
    const username = decoded.username;

    // Benutzernamen im Header setzen
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
  const btnChangeUsername = document.getElementById("btnChangeUsername");
  const newUsernameInput = document.getElementById("newUsernameInput");
  const usernameDisplay = document.getElementById("usernameDisplay");

  // Nachrichten senden
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

  // Benutzername ändern
  btnChangeUsername.addEventListener("click", () => {
    const newUsername = newUsernameInput.value.trim();

    if (newUsername) {
      const token = localStorage.getItem("authToken");
      if (token) {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        const userId = decoded.userId;

        // Anfrage an den API-Endpunkt senden, um den Benutzernamen zu ändern
        fetch(`/api/users/${userId}/updateUsername`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId, newUsername }),
        })
        .then(response => response.json())
        .then(data => {
          if (data.message === "Benutzername erfolgreich aktualisiert.") {
            usernameDisplay.innerText = newUsername;
            localStorage.setItem("authToken", data.token);
            newUsernameInput.value = "";
          } else {
            alert(data.error || "Fehler beim Ändern des Benutzernamens.");
          }
        })
        .catch(error => {
          console.error("Fehler bei der Benutzeraktualisierung:", error);
          alert("Es gab ein Problem beim Ändern des Benutzernamens.");
        });
      }
    }
  });
});

socket.addEventListener("close", (event) => {
  console.log("WebSocket geschlossen.");
});

socket.addEventListener("error", (event) => {
  console.error("WebSocket Fehler:", event);
});
