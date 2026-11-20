Raw Markdown Output (README.md)
Copy and paste the raw text below directly into your README.md file:

# AFL-2 — Information Security & Cryptography

**Author:** Lennard Lucius Huang  
**Student ID (NIM):** 0706022410010  
**Program:** Information Systems for Business — Universitas Ciputra Surabaya

---

## Overview

This repository contains practical implementations and experiments covering core cryptographic primitives in Node.js and a real-time **Secure Chat Application** built with **Socket.IO**, featuring both a **CLI (Terminal)** implementation and an **Extra Miles Web UI** implementation powered by the browser's **Web Crypto API**.

---

## Project Structure

```text
afl2-issg/
├── aes/                         # AES-256-CBC & RSA encryption/decryption experiments
│   ├── decrypt-aes.js
│   ├── decrypt-rsa.js
│   ├── encrypt-aes.js
│   ├── encrypt-rsa.js
│   └── generate-key-aes.js
├── ECDSA/                       # ECDSA key generation, signing, and verification
│   ├── generate-key-ecdsa.js
│   ├── sign-ecdsa.js
│   └── verify-ecdsa.js
├── hash/                        # Cryptographic hashing experiments
│   ├── generate-hash.js
│   └── verify-hash.js
├── rsa/                         # RSA key generation, signing, and verification
│   ├── generate-key-rsa.js
│   ├── sign-rsa.js
│   └── verify-rsa.js
├── secure-channel/              # Hybrid cryptography key-exchange & secure channel simulation
│   └── secure-channel.js
└── node-chat-app/               # Real-time Secure Chat Application (CLI & Web UI)
    ├── server.js                # Standard Socket.IO relay server (CLI)
    ├── malicious-server.js      # Simulated MITM/tampering server appending " (sus?)" (CLI)
    ├── client.js                # Unified CLI chat client (SHA-256 + RSA Signature + RSA Secret Chat)
    ├── server-web.js            # Standard HTTP + Socket.IO server serving the Web UI
    ├── malicious-server-web.js  # Simulated tampering server for the Web UI
    ├── client-web.html          # Browser-based Secure Chat UI using Web Crypto API
    └── package.json


Part 1: Cryptography Exercises
Implemented using Node.js built-in crypto module:

Hashing (hash/): Demonstrates deterministic digests, collision resistance, and the avalanche effect across SHA-256 and other hash algorithms.
Digital Signatures (rsa/ & ECDSA/): Compares RSA-2048 (deterministic PKCS#1 v1.5 / PSS signatures) and ECDSA (shorter keys, non-deterministic signatures) for message authentication and integrity.
Symmetric & Asymmetric Encryption (aes/ & rsa/):
AES-256-CBC: Demonstrates CSPRNG key/IV generation (crypto.randomBytes), deterministic encryption with fixed IVs, and decryption failure on ciphertext/key tampering.
RSA-OAEP: Demonstrates probabilistic encryption (randomized padding per execution) and integrity checking during decryption.
Secure Channel (secure-channel/secure-channel.js): Simulates a two-way authenticated key exchange where both parties sign and encrypt half-keys/IVs with RSA to derive a shared AES-256-CBC session key.


Part 2: Secure Chat Application
Prerequisites & Installation
Make sure Node.js (v18 or newer) is installed, then install dependencies inside node-chat-app:h
cd node-chat-app
npm install


---

### Option A: CLI Version (Terminal)

1. **Start the Server:**
   - Normal server:
     ```bash
     node server.js
     ```
   - Or malicious server (to test Assignment #1 tampering detection):
     ```bash
     node malicious-server.js
     ```

2. **Start Multiple Clients (open separate terminals):**
   ```bash
   node client.js

Enter a unique username for each terminal (e.g., Alice, Bob, Charlie).

CLI Chat Commands:

| Command | Description |
|---|---|
| <message> | Send a signed public message with SHA-256 integrity hash. |
| !impersonate <username> | Spoof another user's display name (triggers RSA signature failure warning on recipients). |
| !secret <username> | Encrypt outgoing messages using <username>'s RSA public key (other users only see hex ciphertext). |
| !exit | Exit impersonation mode and/or secret chat mode back to normal public messaging. |


Option B: Web UI Version (Extra Miles)
Start the Web Server:
Normal server:

node server-web.js

Or malicious server:

node malicious-server-web.js

Open in Browser:
Navigate to http://localhost:3000 across multiple browser tabs (e.g., Alice, Bob, Charlie).
Web UI Features:
Assignment #1 (Message Integrity): Computes a SHA-256 digest via crypto.subtle.digest for every message. Running malicious-server-web.js triggers an immediate tampering alert banner.
Assignment #2 (Anti-Impersonation): Generates an RSASSA-PKCS1-v1_5 (SHA-256) key pair per session. Selecting a user from the Impersonate dropdown sends messages under their name with an invalid signature, triggering a This user is fake! warning on all receiving tabs.
Assignment #3 (End-to-End Secret Chat): Generates an RSA-OAEP (SHA-256) key pair per session. Selecting a recipient from the Secret Target dropdown encrypts messages exclusively for that user; non-target users only see raw hexadecimal ciphertext.


Security Mechanisms Summary
Assignment
Threat Model
Cryptographic Defense
Verification Behavior
#1 Integrity
Compromised/malicious server modifying messages in transit
SHA-256 cryptographic hash
Displays warning if server alters payload (" (sus?)")
#2 Authentication
Malicious user spoofing another user's identity (!impersonate)
RSA Digital Signature (2048-bit)
Displays This user is fake! when signature fails against registered public key
#3 Confidentiality
Eavesdropping by unintended chat participants (!secret)
RSA-OAEP Encryption (2048-bit)
Only target recipient decrypts plaintext; others see hex ciphertext


