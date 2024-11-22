<template>
  <div class="app-container">
    <header class="header">
      <h1>Google Accounts Manager</h1>
    </header>

    <main class="main-content">
      <div class="account-section">
        <div class="select-container">
          <label for="accountSelect">Select Google Account:</label>
          <select
            id="accountSelect"
            v-model="selectedAccount"
            @change="handleAccountSelect"
            :disabled="loading"
          >
            <option value="">Choose an account</option>
            <option
              v-for="account in accounts"
              :key="account.id"
              :value="account.email"
            >
              {{ account.email }}
            </option>
          </select>
        </div>

        <button
          @click="addNewAccount"
          class="add-account-btn"
          :disabled="loading"
        >
          Add Account
        </button>

        <button @click="loadAccounts" class="refresh-btn" :disabled="loading">
          Refresh Accounts
        </button>
      </div>

      <!-- Loading Indicator -->
      <div v-if="loading" class="loading">Loading...</div>

      <!-- Enhanced Error Message -->
      <div v-if="error" class="error-message">
        <div class="error-title">Error:</div>
        <div class="error-details">{{ error }}</div>
        <button @click="error = null" class="error-close">×</button>
      </div>

      <!-- Selected Account Info -->
      <div v-if="selectedAccountInfo" class="account-info">
        <h2>Account Information</h2>
        <div class="info-card">
          <img
            :src="selectedAccountInfo.picture"
            alt="Profile"
            class="profile-img"
          />
          <div class="info-details">
            <p><strong>Name:</strong> {{ selectedAccountInfo.name }}</p>
            <p><strong>Email:</strong> {{ selectedAccountInfo.email }}</p>
          </div>
        </div>
      </div>

      <!-- Google Ads Accounts -->
      <div v-if="adsAccounts.length" class="ads-accounts">
        <h2>Google Ads Accounts</h2>
        <div class="ads-grid">
          <div
            v-for="account in adsAccounts"
            :key="account.id"
            class="ads-card"
            :class="{ error: account.error }"
          >
            <div class="ads-name">{{ account.name }}</div>
            <div class="ads-id">ID: {{ account.id }}</div>
            <div v-if="account.currencyCode" class="ads-details">
              Currency: {{ account.currencyCode }}
            </div>
            <div v-if="account.timeZone" class="ads-details">
              Time Zone: {{ account.timeZone }}
            </div>
          </div>
        </div>
      </div>

      <!-- MCC Account Selection (if exists) -->
      <div v-if="hasMCC" class="mcc-section">
        <h3>Google Ads Manager Accounts</h3>
        <select
          v-model="selectedMCCAccount"
          @change="handleMCCSelect"
          class="mcc-select"
        >
          <option value="">Select Manager Account</option>
          <option
            v-for="mcc in mccAccounts"
            :key="mcc.customerId"
            :value="mcc.customerId"
          >
            {{ mcc.descriptiveName }} ({{ mcc.customerId }})
          </option>
        </select>

        <!-- Child Accounts List -->
        <div v-if="childAccounts.length" class="child-accounts">
          <h4>Managed Accounts</h4>
          <div class="accounts-grid">
            <div
              v-for="account in childAccounts"
              :key="account.customerId"
              class="account-card"
            >
              <div class="account-name">{{ account.descriptiveName }}</div>
              <div class="account-id">ID: {{ account.customerId }}</div>
              <div class="account-status">Status: {{ account.status }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- No MCC Message -->
      <div v-else-if="selectedAccount && !loading" class="no-mcc">
        This Google account does not have access to any Google Ads Manager
        Accounts.
      </div>

      <!-- Add developer token input section -->
      <div class="developer-token-section">
        <div class="token-input-container">
          <label for="developerToken">Google Ads Developer Token:</label>
          <div class="token-input-wrapper">
            <input
              type="password"
              id="developerToken"
              v-model="developerToken"
              placeholder="Enter your developer token"
              :disabled="loading"
            />
            <button
              @click="toggleTokenVisibility"
              class="toggle-visibility-btn"
              type="button"
            >
              {{ showToken ? "👁️" : "👁️‍🗨️" }}
            </button>
          </div>
          <button
            @click="saveDeveloperToken"
            class="save-token-btn"
            :disabled="!developerToken || loading"
          >
            Save Token
          </button>
        </div>
      </div>

      <!-- Create MCC Form -->
      <div v-if="selectedAccount" class="mcc-creation-form">
        <h3>Create New MCC Account</h3>
        <div class="form-group">
          <label for="mccName">MCC Name:</label>
          <input
            id="mccName"
            v-model="newMCC.name"
            type="text"
            placeholder="Enter MCC account name"
          />
        </div>

        <div class="form-group">
          <label for="mccCurrency">Currency:</label>
          <select id="mccCurrency" v-model="newMCC.currencyCode">
            <option value="USD">USD - US Dollar</option>
            <option value="EUR">EUR - Euro</option>
            <option value="GBP">GBP - British Pound</option>
            <!-- Add more currencies as needed -->
          </select>
        </div>

        <div class="form-group">
          <label for="mccTimeZone">Time Zone:</label>
          <select id="mccTimeZone" v-model="newMCC.timeZone">
            <option value="America/New_York">Eastern Time</option>
            <option value="America/Chicago">Central Time</option>
            <option value="America/Denver">Mountain Time</option>
            <option value="America/Los_Angeles">Pacific Time</option>
            <!-- Add more time zones as needed -->
          </select>
        </div>

        <button
          @click="createMCCAccount"
          :disabled="loading || !isValidMCCForm"
          class="create-mcc-btn"
        >
          {{ loading ? "Creating..." : "Create MCC Account" }}
        </button>
      </div>

      <!-- MCC Accounts List -->
      <div v-if="mccAccounts.length" class="mcc-accounts-list">
        <h3>Your MCC Accounts</h3>
        <div class="mcc-grid">
          <div
            v-for="mcc in mccAccounts"
            :key="mcc.customerId"
            class="mcc-card"
          >
            <div class="mcc-name">{{ mcc.descriptiveName }}</div>
            <div class="mcc-id">ID: {{ mcc.customerId }}</div>
            <div class="mcc-status" :class="mcc.status.toLowerCase()">
              Status: {{ mcc.status }}
            </div>
            <div class="mcc-details">
              <div>Currency: {{ mcc.currencyCode }}</div>
              <div>Time Zone: {{ mcc.timeZone }}</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
export default {
  name: "App",
  data() {
    return {
      accounts: [],
      selectedAccount: "",
      selectedAccountInfo: null,
      adsAccounts: [],
      loading: false,
      error: null,
      hasMCC: false,
      mccAccounts: [],
      selectedMCCAccount: "",
      childAccounts: [],
      developerToken: "",
      showToken: false,
      newMCC: {
        name: "",
        currencyCode: "USD",
        timeZone: "America/New_York",
      },
    };
  },
  computed: {
    isValidMCCForm() {
      return this.newMCC.name.trim().length > 0;
    },
  },
  methods: {
    async loadAccounts() {
      this.loading = true;
      this.error = null;

      try {
        const token = await this.getAuthToken();
        const userInfo = await this.getUserInfo(token);

        // Add the authenticated account to the list if not present
        if (!this.accounts.find((acc) => acc.email === userInfo.email)) {
          this.accounts.push({
            id: this.accounts.length + 1,
            email: userInfo.email,
            token: token,
          });
        }
      } catch (error) {
        this.error = error.message;
      } finally {
        this.loading = false;
      }
    },

    getAuthToken() {
      return new Promise((resolve, reject) => {
        chrome.identity.getAuthToken(
          {
            interactive: true,
            scopes: [
              "https://www.googleapis.com/auth/userinfo.email",
              "https://www.googleapis.com/auth/userinfo.profile",
              "https://www.googleapis.com/auth/adwords",
            ],
          },
          (token) => {
            if (chrome.runtime.lastError) {
              console.error("Auth Error:", chrome.runtime.lastError);
              reject(new Error(chrome.runtime.lastError.message));
              return;
            }
            resolve(token);
          }
        );
      });
    },

    async getUserInfo(token) {
      const response = await fetch(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to get user info");
      }

      return response.json();
    },

    async handleAccountSelect() {
      if (!this.selectedAccount) return;

      this.loading = true;
      this.error = null;
      this.hasMCC = false;
      this.mccAccounts = [];
      this.selectedMCCAccount = "";
      this.childAccounts = [];

      try {
        // First check if developer token exists
        const result = await chrome.storage.local.get("developerToken");
        if (!result.developerToken) {
          this.error = "Please save your Google Ads developer token first";
          this.loading = false;
          return;
        }

        const token = await this.getAuthToken();
        await this.checkMCCAccess(token);
      } catch (error) {
        this.error = error.message;
      } finally {
        this.loading = false;
      }
    },

    async checkMCCAccess(token) {
      try {
        // Get and validate the developer token
        const developerToken = await this.validateDeveloperToken();

        // First try to get MCC accounts list
        const response = await fetch(
          "https://googleads.googleapis.com/v16/customers:listAccessibleCustomers",
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
              "developer-token": developerToken,
            },
          }
        );

        if (!response.ok) {
          if (response.status === 403) {
            this.hasMCC = false;
            return;
          }
          throw new Error("Failed to check MCC access");
        }

        const data = await response.json();

        if (data.resourceNames?.length) {
          this.hasMCC = true;
          // Get details for each MCC account
          this.mccAccounts = await Promise.all(
            data.resourceNames.map(async (resourceName) => {
              const customerId = resourceName.split("/").pop();
              try {
                const detailsResponse = await fetch(
                  `https://googleads.googleapis.com/v16/customers/${customerId}/googleAds:search`,
                  {
                    method: "POST",
                    headers: {
                      Authorization: `Bearer ${token}`,
                      "Content-Type": "application/json",
                      "developer-token": this.developerToken,
                      "login-customer-id": customerId,
                    },
                    body: JSON.stringify({
                      query: `
                        SELECT
                          customer.id,
                          customer.descriptive_name,
                          customer.status
                        FROM customer
                        LIMIT 1
                      `,
                    }),
                  }
                );

                if (!detailsResponse.ok) {
                  const errorData = await detailsResponse.json();
                  console.error("API Error:", errorData);
                  throw new Error("Failed to get account details");
                }

                const accountData = await detailsResponse.json();
                const customer = accountData.results?.[0]?.customer;

                return {
                  customerId,
                  descriptiveName:
                    customer?.descriptiveName || "Unnamed Account",
                  status: customer?.status || "UNKNOWN",
                };
              } catch (error) {
                console.error(`Error for account ${customerId}:`, error);
                return {
                  customerId,
                  descriptiveName: "Error loading details",
                  status: "UNKNOWN",
                };
              }
            })
          );
        } else {
          this.hasMCC = false;
        }
      } catch (error) {
        console.error("MCC check error:", error);
        throw new Error(error.message || "Failed to check MCC access");
      }
    },

    async handleMCCSelect() {
      if (!this.selectedMCCAccount) {
        this.childAccounts = [];
        return;
      }

      this.loading = true;
      try {
        const token = await this.getAuthToken();
        await this.getChildAccounts(token, this.selectedMCCAccount);
      } catch (error) {
        this.error = error.message;
      } finally {
        this.loading = false;
      }
    },

    async getChildAccounts(token, mccId) {
      try {
        const response = await fetch(
          `https://googleads.googleapis.com/v15/customers/${mccId}/googleAdsService:searchStream`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              query: `
                SELECT
                  customer_client.client_customer,
                  customer_client.level,
                  customer_client.manager,
                  customer_client.descriptive_name,
                  customer_client.status
                FROM customer_client
                WHERE customer_client.level = 1
              `,
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to get child accounts");
        }

        const data = await response.json();
        this.childAccounts =
          data.results?.map((result) => ({
            customerId: result.customerClient.clientCustomer,
            descriptiveName: result.customerClient.descriptiveName,
            status: result.customerClient.status,
          })) || [];
      } catch (error) {
        console.error("Child accounts error:", error);
        this.error = "Failed to get child accounts";
        this.childAccounts = [];
      }
    },

    async getAdsAccounts(token) {
      try {
        // Get and validate the developer token
        const developerToken = await this.validateDeveloperToken();

        const response = await fetch(
          "https://googleads.googleapis.com/v15/customers:listAccessibleCustomers",
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
              "developer-token": developerToken,
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          console.error("API Error Response:", errorData);
          throw new Error(
            errorData.error?.message || "Failed to get Ads accounts"
          );
        }

        const data = await response.json();
        console.log("Ads accounts response:", data);

        if (data.resourceNames) {
          // Format the accounts data
          this.adsAccounts = await Promise.all(
            data.resourceNames.map(async (resourceName) => {
              const customerId = resourceName.split("/").pop();
              try {
                // Get account details
                const detailsResponse = await fetch(
                  `https://googleads.googleapis.com/v15/customers/${customerId}/googleAdsService:search`,
                  {
                    method: "POST",
                    headers: {
                      Authorization: `Bearer ${token}`,
                      "Content-Type": "application/json",
                      "developer-token": developerToken,
                      "login-customer-id": customerId,
                    },
                    body: JSON.stringify({
                      query: `
                        SELECT
                          customer.id,
                          customer.descriptive_name,
                          customer.currency_code,
                          customer.time_zone
                        FROM customer
                        LIMIT 1
                      `,
                    }),
                  }
                );

                if (!detailsResponse.ok) {
                  throw new Error("Failed to get account details");
                }

                const detailsData = await detailsResponse.json();
                const customer = detailsData.results?.[0]?.customer;

                return {
                  id: customerId,
                  resourceName,
                  name: customer?.descriptive_name || "Unnamed Account",
                  currencyCode: customer?.currency_code,
                  timeZone: customer?.time_zone,
                };
              } catch (error) {
                console.error(
                  `Error getting details for account ${customerId}:`,
                  error
                );
                return {
                  id: customerId,
                  resourceName,
                  name: "Error loading details",
                  error: true,
                };
              }
            })
          );
        } else {
          this.adsAccounts = [];
        }
      } catch (error) {
        console.error("Ads API Error:", error);
        throw new Error(`Failed to get Ads accounts: ${error.message}`);
      }
    },

    async addNewAccount() {
      this.loading = true;
      this.error = null;

      try {
        // Use the new OAuth flow with chrome.identity.launchWebAuthFlow
        const token = await new Promise((resolve, reject) => {
          const authUrl = new URL(
            "https://accounts.google.com/o/oauth2/v2/auth"
          );
          const params = {
            client_id:
              "433583771675-s8q43doerjb2ats95iskgcpe9tqjtmb4.apps.googleusercontent.com",
            response_type: "token",
            redirect_uri: chrome.identity.getRedirectURL("oauth2"),
            scope:
              "https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/adwords",
            prompt: "select_account consent",
          };

          Object.keys(params).forEach((key) =>
            authUrl.searchParams.append(key, params[key])
          );

          chrome.identity.launchWebAuthFlow(
            {
              url: authUrl.toString(),
              interactive: true,
            },
            (redirectUrl) => {
              if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
                return;
              }

              if (!redirectUrl) {
                reject(new Error("No redirect URL received"));
                return;
              }

              try {
                const url = new URL(redirectUrl);
                const hash = url.hash.substring(1);
                const params = new URLSearchParams(hash);
                const accessToken = params.get("access_token");

                if (accessToken) {
                  resolve(accessToken);
                } else {
                  reject(new Error("No access token received"));
                }
              } catch (error) {
                reject(error);
              }
            }
          );
        });

        // Get user info with the token
        const userInfo = await fetch(
          "https://www.googleapis.com/oauth2/v2/userinfo",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        ).then((response) => {
          if (!response.ok) {
            throw new Error("Failed to get user info");
          }
          return response.json();
        });

        // Check if account already exists
        const accountExists = this.accounts.some(
          (acc) => acc.email === userInfo.email
        );

        if (accountExists) {
          this.error = "This account is already added";
          return;
        }

        // Add the new account
        this.accounts.push({
          id: this.accounts.length + 1,
          email: userInfo.email,
          token: token,
          picture: userInfo.picture,
          name: userInfo.name,
        });

        // Set this as the selected account
        this.selectedAccount = userInfo.email;
        this.selectedAccountInfo = userInfo;

        this.showStatus(
          `Account ${userInfo.email} added successfully!`,
          "success"
        );

        // Optionally, trigger MCC check for the new account
        await this.checkMCCAccess(token);
      } catch (error) {
        console.error("Add account error:", error);
        this.error = error.message;
      } finally {
        this.loading = false;
      }
    },

    showStatus(message, type) {
      this.error = type === "error" ? message : null;
      // You could also add a success message display here if desired
    },

    toggleTokenVisibility() {
      this.showToken = !this.showToken;
      const tokenInput = document.getElementById("developerToken");
      tokenInput.type = this.showToken ? "text" : "password";
    },

    async saveDeveloperToken() {
      this.loading = true;
      this.error = null;

      try {
        // Save to chrome.storage
        await chrome.storage.local.set({ developerToken: this.developerToken });
        this.showStatus("Developer token saved successfully!", "success");
      } catch (error) {
        this.error = "Failed to save developer token: " + error.message;
      } finally {
        this.loading = false;
      }
    },

    // Add method to load saved token on component mount
    async loadSavedToken() {
      try {
        const result = await chrome.storage.local.get("developerToken");
        if (result.developerToken) {
          this.developerToken = result.developerToken;
        }
      } catch (error) {
        console.error("Failed to load developer token:", error);
      }
    },

    // Add a helper method to validate developer token
    async validateDeveloperToken() {
      const result = await chrome.storage.local.get("developerToken");
      if (!result.developerToken) {
        throw new Error("Please save your Google Ads developer token first");
      }
      return result.developerToken;
    },

    async createMCCAccount() {
      if (!this.selectedAccount || !this.isValidMCCForm) return;

      this.loading = true;
      this.error = null;

      try {
        const token = await this.getAuthToken();

        // Create new MCC account
        const response = await fetch(
          "https://googleads.googleapis.com/v16/customers:createCustomerClient",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
              "developer-token": this.developerToken,
            },
            body: JSON.stringify({
              customerClient: {
                descriptiveName: this.newMCC.name,
                currencyCode: this.newMCC.currencyCode,
                timeZone: this.newMCC.timeZone,
                manager: true, // This makes it an MCC account
              },
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error?.message || "Failed to create MCC account"
          );
        }

        const data = await response.json();
        console.log("MCC Creation Response:", data);

        // Add new MCC to list
        this.mccAccounts.push({
          customerId: data.resourceName.split("/").pop(),
          descriptiveName: this.newMCC.name,
          status: "ACTIVE",
          currencyCode: this.newMCC.currencyCode,
          timeZone: this.newMCC.timeZone,
        });

        // Reset form
        this.newMCC.name = "";

        // Show success message
        this.$emit("show-notification", {
          type: "success",
          message: "MCC account created successfully!",
        });
      } catch (error) {
        console.error("MCC Creation Error:", error);
        this.error = `Failed to create MCC account: ${error.message}`;
      } finally {
        this.loading = false;
      }
    },
  },
  // Add mounted hook to load saved token
  mounted() {
    this.loadSavedToken();
  },
};
</script>

