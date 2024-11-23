<template>
  <div class="app-container">
    <header class="header">
      <h1>Google Accounts Manager</h1>
    </header>

    <main class="main-content">
      <!-- Google Account Management -->
      <div class="account-section">
        <div class="select-container">
          <label for="accountSelect">Google Account:</label>
          <div class="select-wrapper">
            <select
              id="accountSelect"
              v-model="selectedAccount"
              @change="handleAccountSelect"
              :class="{ empty: !selectedAccount }"
            >
              <option value="">Select Account</option>
              <option v-for="acc in accounts" :key="acc.id" :value="acc.email">
                {{ acc.email }}
              </option>
            </select>
            <button
              @click="refreshGoogleAccounts"
              class="refresh-accounts-btn"
              :disabled="loading"
            >
              <span class="icon">↻</span>
            </button>
          </div>
        </div>
        <button @click="addNewGoogleAccount" class="add-btn">
          <span class="icon">+</span> Add New Account
        </button>
      </div>

      <!-- Google Ads Accounts Table -->
      <div v-if="selectedAccount" class="ads-accounts-section">
        <div class="section-header">
          <h2>Google Ads Accounts</h2>
          <button @click="refreshAdsAccounts" class="refresh-btn">
            <span class="icon">↻</span> Refresh
          </button>
        </div>

        <div v-if="adsAccounts.length" class="table-container">
          <table class="ads-table">
            <thead>
              <tr>
                <th>Account Name</th>
                <th>Account ID</th>
                <th>Type</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="account in adsAccounts" :key="account.id">
                <td>{{ account.name }}</td>
                <td>{{ account.id }}</td>
                <td>
                  <span :class="['badge', account.type.toLowerCase()]">
                    {{ account.type }}
                  </span>
                </td>
                <td>
                  <span :class="['status', account.status.toLowerCase()]">
                    {{ account.status }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else class="no-data">
          <div class="no-data-icon">📊</div>
          <p>No Google Ads accounts found for this email.</p>
          <button @click="createBulkAccounts" class="create-btn">
            Create New Accounts
          </button>
        </div>
      </div>

      <!-- Bulk Creation Section -->
      <div v-if="selectedAccount" class="bulk-creation">
        <h2>Bulk Account Creation</h2>
        <div class="creation-inputs">
          <div class="input-group">
            <label>Number of MCC Accounts:</label>
            <input
              type="number"
              v-model.number="numMccAccounts"
              min="1"
              max="20"
              class="number-input"
            />
          </div>
          <div class="input-group">
            <label>Children per MCC:</label>
            <input
              type="number"
              v-model.number="numChildrenPerMcc"
              min="1"
              max="50"
              class="number-input"
            />
          </div>
          <button
            @click="createBulkAccounts"
            :disabled="loading"
            class="create-btn"
          >
            {{ loading ? "Creating..." : "Create Accounts" }}
          </button>
        </div>
      </div>

      <!-- Loading & Error Messages -->
      <div v-if="loading" class="loading-overlay">
        <div class="loading-spinner"></div>
        <p>Processing...</p>
      </div>

      <div v-if="error" class="error-message">
        <span class="error-icon">⚠️</span>
        {{ error }}
        <button @click="error = null" class="close-btn">×</button>
      </div>

      <div v-if="creatingAccount" class="creation-status">
        <div class="status-message">
          <span class="spinner"></span>
          Creating MCC Account...
          <p class="help-text">
            Please complete the account creation in the opened window
          </p>
        </div>
      </div>

      <!-- MCC Creation Form -->
      <div v-if="selectedAccount" class="mcc-creation-section">
        <h3>Create MCC Account</h3>
        <div class="mcc-form">
          <div class="form-row">
            <div class="form-group">
              <label>Account Name:</label>
              <div class="input-group">
                <input v-model="mccForm.name" type="text" readonly />
                <button
                  @click="regenerateName"
                  class="regenerate-btn"
                  type="button"
                >
                  ↻
                </button>
              </div>
            </div>
            <div class="form-group">
              <label>Currency:</label>
              <select v-model="mccForm.currency">
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="HKD">HKD</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Time Zone:</label>
              <select v-model="mccForm.timezone">
                <option value="America/New_York">New York</option>
                <option value="Asia/Hong_Kong">Hong Kong</option>
                <option value="Europe/London">London</option>
              </select>
            </div>
            <div class="form-group">
              <label>Country:</label>
              <select v-model="mccForm.country">
                <option value="US">United States</option>
                <option value="HK">Hong Kong</option>
                <option value="GB">United Kingdom</option>
              </select>
            </div>
          </div>

          <div class="form-actions">
            <button
              @click="handleMccCreate"
              :disabled="creating"
              class="create-btn"
            >
              {{ creating ? "Creating..." : "Create MCC Account" }}
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.app-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
}

