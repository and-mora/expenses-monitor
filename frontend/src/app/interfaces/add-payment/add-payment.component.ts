import { AsyncPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import { map, Observable } from 'rxjs';
import { PaymentDto } from '../../model/payment';
import { WalletDto } from '../../model/wallet';
import { ApiService } from '../../services/api.service';
import { DialogLoaderComponent } from '../dialog-loader/dialog-loader.component';

@Component({
  selector: 'app-add-payment',
  templateUrl: './add-payment.component.html',
  styleUrls: ['./add-payment.component.css'],
  providers: [provideNativeDateAdapter(),
  { provide: MAT_DATE_LOCALE, useValue: 'it-IT' }
  ],
  imports: [AsyncPipe, ReactiveFormsModule, MatFormFieldModule, MatButtonModule, MatDatepickerModule, MatInputModule, MatCardModule, MatRadioModule, MatAutocompleteModule, MatIconModule, MatStepperModule, MatProgressSpinnerModule, MatSelectModule]
})
export class AddPaymentComponent implements OnInit {
  errorMessage: string = '';
  categories: string[] = [];
  filteredCategories!: Observable<string[]>;
  wallets: WalletDto[] = [];
  isWalletLoading: boolean = false;
  isCategoriesLoading: boolean = false;

  addPaymentForm: FormGroup;
  tagsForm: FormGroup;

  constructor(private fb: FormBuilder, private apiService: ApiService, private dialog: MatDialog) {
    this.addPaymentForm = this.fb.group({
      merchantName: ['', Validators.required],
      amount: ['', [Validators.required, Validators.min(0.01)]],
      type: ['-1', Validators.required],
      category: ['', Validators.required],
      wallet: ['', Validators.required],
      accountingDate: ['', Validators.required],
      description: ['']
    });
    this.tagsForm = this.fb.group({
      tags: this.fb.array([])
    });
  }

  ngOnInit(): void {
    // retrieve categories from the backend
    this.isCategoriesLoading = true;
    this.apiService.getCategories()
      .subscribe({
        next: a => {
          this.categories.push(a);
        },
        complete: () => {
          // workaround to make it refresh the filteredCategories at component startup
          this.addPaymentForm.get('category')?.setValue('');
          this.isCategoriesLoading = false;
        }
      });
    // filter the categories to show based on what the user types in the form
    this.filteredCategories = this.addPaymentForm.get('category')!
      .valueChanges
      .pipe(
        map(value => {
          return this._filter(value || "");
        }));
    // retrieve wallets from the backend
    this.isWalletLoading = true;
    this.apiService.getWallets()
      .subscribe({
        next: a => {
          console.log("wallets", a);
          this.wallets = a;
          this.isWalletLoading = false;
        },
        complete: () => {
          // workaround to make it refresh the filteredCategories at component startup
          this.addPaymentForm.get('wallet')?.setValue('');
        }
      });
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();

    return this.categories.filter(cat => cat.toLowerCase().includes(filterValue));
  }

  private _filterWallets(value: string): string[] {
    const filterValue = value.toLowerCase();

    return this.wallets
      .map(wallet => wallet.name)
      .filter(walletName => walletName.toLowerCase().includes(filterValue))
  }

  get tags(): FormArray {
    return this.tagsForm.get('tags') as FormArray;
  }

  addTag(): void {
    this.tags.push(this.fb.group({
      key: ['', Validators.required],
      value: ['', Validators.required]
    }));
  }

  removeTag(index: number): void {
    this.tags.removeAt(index);
  }

  onSubmit(stepper: MatStepper): void {
    this.errorMessage = '';
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
        stepper.next();
        loaderDialog.close();
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
      description: this.addPaymentForm.get('description')?.getRawValue(),
      wallet: this.addPaymentForm.get('wallet')?.getRawValue(),
      tags: this.tags.getRawValue()
    };
  }

  hasError(field: string, error: string) {
    return this.addPaymentForm.get(field)?.hasError(error);
  }

}
