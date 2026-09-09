const axios = require("axios");

const checkHIBP = async (email) => {
  if (!email) {
    throw new Error("Email is required");
  }

  const apiKey = process.env.HIBP_API_KEY;

  if (!apiKey) {
    throw new Error("HIBP_API_KEY is missing");
  }

  const response = await axios.get(
    `https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(
      email
    )}`,
    {
      headers: {
        "hibp-api-key": apiKey,
        "user-agent": "CredGuard-AI",
      },
      params: {
        truncateResponse: false,
      },
    }
  );

  return response.data;
};

module.exports = {
  checkHIBP,
};