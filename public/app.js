
const message = document.getElementById("message");
const authSection = document.getElementById("auth-section");
const dashboard = document.getElementById("dashboard");

let accessToken = sessionStorage.getItem("d_siren_token");

function showMessage(text) {
  message.textContent = text;
}

function showDashboard(user) {
  authSection.hidden = true;
  dashboard.hidden = false;
  document.getElementById("account-info").textContent =
    `Logged in as ${user.email}`;
}

function showLogin() {
  authSection.hidden = false;
  dashboard.hidden = true;
}

async function authRequest(endpoint, email, password) {
  const response = await fetch(`/api/auth/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || "Authentication failed");
  }

  if (!result.session?.access_token) {
    throw new Error(
      "Check your email for confirmation, then log in."
    );
  }

  accessToken = result.session.access_token;
  sessionStorage.setItem("d_siren_token", accessToken);

  showDashboard(result.user);
  showMessage("Successfully logged in.");
}

document.getElementById("register-form")
  .addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
      const email =
        document.getElementById("register-email").value;
      const password =
        document.getElementById("register-password").value;

      await authRequest("register", email, password);
    } catch (error) {
      showMessage(error.message);
    }
  });

document.getElementById("login-form")
  .addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
      const email =
        document.getElementById("login-email").value;
      const password =
        document.getElementById("login-password").value;

      await authRequest("login", email, password);
    } catch (error) {
      showMessage(error.message);
    }
  });

document.getElementById("pair-form")
  .addEventListener("submit", async (event) => {
    event.preventDefault();

    const result = document.getElementById("pair-result");
    result.textContent = "Requesting pairing code...";

    try {
      const phoneNumber =
        document.getElementById("phone-number").value;

      const response = await fetch("/api/whatsapp/pair", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`
        },
        body: JSON.stringify({ phoneNumber })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Pairing failed");
      }

      result.textContent =
        `Pairing code: ${data.pairingCode}`;
    } catch (error) {
      result.textContent = error.message;
    }
  });

document.getElementById("logout-button")
  .addEventListener("click", () => {
    sessionStorage.removeItem("d_siren_token");
    accessToken = null;
    showLogin();
    showMessage("You have logged out.");
  });

if (accessToken) {
  showMessage("Please log in again to continue.");
  sessionStorage.removeItem("d_siren_token");
  accessToken = null;
}

showLogin();

