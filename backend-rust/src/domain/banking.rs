use std::fmt::{Display, Formatter};

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct BankProviderName(String);

impl BankProviderName {
    pub fn parse(value: impl AsRef<str>) -> Result<Self, String> {
        let value = value.as_ref().trim().to_lowercase();
        match value.as_str() {
            "mock" => Ok(Self(value)),
            _ => Err("unsupported banking provider".to_string()),
        }
    }
}

impl AsRef<str> for BankProviderName {
    fn as_ref(&self) -> &str {
        &self.0
    }
}

impl Display for BankProviderName {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        f.write_str(self.as_ref())
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum BankConnectionStatus {
    Pending,
    Connected,
    Error,
    Revoked,
}

impl BankConnectionStatus {
    pub fn parse(value: impl AsRef<str>) -> Result<Self, String> {
        match value.as_ref().trim().to_lowercase().as_str() {
            "pending" => Ok(Self::Pending),
            "connected" => Ok(Self::Connected),
            "error" => Ok(Self::Error),
            "revoked" => Ok(Self::Revoked),
            _ => Err("invalid bank connection status".to_string()),
        }
    }

    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Pending => "pending",
            Self::Connected => "connected",
            Self::Error => "error",
            Self::Revoked => "revoked",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum StagingTransactionStatus {
    Pending,
    Reviewed,
    Imported,
    Rejected,
}

impl StagingTransactionStatus {
    pub fn parse(value: impl AsRef<str>) -> Result<Self, String> {
        match value.as_ref().trim().to_lowercase().as_str() {
            "pending" => Ok(Self::Pending),
            "reviewed" => Ok(Self::Reviewed),
            "imported" => Ok(Self::Imported),
            "rejected" => Ok(Self::Rejected),
            _ => Err("invalid staging transaction status".to_string()),
        }
    }

    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Pending => "pending",
            Self::Reviewed => "reviewed",
            Self::Imported => "imported",
            Self::Rejected => "rejected",
        }
    }
}

#[cfg(test)]
mod tests {
    use super::{BankConnectionStatus, BankProviderName, StagingTransactionStatus};

    #[test]
    fn provider_name_accepts_mock() {
        let provider = BankProviderName::parse(" mock ").expect("expected provider to parse");
        assert_eq!(provider.as_ref(), "mock");
    }

    #[test]
    fn provider_name_rejects_unknown_provider() {
        assert!(BankProviderName::parse("stripe").is_err());
    }

    #[test]
    fn connection_status_parses_known_states() {
        assert!(matches!(
            BankConnectionStatus::parse("connected"),
            Ok(BankConnectionStatus::Connected)
        ));
        assert!(BankConnectionStatus::parse("unknown").is_err());
    }

    #[test]
    fn staging_status_parses_known_states() {
        assert!(matches!(
            StagingTransactionStatus::parse("reviewed"),
            Ok(StagingTransactionStatus::Reviewed)
        ));
        assert!(StagingTransactionStatus::parse("unknown").is_err());
    }
}
