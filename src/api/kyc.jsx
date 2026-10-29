import api from "./axios";

/**
 * Request a Sumsub Access Token for WebSDK.
 * @param {string} level 'phone' | 'level-2' | 'level-3' | custom level name
 * @param {number} [ttlInSecs=3600]
 */
export const getSumsubAccessToken = async (level = "level-2", ttlInSecs = 3600) => {
  const response = await api.post("/kyc/sumsub/access-token", {
    level,
    ttlInSecs,
  });
  return response.data;
};

/**
 * Get current user KYC status and sync live with Sumsub.
 */
export const getSumsubKycStatus = async () => {
  const response = await api.get("/kyc/sumsub/status");
  return response.data;
};
