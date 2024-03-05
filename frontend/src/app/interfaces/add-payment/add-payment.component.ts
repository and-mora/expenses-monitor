import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';


@Component({
  selector: 'app-add-payment',
  templateUrl: './add-payment.component.html',
  styleUrl: './add-payment.component.css',
  standalone: true,
  providers: [provideNativeDateAdapter()],
  imports: [ReactiveFormsModule, MatFormFieldModule, MatButtonModule, MatDatepickerModule, MatInputModule]
})
export class AddPaymentComponent {
  constructor(private formBuilder: FormBuilder) { }

  addPaymentForm = this.formBuilder.group({
    merchant: [''],
    amount: [''],
    category: [''],
    accountingDate: [''],
    description: ['']
  });

  onSubmit() {
    console.log("add payment form submitted!")
  }
}
