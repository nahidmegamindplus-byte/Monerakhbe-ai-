export type PaymentMethod = "bkash" | "nagad" | "rocket";
export type PaymentProviderType = "BKASH" | "NAGAD" | "ROCKET";

export type OrderStatus =
  | "PENDING"
  | "PROCESSING"
  | "PAID"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED"
  | "EXPIRED";

export type TransactionStatus =
  | "PENDING"
  | "SUCCESS"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED";

export interface CreatePaymentRequest {
  orderId: string;
  orderNumber: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  callbackUrl: string;
  webhookUrl: string;
}

export interface CreatePaymentResult {
  success: boolean;
  paymentId: string;
  redirectUrl?: string;
  clientData?: Record<string, any>;
  errorMessage?: string;
  rawResponse?: any;
}

export interface VerifyPaymentRequest {
  orderId: string;
  paymentId?: string;
  trxId?: string;
  providerTrxId?: string;
  rawCallback?: any;
}

export interface VerifyPaymentResult {
  success: boolean;
  verified: boolean;
  orderId: string;
  paymentId?: string;
  trxId?: string;
  providerTrxId?: string;
  amount: number;
  currency: string;
  status: "PAID" | "FAILED" | "CANCELLED";
  errorMessage?: string;
  rawResponse?: any;
}

export interface RefundPaymentRequest {
  orderId: string;
  transactionId: string;
  amount: number;
  reason: string;
}

export interface RefundPaymentResult {
  success: boolean;
  refundId?: string;
  status: string;
  errorMessage?: string;
}

export interface PaymentProvider {
  name: PaymentProviderType;
  createPayment(req: CreatePaymentRequest): Promise<CreatePaymentResult>;
  verifyPayment(req: VerifyPaymentRequest): Promise<VerifyPaymentResult>;
  refundPayment(req: RefundPaymentRequest): Promise<RefundPaymentResult>;
}
