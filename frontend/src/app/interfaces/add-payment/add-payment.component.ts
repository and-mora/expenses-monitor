import { AsyncPipe, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, map } from 'rxjs';
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
  imports: [AsyncPipe, NgIf, ReactiveFormsModule, MatFormFieldModule, MatButtonModule, MatDatepickerModule, MatInputModule,
    MatCardModule, MatRadioModule, MatAutocompleteModule]
})
export class AddPaymentComponent implements OnInit {
  errorMessage: string = '';
  categories: string[] = [];
  filteredCategories!: Observable<string[]>;

  addPaymentForm = this.formBuilder.group({
    merchantName: ['', Validators.required],
    amount: ['', [Validators.required, Validators.min(0)]],
    type: ['-1', Validators.required],
    category: ['', Validators.required],
    accountingDate: [new Date(), Validators.required],
    description: ['']
  });

  constructor(private formBuilder: FormBuilder, private apiService: ApiService, private dialog: MatDialog,
    private snackBar: MatSnackBar) { }

  ngOnInit(): void {
    // retrieve categories from the backend
    this.apiService.getCategories()
      .subscribe({
        next: a => {
          this.categories.push(a);
        },
        complete: () => {
          // workaround to make it refresh the filteredCategories at component startup
          this.addPaymentForm.get('category')?.setValue('');
        }
      });
    // filter the categories to show based on what the user types in the form
    this.filteredCategories = this.addPaymentForm.get('category')!
      .valueChanges
      .pipe(
        map(value => {
          return this._filter(value || "");
        }));
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();

    return this.categories.filter(cat => cat.toLowerCase().includes(filterValue));
  }

  onSubmit(): void {
    console.log("add payment form submitted!", this.addPaymentForm.value);

    // loader dialog
    const loaderDialog = this.dialog.open(DialogLoaderComponent, {
      disableClose: true,
      panelClass: 'transparent-dialog'
    });

    // api call
    const paymentDto = this.formToPaymentDto();
    this.apiService.addPayment(paymentDto).subscribe({
      next: response => {
        console.log("payment added.", response);
        this.resetForm();
        loaderDialog.close();

        this.snackBar.open('Pagamento inserito con successo.', undefined, {
          duration: 1500
        });
      },
      error: () => {
        this.errorMessage = "Error in inserting a payment.";
        loaderDialog.close();
      }
    });
  }

  formToPaymentDto(): PaymentDto {
    // set hour to avoid date shifting due to UTC conversion
    let fixedDate = new Date(this.addPaymentForm.get('accountingDate')?.getRawValue());
    fixedDate.setHours(6);

    const parsedMerchant: string = this.addPaymentForm.get('merchantName')!.value!.trim();
    // convert euro in cents as required by backend api
    const parsedAmount: number = Number((this.addPaymentForm.get('amount')?.getRawValue() * 100 * this.addPaymentForm.get('type')?.getRawValue()).toFixed(0));
    // category must be lower case
    const parsedCategory: string = this.addPaymentForm.get('category')!.value!.trim().toLowerCase();
    return {
      merchantName: parsedMerchant,
      amountInCents: parsedAmount,
      category: parsedCategory,
      accountingDate: fixedDate.toISOString(),
      description: this.addPaymentForm.get('description')?.getRawValue()
    };
  }

  hasError(field: string, error: string) {
    return this.addPaymentForm.get(field)?.hasError(error);
  }

  resetForm(): void {
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
    this.addPaymentForm.get('description')?.setValue('');
  }
}
