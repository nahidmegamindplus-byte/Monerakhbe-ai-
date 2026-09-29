# 🇧🇩 MoneRakhbe AI — Bangladesh Payment Gateway Integration & Setup Guide

This guide documents the complete subscription payment architecture for **bKash**, **Nagad**, and **Rocket** in MoneRakhbe AI.

---

## 1. Architecture Overview

```
User selects Plan on Pricing / Billing
               │
               ▼
   /checkout (Server Price & Coupon Validation)
               │
               ▼
     Order Created in DB (Status: PENDING)
               │
               ▼
  Payment Provider Gateway (bKash / Nagad / Rocket)
               │
               ▼
  Callback / Webhook to Server
               │
               ▼
   Server-Side Verification & Amount Check
               │
         ┌─────┴─────┐
         ▼           ▼
   [Verified OK]   [Failed / Mismatched]
         │           │
         │           ▼
         │      Order Marked FAILED
         │      Redirect /payment/failed
         │
         ▼
   • Order Marked PAID
   • Transaction Status SUCCESS
   • Idempotency Verified (No Duplicates)
   • Subscription Activated / Renewed (+1 Month / +1 Year)
   • User.plan Updated (PRO / BUSINESS)
   • Digital Invoice Generated
   • Telegram Instant Confirmation Sent
   • Redirect /payment/success
```

---

## 2. Environment Configuration

Edit your `.env` file to configure your payment credentials:

```bash
# Payment Mode: "test" (Sandbox Simulator) or "production" (Live Gateways)
PAYMENT_MODE="test"

# bKash Tokenized Checkout API
BKASH_APP_KEY="your_bkash_app_key"
BKASH_APP_SECRET="your_bkash_app_secret"
BKASH_USERNAME="your_bkash_username"
BKASH_PASSWORD="your_bkash_password"
BKASH_BASE_URL="https://tokenized.sandbox.bka.sh/v1.2.0-beta" # Use https://tokenized.pay.bka.sh/v1.2.0-beta for Live

# Nagad Merchant API
NAGAD_MERCHANT_ID="your_nagad_merchant_id"
NAGAD_MERCHANT_NUMBER="your_nagad_merchant_number"
NAGAD_PUBLIC_KEY="your_nagad_public_key"
NAGAD_PRIVATE_KEY="your_nagad_private_key"
NAGAD_BASE_URL="https://sandbox.mynagad.com:10080/remote-payment-gateway-1.0/api/dfs"

# Rocket (DBBL) Merchant API
ROCKET_MERCHANT_ID="your_rocket_merchant_id"
ROCKET_API_KEY="your_rocket_api_key"
ROCKET_SECRET="your_rocket_secret"
ROCKET_BASE_URL="https://sandbox.rocket.com.bd/api/v1"

# Webhook Secret for Automated Verification
PAYMENT_WEBHOOK_SECRET="monerakhbe_payment_webhook_secret_2026"
```

---

## 3. How to Obtain Merchant Credentials

### A. bKash Merchant Integration
1. Apply for a **bKash Merchant Account** at [bKash Merchant Portal](https://merchant.bkash.com).
2. Request access to **bKash Tokenized Checkout API v1.2.0-beta**.
3. bKash will issue:
   - `BKASH_APP_KEY`
   - `BKASH_APP_SECRET`
   - `BKASH_USERNAME`
   - `BKASH_PASSWORD`
4. For Sandbox Testing, register on the [bKash Developer Portal](https://developer.bka.sh).

### B. Nagad Merchant Integration
1. Apply at [Nagad Merchant Portal](https://merchant.mynagad.com).
2. Generate your Merchant RSA Public/Private Key Pair.
3. Submit your Public Key to Nagad and receive:
   - `NAGAD_MERCHANT_ID`
   - `NAGAD_MERCHANT_NUMBER`
   - `NAGAD_PUBLIC_KEY` (Nagad PG Public Key)

### C. Rocket (Dutch-Bangla Bank)
1. Apply for Dutch-Bangla Bank E-Commerce Gateway merchant service.
2. Obtain your `ROCKET_MERCHANT_ID` and `ROCKET_API_KEY`.

---

## 4. Webhook & Callback URLs

Configure the following endpoints in your merchant gateway portals:

- **Callback URL**: `https://yourdomain.com/api/payments/callback`
- **Webhook URL**: `https://yourdomain.com/api/payments/webhook`

---

## 5. Testing & Verification

### Test Sandbox Checkout:
1. Set `PAYMENT_MODE="test"` in `.env`.
2. Go to `http://localhost:3000/dashboard/billing`.
3. Click **"কিনুন (Checkout)"** on the **Pro** or **Business** plan.
4. Select **bKash**, **Nagad**, or **Rocket**.
5. You will be redirected to the secure sandbox gateway:
   - Enter demo wallet number (e.g. `01712345678`)
   - Enter OTP (`123456`)
   - Enter PIN (`12345`)
6. On success:
   - The backend verifies the transaction server-side.
   - User plan is upgraded from `FREE` to `PRO` or `BUSINESS`.
   - A digital invoice is created (`/invoice/[id]`).
   - The user is redirected to `/payment/success`.

---

## 6. Security Safeguards

1. **No Client-Side Trust**: Client cannot submit arbitrary prices or mark a subscription active.
2. **Amount Verification**: Server asserts `providerAmount === orderAmount`.
3. **Idempotency Protection**: Repeated callbacks process once and do not generate duplicate activations or invoices.
4. **Audit Trails**: Every subscription grant and refund is recorded in the `audit_logs` table.
