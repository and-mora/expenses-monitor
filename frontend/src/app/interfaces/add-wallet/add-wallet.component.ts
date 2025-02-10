import { NgFor, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { WalletDto } from '../../model/wallet';
import { ApiService } from '../../services/api.service';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';


@Component({
  selector: 'app-add-wallet',
  templateUrl: './add-wallet.component.html',
  styleUrls: ['./add-wallet.component.css'],
  imports: [NgIf, NgFor, ReactiveFormsModule, MatFormFieldModule, MatButtonModule, MatInputModule,
    MatCardModule, MatTableModule, MatDividerModule, MatListModule, MatIconModule]
})
export class AddWalletComponent implements OnInit {
  wallets: WalletDto[] = [];

  addWalletForm = this.formBuilder.group({
    name: ['', Validators.required],
  });

  constructor(private formBuilder: FormBuilder, private apiService: ApiService) { }

  ngOnInit(): void {
    this.loadWallets();
  }

  loadWallets(): void {
    this.apiService.getWallets().subscribe((wallets: WalletDto[]) => {
      this.wallets = wallets;
    });
  }

  onSubmit(): void {
    if (this.addWalletForm.invalid) {
      return;
    }
    const wallet: WalletDto = { id: '', name: this.addWalletForm.get('name')?.value! };
    this.apiService.addWallet(wallet).subscribe(() => {
      (newWallet: WalletDto) => this.wallets.push(newWallet);
    });
  }

  editWallet(wallet: WalletDto): void {
    // Implement the logic to edit the wallet
    console.log('Edit wallet:', wallet);
  }

  deleteWallet(wallet: WalletDto): void {
    console.log('Delete wallet:', wallet);
    // this.apiService.deleteWallet(wallet.id).subscribe(() => {
    //   this.loadWallets();
    // });
  }

  hasError(field: string, error: string) {
    return this.addWalletForm.get(field)?.hasError(error);
  }
}
