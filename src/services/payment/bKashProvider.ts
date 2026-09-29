import {
  PaymentProvider,
  CreatePaymentRequest,
  CreatePaymentResult,
  VerifyPaymentRequest,
  VerifyPaymentResult,
  RefundPaymentRequest,
  RefundPaymentResult,
} from "./types";

export class BKashProvider implements PaymentProvider {
  name: "BKASH" = "BKASH";

  private appKey = process.env.BKASH_APP_KEY || "";
  private appSecret = process.env.BKASH_APP_SECRET || "";
  private username = process.env.BKASH_USERNAME || "";
  private password = process.env.BKASH_PASSWORD || "";
  private baseUrl = process.env.BKASH_BASE_URL || "https://tokenized.sandbox.bka.sh/v1.2.0-beta";
  private isTestMode = (process.env.PAYMENT_MODE || "test").toLowerCase() === "test";

  private async getAuthToken(): Promise<string | null> {
    if (this.isTestMode && (!this.appKey || !this.username)) {
      return "mock_bkash_sandbox_token_" + Date.now();
    }

    try {
      const response = await fetch(`${this.baseUrl}/tokenized/checkout/token/grant`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          username: this.username,
          password: this.password,
        },
        body: JSON.stringify({
          app_key: this.appKey,
          app_secret: this.appSecret,
        }),
      });

      const data = await response.json();
      return data.id_token || null;
    } catch (error) {
      console.error("[bKash getAuthToken Error]", error);
      return null;
    }
  }

  async createPayment(req: CreatePaymentRequest): Promise<CreatePaymentResult> {
    try {
      const paymentId = `BKASH_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      // In test mode or when no live merchant keys are set, provide secure interactive sandbox simulator
      if (this.isTestMode && (!this.appKey || !this.username)) {
        const redirectUrl = `/checkout/gateway?provider=bkash&orderId=${req.orderId}&paymentId=${paymentId}&amount=${req.amount}`;
        return {
          success: true,
          paymentId,
          redirectUrl,
          clientData: {
            mode: "test",
            amount: req.amount,
            currency: "BDT",
            merchantNumber: "01700000000",
          },
        };
      }

      const token = await this.getAuthToken();
      if (!token) {
        throw new Error("bKash token authorization failed");
      }

      const response = await fetch(`${this.baseUrl}/tokenized/checkout/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          authorization: token,
          "x-app-key": this.appKey,
        },
        body: JSON.stringify({
          mode: "0011",
          payerReference: req.customerPhone || "01700000000",
          callbackURL: req.callbackUrl,
          amount: req.amount.toFixed(2),
          currency: "BDT",
          intent: "sale",
          merchantInvoiceNumber: req.orderNumber,
        }),
      });

      const data = await response.json();
      if (data.statusCode === "0000" && data.bkashURL) {
        return {
          success: true,
          paymentId: data.paymentID,
          redirectUrl: data.bkashURL,
          rawResponse: data,
        };
      }

      return {
        success: false,
        paymentId: "",
        errorMessage: data.statusMessage || "bKash payment initiation failed",
        rawResponse: data,
      };
    } catch (error: any) {
      console.error("[bKash createPayment Error]", error);
      return {
        success: false,
        paymentId: "",
        errorMessage: error.message || "Failed to create bKash payment",
      };
    }
  }

  async verifyPayment(req: VerifyPaymentRequest): Promise<VerifyPaymentResult> {
    try {
      // In sandbox mode with mock transactions
      if (this.isTestMode && (!this.appKey || !this.username)) {
        const mockTrxId = req.providerTrxId || req.trxId || `BKASH_TRX_${Date.now().toString(36).toUpperCase()}`;
        return {
          success: true,
          verified: true,
          orderId: req.orderId,
          paymentId: req.paymentId,
          trxId: mockTrxId,
          providerTrxId: mockTrxId,
          amount: (req.rawCallback && req.rawCallback.amount) ? parseFloat(req.rawCallback.amount) : 0,
          currency: "BDT",
          status: "PAID",
          rawResponse: { mode: "sandbox", verified: true, trxID: mockTrxId },
        };
      }

      const token = await this.getAuthToken();
      if (!token) {
        return {
          success: false,
          verified: false,
          orderId: req.orderId,
          amount: 0,
          currency: "BDT",
          status: "FAILED",
          errorMessage: "Failed to authenticate with bKash server",
        };
      }

      // Execute/Verify payment
      const response = await fetch(`${this.baseUrl}/tokenized/checkout/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          authorization: token,
          "x-app-key": this.appKey,
        },
        body: JSON.stringify({
          paymentID: req.paymentId,
        }),
      });

      const data = await response.json();
      if (data.statusCode === "0000" && data.transactionStatus === "Completed") {
        return {
          success: true,
          verified: true,
          orderId: req.orderId,
          paymentId: data.paymentID,
          trxId: data.trxID,
          providerTrxId: data.trxID,
          amount: parseFloat(data.amount),
          currency: data.currency || "BDT",
          status: "PAID",
          rawResponse: data,
        };
      }

      return {
        success: false,
        verified: false,
        orderId: req.orderId,
        paymentId: req.paymentId,
        amount: 0,
        currency: "BDT",
        status: data.statusCode === "0100" ? "CANCELLED" : "FAILED",
        errorMessage: data.statusMessage || "bKash verification failed",
        rawResponse: data,
      };
    } catch (error: any) {
      console.error("[bKash verifyPayment Error]", error);
      return {
        success: false,
        verified: false,
        orderId: req.orderId,
        amount: 0,
        currency: "BDT",
        status: "FAILED",
        errorMessage: error.message || "Failed to verify bKash payment",
      };
    }
  }

  async refundPayment(req: RefundPaymentRequest): Promise<RefundPaymentResult> {
    try {
      if (this.isTestMode && (!this.appKey || !this.username)) {
        return {
          success: true,
          refundId: `REF_BKASH_${Date.now()}`,
          status: "COMPLETED",
        };
      }

      const token = await this.getAuthToken();
      if (!token) throw new Error("bKash auth token failed");

      const response = await fetch(`${this.baseUrl}/tokenized/checkout/payment/refund`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          authorization: token,
          "x-app-key": this.appKey,
        },
        body: JSON.stringify({
          paymentID: req.transactionId,
          amount: req.amount.toFixed(2),
          trxID: req.transactionId,
          sku: "subscription",
          reason: req.reason,
        }),
      });

      const data = await response.json();
      if (data.statusCode === "0000") {
        return {
          success: true,
          refundId: data.refundTrxID,
          status: "COMPLETED",
        };
      }

      return {
        success: false,
        status: "FAILED",
        errorMessage: data.statusMessage || "bKash refund failed",
      };
    } catch (error: any) {
      return {
        success: false,
        status: "FAILED",
        errorMessage: error.message || "bKash refund exception",
      };
    }
  }
}
