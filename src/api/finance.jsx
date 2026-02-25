import api from "./axios";

/**
 * Get the current user's wallet details.
 */
export const getWallet = async () => {
  const response = await api.get("/finance/wallet");
  return response.data;
};

/**
 * Set a new transaction pin.
 * @param {string} pin
 */
export const setPin = async (pin) => {
  const response = await api.post("/finance/wallet/pin/set", { pin });
  return response.data;
};

/**
 * Change the transaction pin.
 * @param {string} oldPin
 * @param {string} newPin
 */
export const changePin = async (oldPin, newPin) => {
  const response = await api.post("/finance/wallet/pin/change", { oldPin, newPin });
  return response.data;
};

/**
 * Reset the transaction pin (Admin/System initiated).
 * @param {string} userId
 * @param {string} newPin
 */
export const resetPin = async (userId, newPin) => {
  const response = await api.post("/finance/wallet/pin/reset", { userId, newPin });
  return response.data;
};

/**
 * Get a list of supported banks.
 */
export const getBanks = async () => {
  const response = await api.get("/finance/wallet/banks");
  return response.data;
};

/**
 * Get transaction history for the wallet.
 */
export const getTransactions = async () => {
  const response = await api.get("/finance/wallet/transactions");
  return response.data;
};

/**
 * Verify a bank account.
 * @param {string} accountNumber
 * @param {string} bankCode
 */
export const verifyBankAccount = async (accountNumber, bankCode) => {
  const response = await api.get("/finance/wallet/verify-account", {
    params: { accountNumber, bankCode },
  });
  return response.data;
};

/**
 * Update the settlement bank account.
 * @param {string} accountNumber
 * @param {string} bankCode
 */
export const updateSettlementAccount = async (accountNumber, bankCode) => {
  const response = await api.patch("/finance/wallet/update-account", {
    accountNumber,
    bankCode,
  });
  return response.data;
};

/**
 * Initiate a wallet topup.
 * @param {number} amount
 */
export const initiateTopup = async (amount) => {
  const response = await api.post("/finance/wallet/topup/initiate", { amount });
  return response.data;
};

/**
 * Withdraw funds from the wallet.
 * @param {string} pin
 * @param {number} amount
 * @param {string} [description]
 */
export const withdrawFunds = async (pin, amount, description) => {
  const response = await api.post("/finance/wallet/withdraw", {
    pin,
    amount,
    description,
  });
  return response.data;
};
