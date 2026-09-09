
/*
  DEMO BREACH SERVICE

  HIBP subscription ke bina CredGuard ka
  breach detection flow test karne ke liye.
*/

const checkEmailBreach = async (email) => {
  try {
    console.log("🔎 Demo breach check:", email);

    /*
      Demo emails:
      - test@credguard.com -> breach found
      - safe@credguard.com -> no breach
      - baaki emails -> breach found (demo)
    */

    if (email === "safe@credguard.com") {
      return {
        breached: false,
        breaches: [],
      };
    }

    // Demo breach result
    return {
      breached: true,

      breaches: [
        {
          Name: "CredGuard Demo Breach",
          BreachDate: "2025-06-15",

          DataClasses: [
            "Email addresses",
            "Usernames",
            "Passwords",
            "Phone numbers",
          ],

          Description:
            "This is a simulated breach used for testing the CredGuard security monitoring system.",
        },
      ],
    };

  } catch (error) {
    console.error(
      "Demo Breach Check Error:",
      error.message
    );

    throw new Error("Failed to check breach status");
  }
};

module.exports = {
  checkEmailBreach,
};
