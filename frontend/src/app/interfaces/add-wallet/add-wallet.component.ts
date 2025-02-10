import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { Observable } from 'rxjs';
import { WalletDto } from '../../model/wallet';
import { ApiService } from '../../services/api.service';
import { DialogLoaderComponent } from '../dialog-loader/dialog-loader.component';


@Component({
  selector: 'app-add-wallet',
  templateUrl: './add-wallet.component.html',
  styleUrls: ['./add-wallet.component.css'],
  imports: [AsyncPipe, NgIf, NgFor, ReactiveFormsModule, MatFormFieldModule, MatButtonModule, MatInputModule,
    MatCardModule, MatTableModule, MatDividerModule, MatListModule, MatIconModule]
})
export class AddWalletComponent implements OnInit {
  wallets: Observable<WalletDto[]> = new Observable<WalletDto[]>();
  errorMessage: string = '';
  errorMessageWalletList: string = '';

  addWalletForm = this.formBuilder.group({
    name: ['', Validators.required],
  });

  constructor(private formBuilder: FormBuilder, private apiService: ApiService, private dialog: MatDialog,
    private snackBar: MatSnackBar) { }

  ngOnInit(): void {
    this.loadWallets();
  }

  loadWallets(): void {
    this.wallets = this.apiService.getWallets();
  }

  onSubmit(): void {
    if (this.addWalletForm.invalid) {
      return;
    }

    // loader dialog
    const loaderDialog = this.dialog.open(DialogLoaderComponent, {
      disableClose: true,
      panelClass: 'transparent-dialog'
    });

    const wallet: WalletDto = { id: '', name: this.addWalletForm.get('name')?.value! };
    this.apiService.addWallet(wallet).subscribe({
      next: () => {
        this.resetForm();
        loaderDialog.close();
        this.loadWallets();

        this.snackBar.open('Pagamento inserito con successo.', undefined, {
          duration: 1500
        });
      },
      error: () => {
        this.errorMessage = "Error in inserting a wallet.";
        loaderDialog.close();
      }
    });
  }

  editWallet(wallet: WalletDto): void {
    // Implement the logic to edit the wallet
    console.log('Edit wallet:', wallet);
  }

  deleteWallet(wallet: WalletDto): void {
    console.log('Delete wallet:', wallet);
    this.apiService.deleteWallet(wallet.id).subscribe({
      next: () => {
        this.snackBar.open('Wallet cancellato con successo.', undefined, {
          duration: 1500
        });
        this.loadWallets();
      },
      error: () => {
        this.errorMessageWalletList = "Error in deleting a wallet.";
        
      }
    });
  }

  hasError(field: string, error: string) {
    return this.addWalletForm.get(field)?.hasError(error);
  }

  private resetForm(): void {
    this.errorMessage = '';
    this.addWalletForm.reset();
    this.addWalletForm.get('name')?.clearValidators();
    this.addWalletForm.get('name')?.setValue('');
  }
}