.header {
  background: #4285f4;
  color: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header h1 {
  margin: 0;
  font-size: 24px;
}

.account-section {
  display: flex;
  gap: 20px;
  align-items: center;
  margin-bottom: 30px;
}

.select-container {
  flex: 1;
}

.select-container label {
  display: block;
  margin-bottom: 8px;
  color: #666;
}

.select-wrapper {
  position: relative;
  display: flex;
  gap: 10px;
}

.refresh-accounts-btn {
  background: #fff;
  border: 2px solid #4285f4;
  color: #4285f4;
  width: 40px;
  height: 40px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.refresh-accounts-btn:hover {
  background: #4285f4;
  color: white;
}

.refresh-accounts-btn:disabled {
  background: #ccc;
  border-color: #ccc;
  cursor: not-allowed;
}

.refresh-accounts-btn .icon {
  font-size: 18px;
}

select {
  flex: 1;
  padding: 10px;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
  transition: border-color 0.3s;
}

select:focus {
  border-color: #4285f4;
  outline: none;
}

select.empty {
  color: #999;
}

.add-btn {
  background: #34a853;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  transition: background 0.3s;
}

.add-btn:hover {
  background: #2d9147;
}

.icon {
  font-size: 18px;
}

.ads-accounts-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.refresh-btn {
  background: #fff;
  border: 2px solid #4285f4;
  color: #4285f4;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s;
}

.refresh-btn:hover {
  background: #4285f4;
  color: white;
}

.table-container {
  overflow-x: auto;
}

.ads-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

.ads-table th,
.ads-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.ads-table th {
  background: #f8f9fa;
  font-weight: 600;
  color: #666;
}

.badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 14px;
}

.badge.mcc {
  background: #e8f0fe;
  color: #4285f4;
}

.badge.child {
  background: #fce8e6;
  color: #ea4335;
}

.status {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 14px;
}

.status.active {
  background: #e6f4ea;
  color: #34a853;
}

.status.pending {
  background: #fff8e1;
  color: #ffa000;
}

.no-data {
  text-align: center;
  padding: 40px;
  color: #666;
}

.no-data-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.bulk-creation {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.creation-inputs {
  display: flex;
  gap: 20px;
  align-items: flex-end;
}

.input-group {
  flex: 1;
}

.input-group label {
  display: block;
  margin-bottom: 8px;
  color: #666;
}

.number-input {
  width: 100%;
  padding: 10px;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
}

.create-btn {
  background: #4285f4;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  transition: background 0.3s;
}

.create-btn:hover {
  background: #3367d6;
}

.create-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #4285f4;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.error-message {
  background: #fce8e6;
  color: #ea4335;
  padding: 12px;
  border-radius: 6px;
  margin-top: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.close-btn {
  margin-left: auto;
  background: none;
  border: none;
  color: #ea4335;
  cursor: pointer;
  font-size: 20px;
}

.creation-status {
  position: fixed;
  top: 20px;
  right: 20px;
  background: #fff;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.status-message {
  display: flex;
  align-items: center;
  gap: 10px;
}

.spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.help-text {
  font-size: 12px;
  color: #666;
  margin-top: 5px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.mcc-creation-section {
  margin: 20px 0;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.mcc-form {
  max-width: 800px;
}

.form-row {
  display: flex;
  gap: 20px;
  margin-bottom: 15px;
}

.form-group {
  flex: 1;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-actions {
  margin-top: 20px;
}

.create-btn {
  background: #4285f4;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.create-btn:disabled {
  background: #a4c2f4;
  cursor: not-allowed;
}

.error {
  color: #d93025;
  margin-top: 5px;
  font-size: 12px;
}

.input-group {
  display: flex;
  gap: 8px;
}

.regenerate-btn {
  padding: 8px;
  background: #f1f3f4;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
}

.regenerate-btn:hover {
  background: #e8eaed;
}
</style>

<script>
export default {
  name: "App",
  data() {
    return {
      accounts: [],
      selectedAccount: "",
      adsAccounts: [],
      numMccAccounts: 1,
      numChildrenPerMcc: 1,
      loading: false,
      error: null,
      creatingAccount: false,
      creating: false,
      mccForm: {
        name: this.generateMccName(),
        currency: "USD",
        timezone: "America/New_York",
        country: "US",
      },
    };
  },
  methods: {
    // Get Auth Token
    async getAuthToken() {
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
              reject(new Error(chrome.runtime.lastError.message));
              return;
            }
            resolve(token);
          }
        );
      });
    },

    // Refresh Google accounts from browser
    async refreshGoogleAccounts() {
      this.loading = true;
      this.error = null;

      try {
        // Get token for current account
        const token = await this.getAuthToken();

        // Get user info
        const userInfo = await this.getUserInfo(token);

        // Update accounts list
        if (!this.accounts.some((acc) => acc.email === userInfo.email)) {
          this.accounts.push({
            id: Date.now(),
            email: userInfo.email,
            token: token,
          });
        }

        // Auto-select if no account is selected
        if (!this.selectedAccount) {
          this.selectedAccount = userInfo.email;
          await this.handleAccountSelect();
        }
      } catch (error) {
        this.error = "Failed to refresh Google account: " + error.message;
        console.error(error);
      } finally {
        this.loading = false;
      }
    },

    // Get user info using token
    async getUserInfo(token) {
      const response = await fetch(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) throw new Error("Failed to get user info");
      return response.json();
    },

    // Handle account selection
    async handleAccountSelect() {
      if (!this.selectedAccount) return;

      this.loading = true;
      try {
        const token = await this.getAuthToken();
        await this.loadAdsAccounts(token);
      } catch (error) {
        this.error = error.message;
      } finally {
        this.loading = false;
      }
    },

    // Load Google Ads accounts
    async loadAdsAccounts(token) {
      try {
        // First try: Direct Google Ads API endpoint
        const response = await fetch("https://ads.google.com/aw/overview", {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (!response.ok) {
          // Second try: Using customer management endpoint
          const customerResponse = await fetch(
            "https://ads.google.com/aw/overview/customeraccounts",
            {
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
              },
              credentials: "include",
            }
          );

          if (customerResponse.ok) {
            const data = await customerResponse.json();
            this.processAdsAccounts(data);
            return;
          }

          // Third try: Using deeplink approach
          await this.loadAdsAccountsViaDeeplink(token);
        } else {
          const data = await response.json();
          this.processAdsAccounts(data);
        }
      } catch (error) {
        console.error("Failed to load accounts:", error);
        // Fallback to deeplink method
        await this.loadAdsAccountsViaDeeplink(token);
      }
    },

    // New method to load accounts via deeplink
    async loadAdsAccountsViaDeeplink(token) {
      try {
        // Common deeplink parameters
        const baseParams = {
          authuser: this.selectedAccount,
          hl: "en",
          __c: Date.now(), // Cache buster
        };

        // Different deeplink patterns to try
        const deeplinkPatterns = [
          // Pattern 1: Overview page
          `https://ads.google.com/aw/overview?${new URLSearchParams(
            baseParams
          )}`,

          // Pattern 2: Account picker
          `https://ads.google.com/aw/accountspicker?${new URLSearchParams({
            ...baseParams,
            type: "MCCSearch",
            mccs: "true",
          })}`,

          // Pattern 3: Customer accounts
          `https://ads.google.com/aw/accounts?${new URLSearchParams({
            ...baseParams,
            view: "all",
          })}`,

          // Pattern 4: Direct MCC access
          `https://ads.google.com/aw/overview?${new URLSearchParams({
            ...baseParams,
            mcc: "true",
          })}`,
        ];

        // Try each deeplink pattern
        for (const deeplink of deeplinkPatterns) {
          try {
            const response = await fetch(deeplink, {
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json, text/html",
                "X-Requested-With": "XMLHttpRequest",
              },
              credentials: "include",
            });

            if (response.ok) {
              const contentType = response.headers.get("content-type");
              if (contentType?.includes("application/json")) {
                const data = await response.json();
                if (this.processAdsAccounts(data)) {
                  return; // Successfully processed accounts
                }
              } else if (contentType?.includes("text/html")) {
                const html = await response.text();
                if (this.extractAccountsFromHtml(html)) {
                  return; // Successfully extracted accounts from HTML
                }
              }
            }
          } catch (error) {
            console.warn(`Failed to load from ${deeplink}:`, error);
            continue; // Try next pattern
          }
        }

        // If we reach here, no pattern worked - throw error
        throw new Error("Could not access Google Ads accounts");
      } catch (error) {
        console.error("Deeplink access failed:", error);
        this.error = "Failed to load Google Ads accounts. Please try again.";
        this.adsAccounts = [];
      }
    },

    // Helper method to process accounts data
    processAdsAccounts(data) {
      try {
        if (data.accounts || data.customerAccounts || data.mccs) {
          const accounts = data.accounts || data.customerAccounts || data.mccs;
          this.adsAccounts = accounts.map((acc) => ({
            id: acc.customerId || acc.id,
            name:
              acc.name || acc.descriptiveName || `Account ${acc.customerId}`,
            type: acc.accountType || (acc.canManageClients ? "MCC" : "Child"),
            status: acc.accountStatus || acc.status || "Unknown",
          }));
          return true;
        }
        return false;
      } catch (error) {
        console.error("Failed to process accounts data:", error);
        return false;
      }
    },

    // Helper method to extract accounts from HTML
    extractAccountsFromHtml(html) {
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");

        // Try different selectors that might contain account information
        const accountElements = doc.querySelectorAll(
          [
            "[data-customer-id]",
            ".account-card",
            ".customer-account",
            "[data-account-id]",
          ].join(",")
        );

        if (accountElements.length > 0) {
          this.adsAccounts = Array.from(accountElements).map((el) => ({
            id:
              el.getAttribute("data-customer-id") ||
              el.getAttribute("data-account-id"),
            name:
              el.querySelector(".account-name, .customer-name")?.textContent ||
              "Unknown Account",
            type: el.hasAttribute("data-is-mcc") ? "MCC" : "Child",
            status: el.querySelector(".status")?.textContent || "Unknown",
          }));
          return true;
        }
        return false;
      } catch (error) {
        console.error("Failed to extract accounts from HTML:", error);
        return false;
      }
    },

    // Create bulk accounts
    async createBulkAccounts() {
      this.loading = true;
      this.error = null;

      try {
        const token = await this.getAuthToken();
        // Create MCC accounts
        for (let i = 0; i < this.numMccAccounts; i++) {
          // Create MCC using API
          const mccAccount = await this.createMccAccount(token);
          console.log("Created MCC account:", mccAccount);

          // Wait a bit before creating child accounts
          await new Promise((resolve) => setTimeout(resolve, 2000));

          // Create child accounts for this MCC
          for (let j = 0; j < this.numChildrenPerMcc; j++) {
            // Create child account logic here
            // Similar API call but with manager: false
          }
        }

        // Refresh the accounts list
        await this.refreshAdsAccounts();
      } catch (error) {
        this.error = error.message;
        console.error("Bulk creation error:", error);
      } finally {
        this.loading = false;
      }
    },

    // Add refresh method
    async refreshAdsAccounts() {
      this.loading = true;
      try {
        const token = await this.getAuthToken();
        await this.loadAdsAccounts(token);
      } catch (error) {
        this.error = error.message;
      } finally {
        this.loading = false;
      }
    },

    // Update addNewGoogleAccount to use proper OAuth flow
    async addNewGoogleAccount() {
      this.loading = true;
      this.error = null;

      try {
        const token = await new Promise((resolve, reject) => {
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
                reject(new Error(chrome.runtime.lastError.message));
                return;
              }
              resolve(token);
            }
          );
        });

        const userInfo = await this.getUserInfo(token);

        // Update accounts list
        if (!this.accounts.some((acc) => acc.email === userInfo.email)) {
          this.accounts.push({
            id: Date.now(),
            email: userInfo.email,
            token: token,
          });
        }

        // Auto-select the new account
        this.selectedAccount = userInfo.email;
        await this.handleAccountSelect();
      } catch (error) {
        this.error = "Failed to add new Google account: " + error.message;
        console.error(error);
      } finally {
        this.loading = false;
      }
    },

    async handleMccCreate() {
      if (!this.validateMccForm()) return;

      try {
        this.creating = true;
        const token = await this.getAuthToken();
        await this.createMccAccount(token);
      } catch (error) {
        this.error = error.message;
      } finally {
        this.creating = false;
      }
    },

    validateMccForm() {
      if (!this.mccForm.name) {
        this.error = "Please enter an account name";
        return false;
      }
      return true;
    },

    async createMccAccount(token) {
      try {
        const userInfo = await this.getUserInfo(token);

        // Prepare creation parameters
        const creationParams = new URLSearchParams({
          authuser: userInfo.email,
          descriptiveName: this.mccForm.name,
          currencyCode: this.mccForm.currency,
          timeZone: this.mccForm.timezone,
          country: this.mccForm.country,
          __c: Date.now(),
          hl: "en",
          mcc: "true",
        });

        // Try different creation endpoints
        const endpoints = [
          {
            url: "https://ads.google.com/aw/overview/signup/mcc",
            method: "POST",
            params: creationParams,
            body: {
              accountName: this.mccForm.name,
              currencyCode: this.mccForm.currency,
              timeZone: this.mccForm.timezone,
              country: this.mccForm.country,
              type: "MCC",
            },
          },
          {
            url: "https://ads.google.com/um/Welcome/Home",
            method: "POST",
            params: new URLSearchParams({
              ...Object.fromEntries(creationParams),
              step: "sign-up",
            }),
            body: {
              accountName: this.mccForm.name,
              currencyCode: this.mccForm.currency,
              timeZone: this.mccForm.timezone,
              country: this.mccForm.country,
            },
          },
        ];

        for (const endpoint of endpoints) {
          try {
            const response = await fetch(`${endpoint.url}?${endpoint.params}`, {
              method: endpoint.method,
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
                Accept: "application/json",
                "x-goog-user-email": userInfo.email,
              },
              body: JSON.stringify(endpoint.body),
              credentials: "include",
            });

            if (response.ok || response.status === 302) {
              // Wait for account propagation
              await new Promise((resolve) => setTimeout(resolve, 5000));

              // Verify account creation
              const verifyResponse = await fetch(
                "https://ads.google.com/aw/overview",
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                    "x-goog-user-email": userInfo.email,
                  },
                  credentials: "include",
                }
              );

              if (verifyResponse.ok) {
                // Refresh accounts list
                await this.loadAdsAccounts(token);
                return { status: "completed" };
              }
            }
          } catch (error) {
            console.warn(`Failed with endpoint ${endpoint.url}:`, error);
            continue; // Try next endpoint
          }
        }

        throw new Error("Could not create MCC account automatically");
      } catch (error) {
        console.error("Create MCC error:", error);
        throw error;
      }
    },

    generateMccName() {
      const date = new Date();
      const timestamp = date.getTime();
      const formattedDate = date.toISOString().split("T")[0]; // YYYY-MM-DD

      // Different name format options
      const nameFormats = [
        `MCC_${timestamp}`,
        `MCC_${formattedDate}`,
        `MCC_${this.formatDate(date)}`,
        `MCC_${this.getRandomString(6)}`,
      ];

      // Use one of the formats (you can change the index to use different formats)
      return nameFormats[0];
    },

    // Helper method to format date as YYYYMMDD
    formatDate(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}${month}${day}`;
    },

    // Helper method to generate random string
    getRandomString(length) {
      const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let result = "";
      for (let i = 0; i < length; i++) {
        result += characters.charAt(
          Math.floor(Math.random() * characters.length)
        );
      }
      return result;
    },

    // Optional: Regenerate name on demand
    regenerateName() {
      this.mccForm.name = this.generateMccName();
    },
  },
};
</script>
