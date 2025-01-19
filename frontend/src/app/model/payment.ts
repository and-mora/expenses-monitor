export interface PaymentDto {
    merchantName: string;
    amountInCents: number;
    category: string;
    accountingDate: string;
    description: string;
    wallet: string;
}
