
#[derive(Debug)]
pub struct PaymentDescription (String);

impl PaymentDescription {
    pub fn parse(description: String) -> Result<Self, String> {
        if description.is_empty() {
            Err("Payment description cannot be empty".to_string())
        } else if description.len() > 255 {
            Err("Payment description is too long".to_string())
        } else {
            Ok(PaymentDescription(description))
        }
    }
}

impl AsRef<str> for PaymentDescription {
    fn as_ref(&self) -> &str {
        &self.0
    }
}

#[cfg(test)]
mod tests {
    use super::PaymentDescription;
    use claims::{assert_err, assert_ok};

    #[test]
    fn valid_description_is_parsed_successfully() {
        let description = "Valid payment description".to_string();
        assert_ok!(PaymentDescription::parse(description));
    }

    #[test]
    fn empty_description_is_rejected() {
        let description = "".to_string();
        assert_err!(PaymentDescription::parse(description));
    }

    #[test]
    fn long_description_is_rejected() {
        let description = "a".repeat(256);
        assert_err!(PaymentDescription::parse(description));
    }
}