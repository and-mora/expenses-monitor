import { TagDto } from "./tag";

export interface PaymentDto {
    merchantName: string;
    amountInCents: number;
    category: string;
    accountingDate: string;
    description: string;
    wallet: string;
    tags: TagDto[];
}
