import { Component, OnInit } from '@angular/core';
import { WalletService } from '../../services/wallet.service';

@Component({
  selector: 'app-add-wallet',
  templateUrl: './add-wallet.component.html',
  styleUrls: ['./add-wallet.component.css'],
  standalone: true
})
export class AddWalletComponent implements OnInit {
  wallet = { name: '', balance: 0 };
  wallets = [];

  constructor(private walletService: WalletService) {}

  ngOnInit(): void {
    this.getWallets();
  }

  onSubmit(): void {
    this.walletService.addWallet(this.wallet).subscribe(() => {
      this.getWallets();
      this.wallet = { name: '', balance: 0 };
    });
  }

  getWallets(): void {
    this.walletService.getWallets().subscribe((data: any) => {
      this.wallets = data;
    });
  }
}
