import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { PaymentDto } from '../../model/payment';
import { ApiService } from '../../services/api.service';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';

@Component({
  selector: 'app-add-payment',
  templateUrl: './add-payment.component.html',
  styleUrl: './add-payment.component.css',
  standalone: true,
  providers: [provideNativeDateAdapter(),
  { provide: MAT_DATE_LOCALE, useValue: 'it-IT' }
],
  imports: [ReactiveFormsModule, MatFormFieldModule, MatButtonModule, MatDatepickerModule, MatInputModule]
})
export class AddPaymentComponent {
  constructor(private formBuilder: FormBuilder, private apiService: ApiService) { }

  addPaymentForm = this.formBuilder.group({
    merchantName: ['', Validators.required],
    amount: ['', Validators.required],
    category: ['', Validators.required],
    accountingDate: [new Date(), Validators.required],
    description: ['']
  });

  onSubmit() {
    console.log("add payment form submitted!", this.addPaymentForm.value);
    // convert euro in cents as required by backend api
    const paymentDto = this.formToPaymentDto();
    this.apiService.addPayment(paymentDto).subscribe({
      next: response => {
        console.log("payment added.", response);
        this.addPaymentForm.reset();
      },
      error: () => {
        console.log("error in inserting a payment");
      }
    });
  }

  formToPaymentDto(): PaymentDto {
    // set hour to avoid date shifting due to UTC conversion
    let fixedDate = new Date(this.addPaymentForm.get('accountingDate')?.getRawValue());
    fixedDate.setHours(6);
    return {
      merchantName: this.addPaymentForm.get('merchantName')?.getRawValue(),
      amountInCents: Number((this.addPaymentForm.get('amount')?.getRawValue() * 100).toFixed(0)),
      category: this.addPaymentForm.get('category')?.getRawValue(),
      accountingDate: fixedDate.toISOString(),
      description: this.addPaymentForm.get('description')?.getRawValue()
    };
  }
}
