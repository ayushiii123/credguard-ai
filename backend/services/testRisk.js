const { calculateRiskScore } = require("./riskEngine");

const breach = {
  severity: "high",

  dataExposed: [
    "email",
    "password",
  ],

  breachDate: "2026-08-01",
};

const result = calculateRiskScore(breach);

console.log("Risk Result:", result);