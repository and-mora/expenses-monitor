import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { PaymentDto } from '../../model/payment';
import { ApiService } from '../../services/api.service';


@Component({
  selector: 'app-add-payment',
  templateUrl: './add-payment.component.html',
  styleUrl: './add-payment.component.css',
  standalone: true,
  providers: [provideNativeDateAdapter()],
  imports: [ReactiveFormsModule, MatFormFieldModule, MatButtonModule, MatDatepickerModule, MatInputModule]
})
export class AddPaymentComponent {
  constructor(private formBuilder: FormBuilder, private apiService: ApiService) { }

  addPaymentForm = this.formBuilder.group({
    merchantName: [''],
    amount: [''],
    category: [''],
    accountingDate: [''],
    description: ['']
  });

  onSubmit() {
    console.log("add payment form submitted!", this.addPaymentForm.value as PaymentDto);
    // convert euro in cents as required by backend api
    const paymentDto = this.formToPaymentDto();
    console.log('paymentDto', paymentDto);
    // this.apiService.addPayment(paymentDto).subscribe({
    //   next: response => {
    //     console.log("pagamento correttamente inserito", response);
    //     this.addPaymentForm.reset();
    //   },
    //   error: () => {
    //     console.log("errore nell'inserimento di un pagamento");
    //   }
    // });
  }

  formToPaymentDto(): PaymentDto {
    return {
      merchantName: this.addPaymentForm.get('merchantName')?.getRawValue(),
      amountInCents: this.addPaymentForm.get('amount')?.getRawValue() * 100,
      category: this.addPaymentForm.get('category')?.getRawValue(),
      accountingDate: this.addPaymentForm.get('accountingDate')?.getRawValue(),
      description: this.addPaymentForm.get('description')?.getRawValue()
    };
  }
}
