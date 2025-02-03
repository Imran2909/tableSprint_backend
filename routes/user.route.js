const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const fs = require("fs");
const userModel = require("../models/user.model");

const userRouter = express.Router();

// **Signup Route**
userRouter.post("/signup", async (req, res) => {
  const { email, password, resetPassword } = req.body;
  const user = await userModel.findByEmail(email);
  if (user) {
    console.log(user);
    res.send({ msg: "Email already registered" });
  } else {
    try {
      if (!email) {
        return res.send("Please enter a valid email");
      }

      if (!password || !resetPassword) {
        return res.send("Please enter a valid password");
      }

      if (password !== resetPassword) {
        return res.status(400).send("Password does not match");
      }

      // Hash the password
      bcrypt.hash(password, 5, async (err, hash) => {
        if (err) {
          return res.status(500).send({ message: err.message });
        }

        // Save the new user to the database
        try {
          const result = await userModel.create({ email, password: hash });
          console.log("New user created:", result);
          res.send({ msg: "User registered successfully" });
        } catch (error) {
          
          console.log(error);
          if (error.code === "ER_DUP_ENTRY") {
            res.status(400).send({ msg: "Email already exists" });
          } else {
            res.status(500).send({ msg: error.message });
          }
        }
      });
    } catch (error) {
      res.status(500).send({ msg: error.message });
    }
  }
});

// **Login Route**
userRouter.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find the user by email
    const user = await userModel.findByEmail(email);

    if (!user) {
      return res.status(404).send({ msg: "User not found" });
    }

    // Compare passwords
    bcrypt.compare(password, user.password, (err, result) => {
      if (err) {
        return res.status(500).send({ msg: "Internal server error" });
      }
      if (result) {
        const token = jwt.sign({ data: user.email }, "imran");

        // Save token to a file (optional, can be skipped in production)
        fs.writeFileSync("token.txt", token);

        return res.send({ token });
      } else {
        return res.status(401).send({ msg: "Invalid password" });
      }
    });
  } catch (error) {
    res.status(500).send({ msg: error.message });
  }
});

// **Logout Route**
userRouter.post("/logout", async (req, res) => {
  try {
    fs.unlinkSync("token.txt");
    res.send({ msg: "Logout successful. Token deleted." });
  } catch (error) {
    res
      .status(500)
      .send({ msg: "Error during logout. Could not delete token." });
  }
});

// **Check Email Route**
userRouter.post("/checkEmail", async (req, res) => {
  const { email } = req.body;
  try {
    const user = await userModel.findByEmail(email);
    if (user) {
      res.status(200).send({ msg: "User exists", userExists: true });
    } else {
      res.status(404).send({ msg: "User does not exist", userExists: false });
    }
  } catch (error) {
    res.status(500).send({ msg: "Server error", error: error.message });
  }
});


userRouter.post("/update-password", async (req, res) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) {
    return res.status(400).json({ msg: "Email and new password are required" });
  }
  try {
    // Find user by email
    const user = await userModel.findByEmail(email);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    // Update password in database
    await userModel.updatePassword(email, hashedPassword);
    res.json("Password updated success");
  } catch (error) {
    console.error("Password update error:", error);
    res.status(500).json({ msg: "Server error" });
  }
});


module.exports = {
  userRouter,
};
