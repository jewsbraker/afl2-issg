const io = require("socket.io-client");
const readline = require("readline");
const crypto = require("crypto");

const socket = io("http://localhost:3000");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "> ",
});

// Generate pasangan kunci RSA unik untuk setiap client
const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: { type: "spki", format: "pem" },
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
});

let registeredUsername = "";
let username = "";
let targetUsername = "";
const users = new Map();

function generateHash(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function signMessage(text) {
  return crypto.sign("sha256", Buffer.from(text), privateKey).toString("hex");
}

function verifySignature(text, signatureHex, senderPublicKeyPem) {
  try {
    return crypto.verify(
      "sha256",
      Buffer.from(text),
      senderPublicKeyPem,
      Buffer.from(signatureHex, "hex")
    );
  } catch (err) {
    return false;
  }
}

function encryptForTarget(text, targetPublicKeyPem) {
  return crypto
    .publicEncrypt(targetPublicKeyPem, Buffer.from(text, "utf8"))
    .toString("hex");
}

function tryDecrypt(ciphertextHex) {
  try {
    return crypto
      .privateDecrypt(privateKey, Buffer.from(ciphertextHex, "hex"))
      .toString("utf8");
  } catch (err) {
    return null;
  }
}

socket.on("connect", () => {
  console.log("Connected to the server");

  rl.question("Enter your username: ", (input) => {
    username = input.trim();
    registeredUsername = input.trim();
    console.log(`Welcome, ${username} to the chat`);

    socket.emit("registerPublicKey", {
      username,
      publicKey: publicKey,
    });
    rl.prompt();

    rl.on("line", (message) => {
      if (message.trim()) {
        let match;
        if ((match = message.match(/^!impersonate (\w+)$/))) {
          username = match[1];
          console.log(`Now impersonating as ${username}`);
        } else if ((match = message.match(/^!secret (\w+)$/))) {
          const target = match[1];
          if (!users.has(target)) {
            console.log(`User "${target}" not found in chat.`);
          } else {
            targetUsername = target;
            console.log(`Now secretly chatting with ${targetUsername}`);
          }
        } else if (message.match(/^!exit$/)) {
          if (targetUsername) {
            console.log(`No more secretly chatting with ${targetUsername}`);
            targetUsername = "";
          }
          if (username !== registeredUsername) {
            username = registeredUsername;
            console.log(`Now you are ${username}`);
          }
        } else {
          let contentToSend = message;
          let isEncrypted = false;

          if (targetUsername) {
            const targetPubKey = users.get(targetUsername);
            contentToSend = encryptForTarget(message, targetPubKey);
            isEncrypted = true;
          }

          const hash = generateHash(contentToSend);
          const signature = signMessage(contentToSend);

          const packet = JSON.stringify({
            senderId: socket.id,
            content: contentToSend,
            hash,
            sig: signature,
            isEncrypted,
          });

          socket.emit("message", { username, message: packet });
        }
      }
      rl.prompt();
    });
  });
});

socket.on("init", (keys) => {
  keys.forEach(([user, key]) => users.set(user, key));
  console.log(`\nThere are currently ${users.size} users in the chat`);
  rl.prompt();
});

socket.on("newUser", (data) => {
  const { username, publicKey } = data;
  users.set(username, publicKey);
  console.log(`${username} join the chat`);
  rl.prompt();
});

socket.on("message", (data) => {
  const { username: senderUsername, message: rawMessage } = data;
  let parsed = null;
  let serverTampered = false;

  try {
    parsed = JSON.parse(rawMessage);
  } catch (err) {
    // Terpicu jika malicious-server.js menambahkan " (sus?)" di akhir pesan
    serverTampered = true;
    const lastBrace = rawMessage.lastIndexOf("}");
    if (lastBrace !== -1) {
      try {
        parsed = JSON.parse(rawMessage.slice(0, lastBrace + 1));
      } catch (_) {}
    }
  }

  if (!parsed) {
    console.log(`${senderUsername}: ${rawMessage}`);
    console.log("⚠️  WARNING: The message may have been changed during transmission!");
    rl.prompt();
    return;
  }

  // Abaikan pesan yang dikirim dari terminal kita sendiri
  if (parsed.senderId === socket.id) return;

  // Cek Assignment #1 (Hash SHA-256)
  const expectedHash = generateHash(parsed.content);
  const hashValid = !serverTampered && parsed.hash === expectedHash;

  // Cek Assignment #2 (RSA Signature)
  const senderPublicKey = users.get(senderUsername);
  const sigValid =
    senderPublicKey && verifySignature(parsed.content, parsed.sig, senderPublicKey);

  // Cek Assignment #3 (RSA Secret Chat)
  if (parsed.isEncrypted) {
    const decrypted = tryDecrypt(parsed.content);
    if (decrypted !== null) {
      console.log(`${senderUsername} (secret): ${decrypted}`);
    } else {
      console.log(`${senderUsername}: ${parsed.content}`);
    }
  } else {
    console.log(`${senderUsername}: ${parsed.content}`);
  }

  if (!hashValid) {
    console.log("⚠️  WARNING: The message may have been changed during transmission!");
  }
  if (!sigValid) {
    console.log("⚠️  WARNING: This user is fake!");
  }

  rl.prompt();
});

socket.on("disconnect", () => {
  console.log("Server disconnected, Exiting...");
  rl.close();
  process.exit(0);
});

rl.on("SIGINT", () => {
  console.log("\nExiting...");
  socket.disconnect();
  rl.close();
  process.exit(0);
});