<style>
body {
  margin: 0;
  padding: 0;
  font-family: Arial, sans-serif;
  background: #f5f5f5;
}

.app-container {
  min-height: 100vh;
}

.header {
  background: #4285f4;
  color: white;
  padding: 20px;
  text-align: center;
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.account-section {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 30px;
}

.select-container {
  flex: 1;
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
}

select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

.refresh-btn {
  padding: 10px 20px;
  background: #4285f4;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  height: 40px;
  margin-top: 24px;
}

.refresh-btn:hover {
  background: #357abd;
}

.refresh-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.loading {
  text-align: center;
  padding: 20px;
  color: #666;
}

.error-message {
  background: #ffebee;
  color: #c62828;
  padding: 15px;
  border-radius: 4px;
  margin: 20px 0;
  position: relative;
  border-left: 4px solid #c62828;
}

.error-title {
  font-weight: bold;
  margin-bottom: 5px;
}

.error-details {
  font-size: 0.9em;
}

.error-close {
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  color: #c62828;
  font-size: 20px;
  cursor: pointer;
}

.account-info,
.ads-accounts {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin: 20px 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.info-card {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 4px;
}

.profile-img {
  width: 60px;
  height: 60px;
  border-radius: 50%;
}

.ads-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.ads-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.ads-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.ads-card.error {
  border-left: 4px solid #c62828;
}

.ads-name {
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 8px;
  color: #333;
}

.ads-id {
  color: #666;
  font-size: 14px;
  margin-bottom: 8px;
}

.ads-details {
  color: #666;
  font-size: 14px;
  margin-top: 4px;
}

h2 {
  margin: 0 0 20px 0;
  color: #333;
}

.mcc-section {
  margin-bottom: 30px;
}

.mcc-select {
  margin-top: 10px;
}

.accounts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.account-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.account-name {
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 8px;
}

.account-id {
  color: #666;
  margin-bottom: 8px;
}

.account-status {
  color: #444;
  font-size: 14px;
}

.no-mcc {
  padding: 20px;
  background: #f5f5f5;
  border-radius: 4px;
  color: #666;
  text-align: center;
}

h3,
h4 {
  margin-top: 0;
  margin-bottom: 16px;
  color: #333;
}

.add-account-btn {
  padding: 10px 20px;
  background: #34a853; /* Google green color */
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  height: 40px;
  margin-top: 24px;
  margin-right: 10px;
  transition: background-color 0.2s;
}

.add-account-btn:hover {
  background: #2e8b47;
}

.add-account-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.developer-token-section {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.token-input-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.token-input-wrapper {
  display: flex;
  gap: 10px;
  align-items: center;
}

.token-input-wrapper input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

.toggle-visibility-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 20px;
  padding: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.save-token-btn {
  padding: 10px 20px;
  background: #4285f4;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  align-self: flex-start;
  transition: background-color 0.2s;
}

.save-token-btn:hover {
  background: #357abd;
}

.save-token-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.mcc-creation-form {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-top: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.create-mcc-btn {
  background: #4285f4;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  width: 100%;
}

.create-mcc-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.mcc-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.mcc-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.mcc-name {
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 8px;
}

.mcc-id {
  color: #666;
  margin-bottom: 8px;
}

.mcc-status {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  margin-bottom: 12px;
}

.mcc-status.active {
  background: #e8f5e9;
  color: #2e7d32;
}

.mcc-details {
  color: #666;
  font-size: 14px;
  line-height: 1.4;
}
</style>
