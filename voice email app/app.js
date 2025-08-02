const CLIENT_ID = "341984270208-kiqufoaa8m1pa2lv4n5kvea411jtfv8t.apps.googleusercontent.com";  // Replace with your Google OAuth Client ID
const SCOPES = "https://www.googleapis.com/auth/gmail.send";

const micButton = document.getElementById("mic-button");
const formatButton = document.getElementById("format-button");
const sendButton = document.getElementById("send-button");
const userText = document.getElementById("userText");
const status = document.getElementById("status");
const responseText = document.getElementById("responseText");

let formattedEmail = "";
let rawMessage = "";

function initGapiClient() {
  gapi.load("client:auth2", () => {
    gapi.client.init({
      clientId: CLIENT_ID,
      scope: SCOPES,
    }).then(() => {
      status.innerText = "Google API initialized.";
    });
  });
}

window.onload = () => {
  initGapiClient();
};

micButton.onclick = () => {
  status.innerText = "Listening...";
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = "en-US";
  recognition.interimResults = false;

  recognition.start();

  recognition.onresult = (event) => {
    rawMessage = event.results[0][0].transcript;
    userText.value = rawMessage;
    status.innerText = "Captured speech.";
  };

  recognition.onerror = (event) => {
    status.innerText = "Speech recognition error. Try again.";
    console.error(event.error);
  };
};

formatButton.onclick = async () => {
  if (!userText.value.trim()) {
    alert("Please speak or type your message first.");
    return;
  }

  status.innerText = "Formatting email...";

  try {
    const response = await fetch("http://localhost:3000/api/openai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: userText.value,
      }),
    });

    if (!response.ok) {
      throw new Error("AI formatting failed");
    }

    const data = await response.json();
    formattedEmail = data.formattedText;
    responseText.innerText = formattedEmail;
    status.innerText = "Email formatted! Ready to send.";
  } catch (error) {
    console.error(error);
    status.innerText = `❌ Error formatting email: ${error.message}`;
  }
};

sendButton.onclick = () => {
  if (!formattedEmail) {
    alert("Please format your email before sending.");
    return;
  }
  authenticateAndSendEmail("Voice Email", formattedEmail, "recipient@example.com");
};

function authenticateAndSendEmail(subject, bodyText, toEmail) {
  const authInstance = gapi.auth2.getAuthInstance();

  if (!authInstance.isSignedIn.get()) {
    authInstance.signIn().then(() => {
      sendEmail(subject, bodyText, toEmail);
    }).catch((error) => {
      status.innerText = "Google Sign-In failed.";
      console.error(error);
    });
  } else {
    sendEmail(subject, bodyText, toEmail);
  }
}

function sendEmail(subject, bodyText, toEmail) {
  const emailContent = [
    `To: ${toEmail}`,
    `Subject: ${subject}`,
    "",
    bodyText,
  ].join("\n");

  const base64EncodedEmail = btoa(emailContent)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  gapi.client.gmail.users.messages.send({
    userId: "me",
    resource: {
      raw: base64EncodedEmail,
    },
  }).then(() => {
    status.innerText = "Email sent successfully! ✅";
  }).catch((err) => {
    status.innerText = "Failed to send email: " + (err.result?.error?.message || err.message);
    console.error(err);
  });
}
