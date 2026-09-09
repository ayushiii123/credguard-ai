const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Atlas Connected Successfully ✅");
  } catch (error) {
    console.error("MongoDB Connection Failed ❌");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;