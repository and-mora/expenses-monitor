use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
pub struct CreateWalletRequest {
    pub name: String,
}

#[derive(Serialize)]
pub struct WalletResponse {
    pub id: String,
    pub name: String,
}

#[derive(Serialize)]
pub struct WalletsResponse {
    pub wallets: Vec<WalletResponse>,
}
