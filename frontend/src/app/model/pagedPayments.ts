import { PaymentDto } from "./payment";

export interface PagedPayments {
    content: PaymentDto[];
    size: number;
    page: number;
}
