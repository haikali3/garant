# API Testing Guide

This guide covers how to test all backend endpoints using Postman and a browser wallet (Phantom/MetaMask).

## Prerequisites

- Backend running locally: `cd backend && npx wrangler dev` (without `--remote`)
- Postman installed
- Phantom or MetaMask wallet extension
-

> **Important:** Do NOT use `npm run dev` as it runs with `--remote` flag, which causes nonce storage issues due to multiple Cloudflare worker instances.

## Endpoints Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| GET | `/db/health` | Database health check |
| POST | `/auth/nonce` | Get nonce for SIWE authentication |
| POST | `/auth/verify` | Verify wallet signature |
| GET | `/auth/me` | Get authenticated user info |

---

## Step 1: Test Basic Endpoints

### 1.1 Root Endpoint

**Request:**
- Method: `GET`
- URL: `http://localhost:8787/`

**Expected Response:**
```
Hello Hono!
```

### 1.2 Database Health

**Request:**
- Method: `GET`
- URL: `http://localhost:8787/db/health`

**Expected Response:**
```json
{"ok": true}
```

---

## Step 2: SIWE Authentication Flow

### 2.1 Get Nonce

**Request:**
- Method: `POST`
- URL: `http://localhost:8787/auth/nonce`
- Headers: `Content-Type: application/json`
- Body:
```json
{
  "address": "0xYourWalletAddress"
}
```

**Expected Response:**
```json
{
  "nonce": "abc123xyz..."
}
```

Save this nonce for the next step. Nonce expires in 5 minutes.

### 2.2 Sign Message with Wallet

Since Postman cannot sign messages, you need to sign using your browser wallet.

1. Open a website where your wallet is active (e.g., `https://app.uniswap.org`)
2. Open browser console (`F12` or `Cmd+Option+J`)
3. Connect wallet first (if not connected):
```js
await window.phantom?.ethereum?.request({ method: "eth_requestAccounts" });
```

4. Sign the SIWE message (replace `PASTE_NONCE_HERE` and `YOUR_ADDRESS`):

```js
const nonce = "PASTE_NONCE_HERE"; const addr = "YOUR_ADDRESS"; const message = "localhost wants you to sign in with your Ethereum account:\n" + addr + "\n\nSign in with Ethereum to Garant\n\nURI: http://localhost:8787\nVersion: 1\nChain ID: 1\nNonce: " + nonce + "\nIssued At: " + new Date().toISOString(); const provider = window.phantom?.ethereum || window.ethereum; const signature = await provider.request({ method: "personal_sign", params: [message, addr] }); console.log(JSON.stringify({ address: addr, message, signature }, null, 2));
```

5. Approve the signature request in your wallet popup
6. Copy the JSON output from the console

### 2.3 Verify Signature

**Request:**
- Method: `POST`
- URL: `http://localhost:8787/auth/verify`
- Headers: `Content-Type: application/json`
- Body: Paste the JSON output from step 2.2

Example:
```json
{
  "address": "0x61DCaBF828e52b948E3D3293F37383b71cDc5BF8",
  "message": "localhost wants you to sign in with your Ethereum account:\n0x61DCaBF828e52b948E3D3293F37383b71cDc5BF8\n\nSign in with Ethereum to Garant\n\nURI: http://localhost:8787\nVersion: 1\nChain ID: 1\nNonce: abc123\nIssued At: 2026-01-16T19:26:41.374Z",
  "signature": "0x1234abcd..."
}
```

**Expected Response:**
```json
{
  "ok": true,
  "token": "0x61dcabf828e52b948e3d3293f37383b71cdc5bf8:abc123",
  "address": "0x61dcabf828e52b948e3d3293f37383b71cdc5bf8"
}
```

Save the `token` for the next step.

---

## Step 3: Authenticated Request

### 3.1 Get Current User

**Request:**
- Method: `GET`
- URL: `http://localhost:8787/auth/me`
- Headers:
  - `Authorization: Bearer <token-from-verify>`

Example:
```
Authorization: Bearer 0x61dcabf828e52b948e3d3293f37383b71cdc5bf8:abc123
```

**Expected Response:**
```json
{
  "authenticated": true,
  "address": "0x61dcabf828e52b948e3d3293f37383b71cdc5bf8",
  "token": "0x61dcabf828e52b948e3d3293f37383b71cdc5bf8:abc123"
}
```

---

## Alternative: Automated Testing with Script

For automated testing without manual wallet signing, use the test script with a test private key:

```bash
./bin/test-auth
```

This uses a well-known test private key (`0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`) that maps to address `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`.

---

## Troubleshooting

### "nonce not found" Error

**Cause:** Server running with `--remote` flag or server restarted between requests.

**Fix:**
- Run `npx wrangler dev` without `--remote`
- Complete the flow within 5 minutes (nonce TTL)
- Don't restart the server between nonce and verify

### "invalid siwe message" Error

**Cause:** Malformed SIWE message, usually extra whitespace.

**Fix:**
- Use the one-liner signing code provided above
- Ensure no extra spaces at the beginning of lines in the message

### "The requested method and/or account has not been authorized" Error

**Cause:** Wallet not connected to the website.

**Fix:**
- Run `await window.phantom?.ethereum?.request({ method: "eth_requestAccounts" });` first
- Approve the connection request in your wallet

### Wallet Provider Not Found

**For Phantom:**
```js
const provider = window.phantom?.ethereum;
```

**For MetaMask:**
```js
const provider = window.ethereum;
```

**For either:**
```js
const provider = window.phantom?.ethereum || window.ethereum;
```
