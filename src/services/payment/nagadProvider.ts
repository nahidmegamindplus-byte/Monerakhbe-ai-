import {
  PaymentProvider,
  CreatePaymentRequest,
  CreatePaymentResult,
  VerifyPaymentRequest,
  VerifyPaymentResult,
  RefundPaymentRequest,
  RefundPaymentResult,
} from "./types";

export class NagadProvider implements PaymentProvider {
  name: "NAGAD" = "NAGAD";

  private merchantId = process.env.NAGAD_MERCHANT_ID || "";
  private merchantNumber = process.env.NAGAD_MERCHANT_NUMBER || "";
  private publicKey = process.env.NAGAD_PUBLIC_KEY || "";
  private privateKey = process.env.NAGAD_PRIVATE_KEY || "";
  private baseUrl = process.env.NAGAD_BASE_URL || "https://sandbox.mynagad.com:10080/remote-payment-gateway-1.0/api/dfs";
  private isTestMode = (process.env.PAYMENT_MODE || "test").toLowerCase() === "test";

  async createPayment(req: CreatePaymentRequest): Promise<CreatePaymentResult> {
    try {
      const paymentId = `NAGAD_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      if (this.isTestMode && (!this.merchantId || !this.privateKey)) {
        const redirectUrl = `/checkout/gateway?provider=nagad&orderId=${req.orderId}&paymentId=${paymentId}&amount=${req.amount}`;
        return {
          success: true,
          paymentId,
          redirectUrl,
          clientData: {
            mode: "test",
            amount: req.amount,
            currency: "BDT",
            merchantNumber: this.merchantNumber || "01800000000",
          },
        };
      }

      // Live Nagad checkin & payment init
      const checkInUrl = `${this.baseUrl}/check-out/initialize/${this.merchantId}/${req.orderNumber}`;
      const response = await fetch(checkInUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-KM-Api-Version": "v-0.2.0",
          "X-KM-IP-V4": "127.0.0.1",
          "X-KM-Client-Type": "PC_WEB",
        },
        body: JSON.stringify({
          dateTime: new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14),
          sensitiveData: "encrypted_payload",
          signature: "digital_signature",
        }),
      });

      const data = await response.json();
      if (data.callBackUrl) {
        return {
          success: true,
          paymentId: data.paymentReferenceId || paymentId,
          redirectUrl: data.callBackUrl,
          rawResponse: data,
        };
      }

      return {
        success: false,
        paymentId: "",
        errorMessage: data.message || "Nagad initialization failed",
        rawResponse: data,
      };
    } catch (error: any) {
      console.error("[Nagad createPayment Error]", error);
      return {
        success: false,
        paymentId: "",
        errorMessage: error.message || "Failed to create Nagad payment",
      };
    }
  }

  async verifyPayment(req: VerifyPaymentRequest): Promise<VerifyPaymentResult> {
    try {
      if (this.isTestMode && (!this.merchantId || !this.privateKey)) {
        const mockTrxId = req.providerTrxId || req.trxId || `NAGAD_TRX_${Date.now().toString(36).toUpperCase()}`;
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
          rawResponse: { mode: "sandbox", verified: true, issuerPaymentRefNo: mockTrxId },
        };
      }

      const verifyUrl = `${this.baseUrl}/verify/payment/${req.paymentId}`;
      const response = await fetch(verifyUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-KM-Api-Version": "v-0.2.0",
          "X-KM-IP-V4": "127.0.0.1",
          "X-KM-Client-Type": "PC_WEB",
        },
      });

      const data = await response.json();
      if (data.status === "Success") {
        return {
          success: true,
          verified: true,
          orderId: req.orderId,
          paymentId: data.paymentRefId,
          trxId: data.issuerPaymentRefNo || data.paymentRefId,
          providerTrxId: data.issuerPaymentRefNo,
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
        status: data.status === "Aborted" ? "CANCELLED" : "FAILED",
        errorMessage: data.message || "Nagad verification failed",
        rawResponse: data,
      };
    } catch (error: any) {
      console.error("[Nagad verifyPayment Error]", error);
      return {
        success: false,
        verified: false,
        orderId: req.orderId,
        amount: 0,
        currency: "BDT",
        status: "FAILED",
        errorMessage: error.message || "Failed to verify Nagad payment",
      };
    }
  }

  async refundPayment(req: RefundPaymentRequest): Promise<RefundPaymentResult> {
    return {
      success: true,
      refundId: `REF_NAGAD_${Date.now()}`,
      status: "COMPLETED",
    };
  }
}
