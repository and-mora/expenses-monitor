#[derive(Debug)]
pub struct PaymentMerchant(String);

impl PaymentMerchant {
    pub fn parse(merchant_name: String) -> Result<Self, String> {
        if merchant_name.is_empty() {
            Err("Merchant name cannot be empty".to_string())
        } else if merchant_name.len() > 255 {
            Err("Merchant name is too long".to_string())
        } else {
            Ok(PaymentMerchant(merchant_name))
        }
    }
}

impl AsRef<str> for PaymentMerchant {
    fn as_ref(&self) -> &str {
        &self.0
    }
}

#[cfg(test)]
mod tests {
    use super::PaymentMerchant;
    use claims::{assert_err, assert_ok};

    #[test]
    fn valid_merchant_name_is_parsed_successfully() {
        let merchant_name = "Valid Merchant".to_string();
        assert_ok!(PaymentMerchant::parse(merchant_name));
    }

    #[test]
    fn empty_merchant_name_is_rejected() {
        let merchant_name = "".to_string();
        assert_err!(PaymentMerchant::parse(merchant_name));
    }

    #[test]
    fn long_merchant_name_is_rejected() {
        let merchant_name = "a".repeat(256);
        assert_err!(PaymentMerchant::parse(merchant_name));
    }
}