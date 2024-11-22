class GoogleAccountManager {
  constructor() {
    this.init();
    this.selectedAccount = null;
  }

  init() {
    this.loadSavedAccounts();
    this.setupEventListeners();
  }

  setupEventListeners() {
    document.getElementById("loginButton").addEventListener("click", () => {
      this.getGoogleAccounts();
    });

    document.getElementById("accountSelect").addEventListener("change", (e) => {
      if (e.target.value) {
        this.selectedAccount = e.target.value;
        this.getGoogleAdsAccounts(e.target.value);
      }
    });
  }

  getGoogleAccounts() {
    chrome.identity.getAccounts((accounts) => {
      if (chrome.runtime.lastError) {
        this.showMessage("Error: " + chrome.runtime.lastError.message, "error");
        return;
      }

      if (accounts && accounts.length > 0) {
        this.updateAccountDropdown(accounts);
      } else {
        this.showMessage(
          "No Google accounts found. Please sign in to Chrome/Edge first.",
          "warning"
        );
      }
    });
  }

  updateAccountDropdown(accounts) {
    const select = document.getElementById("accountSelect");
    select.innerHTML = '<option value="">Select an account</option>';

    accounts.forEach((account) => {
      const option = document.createElement("option");
      option.value = account.email;
      option.textContent = account.email;
      select.appendChild(option);
    });

    select.style.display = "block";
  }

  getGoogleAdsAccounts(email) {
    chrome.identity.getAuthToken(
      {
        interactive: true,
        account: email,
      },
      (token) => {
        if (chrome.runtime.lastError) {
          this.showMessage(
            "Auth Error: " + chrome.runtime.lastError.message,
            "error"
          );
          return;
        }

        // First get user info
        fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
          headers: {
            Authorization: "Bearer " + token,
          },
        })
          .then((response) => response.json())
          .then((userInfo) => {
            this.showUserInfo(userInfo);

            // Then get Google Ads accounts
            return fetch(
              "https://googleads.googleapis.com/v14/customers:listAccessibleCustomers",
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
              }
            );
          })
          .then((response) => response.json())
          .then((adsAccounts) => {
            this.showAdsAccounts(adsAccounts);
            this.saveAccountData(email, token, adsAccounts);
          })
          .catch((error) => {
            this.showMessage("Error: " + error.message, "error");
          });
      }
    );
  }

  showUserInfo(userInfo) {
    const userInfoDiv = document.getElementById("userInfo");
    userInfoDiv.innerHTML = `
            <div class="user-card">
                <img src="${userInfo.picture}" alt="Profile" class="profile-img">
                <div class="user-details">
                    <h3>${userInfo.name}</h3>
                    <p>${userInfo.email}</p>
                </div>
            </div>
        `;
  }

  showAdsAccounts(adsAccounts) {
    const adsAccountsDiv = document.getElementById("adsAccounts");
    adsAccountsDiv.innerHTML = "<h3>Google Ads Accounts</h3>";

    if (adsAccounts.resourceNames && adsAccounts.resourceNames.length > 0) {
      const accountsList = document.createElement("div");
      accountsList.className = "ads-accounts-list";

      adsAccounts.resourceNames.forEach((accountId) => {
        const accountItem = document.createElement("div");
        accountItem.className = "ads-account-item";
        accountItem.innerHTML = `
                    <div class="account-id">${accountId}</div>
                    <button onclick="googleAccountManager.createMCCChild('${accountId}')">
                        Create MCC Child
                    </button>
                `;
        accountsList.appendChild(accountItem);
      });

      adsAccountsDiv.appendChild(accountsList);
    } else {
      adsAccountsDiv.innerHTML += "<p>No Google Ads accounts found</p>";
    }
  }

  createMCCChild(parentAccountId) {
    if (!this.selectedAccount) {
      this.showMessage("Please select a Google account first", "warning");
      return;
    }

    chrome.identity.getAuthToken(
      {
        interactive: true,
        account: this.selectedAccount,
      },
      (token) => {
        if (chrome.runtime.lastError) {
          this.showMessage(
            "Auth Error: " + chrome.runtime.lastError.message,
            "error"
          );
          return;
        }

        const childAccountName = prompt(
          "Enter name for new MCC child account:"
        );
        if (!childAccountName) return;

        fetch(
          `https://googleads.googleapis.com/v14/customers/${parentAccountId}:createCustomerClient`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              customerClient: {
                descriptiveName: childAccountName,
                currencyCode: "USD",
                timeZone: "America/New_York",
              },
            }),
          }
        )
          .then((response) => response.json())
          .then((data) => {
            this.showMessage(
              `Created MCC child account: ${data.resourceName}`,
              "success"
            );
            // Refresh the accounts list
            this.getGoogleAdsAccounts(this.selectedAccount);
          })
          .catch((error) => {
            this.showMessage(
              "Error creating MCC child: " + error.message,
              "error"
            );
          });
      }
    );
  }

  saveAccountData(email, token, adsAccounts) {
    chrome.storage.local.get("accounts", (result) => {
      const accounts = result.accounts || {};
      accounts[email] = {
        token: token,
        adsAccounts: adsAccounts,
        lastUpdated: new Date().toISOString(),
      };
      chrome.storage.local.set({ accounts: accounts });
    });
  }

  loadSavedAccounts() {
    chrome.storage.local.get("accounts", (result) => {
      if (result.accounts) {
        const accounts = Object.keys(result.accounts).map((email) => ({
          email,
        }));
        if (accounts.length > 0) {
          this.updateAccountDropdown(accounts);
        }
      }
    });
  }

  showMessage(message, type = "info") {
    const statusDiv = document.getElementById("status");
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    statusDiv.style.display = "block";

    setTimeout(() => {
      statusDiv.style.display = "none";
    }, 5000);
  }
}

// Initialize the manager
const googleAccountManager = new GoogleAccountManager();
