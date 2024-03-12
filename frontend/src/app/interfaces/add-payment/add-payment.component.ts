import { NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { PaymentDto } from '../../model/payment';
import { ApiService } from '../../services/api.service';
import { DialogLoaderComponent } from '../dialog-loader/dialog-loader.component';

@Component({
  selector: 'app-add-payment',
  templateUrl: './add-payment.component.html',
  styleUrl: './add-payment.component.css',
  standalone: true,
  providers: [provideNativeDateAdapter(),
  { provide: MAT_DATE_LOCALE, useValue: 'it-IT' }
  ],
  imports: [NgIf, ReactiveFormsModule, MatFormFieldModule, MatButtonModule, MatDatepickerModule, MatInputModule,
    MatCardModule, MatRadioModule, DialogLoaderComponent]
})
export class AddPaymentComponent {
  constructor(private formBuilder: FormBuilder, private apiService: ApiService, private dialog: MatDialog) { }

  addPaymentForm = this.formBuilder.group({
    merchantName: ['', Validators.required],
    amount: ['', [Validators.required, Validators.min(0)]],
    type: ['-1', Validators.required],
    category: ['', Validators.required],
    accountingDate: [new Date(), Validators.required],
    description: ['']
  });

  onSubmit() {
    console.log("add payment form submitted!", this.addPaymentForm.value);

    // loader dialog
    const dialogRef = this.dialog.open(DialogLoaderComponent, {
      disableClose: true,
      panelClass: 'transparent-dialog'
    });

    // api call
    const paymentDto = this.formToPaymentDto();
    this.apiService.addPayment(paymentDto).subscribe({
      next: response => {
        console.log("payment added.", response);
        this.resetForm();
        dialogRef.close();
      },
      error: () => {
        console.log("error in inserting a payment");
      }
    });
  }

  formToPaymentDto(): PaymentDto {
    // convert euro in cents as required by backend api
    // set hour to avoid date shifting due to UTC conversion
    let fixedDate = new Date(this.addPaymentForm.get('accountingDate')?.getRawValue());
    fixedDate.setHours(6);
    return {
      merchantName: this.addPaymentForm.get('merchantName')?.getRawValue(),
      amountInCents: Number((this.addPaymentForm.get('amount')?.getRawValue() * 100 * this.addPaymentForm.get('type')?.getRawValue()).toFixed(0)),
      category: this.addPaymentForm.get('category')?.getRawValue(),
      accountingDate: fixedDate.toISOString(),
      description: this.addPaymentForm.get('description')?.getRawValue()
    };
  }

  hasError(field: string, error: string) {
    return this.addPaymentForm.get(field)?.hasError(error);
  }

  resetForm() {
    // form.reset() does not work as expected
    this.addPaymentForm.get('amount')?.reset();
    this.addPaymentForm.get('amount')?.clearValidators();
    this.addPaymentForm.get('amount')?.setValue('');
    this.addPaymentForm.get('category')?.reset();
    this.addPaymentForm.get('category')?.clearValidators();
    this.addPaymentForm.get('category')?.setValue('');
    this.addPaymentForm.get('merchantName')?.reset();
    this.addPaymentForm.get('merchantName')?.clearValidators();
    this.addPaymentForm.get('merchantName')?.setValue('');
  }
}
