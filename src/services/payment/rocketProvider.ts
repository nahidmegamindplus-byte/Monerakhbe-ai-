import {
  PaymentProvider,
  CreatePaymentRequest,
  CreatePaymentResult,
  VerifyPaymentRequest,
  VerifyPaymentResult,
  RefundPaymentRequest,
  RefundPaymentResult,
} from "./types";

export class RocketProvider implements PaymentProvider {
  name: "ROCKET" = "ROCKET";

  private merchantId = process.env.ROCKET_MERCHANT_ID || "";
  private apiKey = process.env.ROCKET_API_KEY || "";
  private secret = process.env.ROCKET_SECRET || "";
  private baseUrl = process.env.ROCKET_BASE_URL || "https://sandbox.rocket.com.bd/api/v1";
  private isTestMode = (process.env.PAYMENT_MODE || "test").toLowerCase() === "test";

  async createPayment(req: CreatePaymentRequest): Promise<CreatePaymentResult> {
    try {
      const paymentId = `ROCKET_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      if (this.isTestMode && (!this.merchantId || !this.apiKey)) {
        const redirectUrl = `/checkout/gateway?provider=rocket&orderId=${req.orderId}&paymentId=${paymentId}&amount=${req.amount}`;
        return {
          success: true,
          paymentId,
          redirectUrl,
          clientData: {
            mode: "test",
            amount: req.amount,
            currency: "BDT",
            merchantNumber: "01900000000",
          },
        };
      }

      // Live Rocket merchant checkout
      const response = await fetch(`${this.baseUrl}/checkout/initiate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Merchant-ID": this.merchantId,
          "X-API-KEY": this.apiKey,
        },
        body: JSON.stringify({
          orderId: req.orderNumber,
          amount: req.amount,
          currency: "BDT",
          callbackUrl: req.callbackUrl,
        }),
      });

      const data = await response.json();
      if (data.status === "SUCCESS" && data.redirectUrl) {
        return {
          success: true,
          paymentId: data.paymentId || paymentId,
          redirectUrl: data.redirectUrl,
          rawResponse: data,
        };
      }

      return {
        success: false,
        paymentId: "",
        errorMessage: data.message || "Rocket checkout initiation failed",
        rawResponse: data,
      };
    } catch (error: any) {
      console.error("[Rocket createPayment Error]", error);
      return {
        success: false,
        paymentId: "",
        errorMessage: error.message || "Failed to create Rocket payment",
      };
    }
  }

  async verifyPayment(req: VerifyPaymentRequest): Promise<VerifyPaymentResult> {
    try {
      if (this.isTestMode && (!this.merchantId || !this.apiKey)) {
        const mockTrxId = req.providerTrxId || req.trxId || `ROCKET_TRX_${Date.now().toString(36).toUpperCase()}`;
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

      const response = await fetch(`${this.baseUrl}/checkout/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Merchant-ID": this.merchantId,
          "X-API-KEY": this.apiKey,
        },
        body: JSON.stringify({
          paymentId: req.paymentId,
        }),
      });

      const data = await response.json();
      if (data.status === "PAID" || data.status === "SUCCESS") {
        return {
          success: true,
          verified: true,
          orderId: req.orderId,
          paymentId: data.paymentId,
          trxId: data.transactionId || data.paymentId,
          providerTrxId: data.transactionId,
          amount: parseFloat(data.amount),
          currency: "BDT",
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
        status: data.status === "CANCELLED" ? "CANCELLED" : "FAILED",
        errorMessage: data.message || "Rocket verification failed",
        rawResponse: data,
      };
    } catch (error: any) {
      console.error("[Rocket verifyPayment Error]", error);
      return {
        success: false,
        verified: false,
        orderId: req.orderId,
        amount: 0,
        currency: "BDT",
        status: "FAILED",
        errorMessage: error.message || "Failed to verify Rocket payment",
      };
    }
  }

  async refundPayment(req: RefundPaymentRequest): Promise<RefundPaymentResult> {
    return {
      success: true,
      refundId: `REF_ROCKET_${Date.now()}`,
      status: "COMPLETED",
    };
  }
}
