const express = require("express");
const nodemailer = require("nodemailer");
const { userRouter } = require("./routes/user.route");
const { connection } = require("./db");
const cors = require("cors");
const { authenticate } = require("./middleware/middleware");
const categoryRoutes = require("./routes/category.route");
const subCategoryRouter = require("./routes/subCategory.route");
const productRouter = require("./routes/product.route");
require("dotenv").config();

const app = express();

// Middleware for parsing requests
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use(
  cors({
    origin: "https://the-tablesprint.netlify.app/", // Allow requests from this origin
    methods: "GET,POST,PUT,DELETE", // Allowed HTTP methods
    credentials: true, // Allow cookies and credentials
  })
);

// Handle preflight requests
app.options("*", (req, res) => {
  res.header("Access-Control-Allow-Origin", "https://the-tablesprint.netlify.app/");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.send();
});


// Home route
app.get("/", (req, res) => {
  res.send("TableSprint home route");
});

// User routes
app.use("/user", userRouter);

// Category routes
app.use("/category", categoryRoutes);
app.use("/subCategory", subCategoryRouter);
app.use("/product", productRouter);

// Nodemailer Configuration
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "sutarimran47@gmail.com", // Your Gmail address
    pass: process.env.PASS, // App-specific password from Google
  },
});


app.post("/send-mail", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).send("Email is required");
  }
  try {
    // Check if the email exists in the database
    const [rows] = await connection.query("SELECT * FROM users WHERE email = ?", [email]);
    if (rows.length === 0) {
      return res.status(404).send("Email not found in database");
    }
    const resetLink = `${process.env.LINK}?email=${encodeURIComponent(email)}`;
    const mailOptions = {
      from: "sutarimran47@gmail.com",
      to: email,
      bcc: "sutarimran47@gmail.com",
      subject: "Reset your password",
      text: `You requested a password reset. Click here to reset your password: ${resetLink}`,
    };
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        return res.status(500).send("Error sending email: " + error.message);
      } else {
        console.log("Email sent: " + info.response);
        res.send("Reset password email sent successfully!");
      }
    });
  } catch (error) {
    console.error("Database query error:", error);
    res.status(500).send("Server error");
  }
});


// Authentication middleware
app.use(authenticate);

// Start server
app.listen(8080, async () => {
  try {
    const [rows] = await connection.query("SELECT 1");
    console.log("Connected to TiDB Cloud:", rows);
  } catch (error) {
    console.error("Cannot connect to TiDB:", error);
  }
  console.log("Server started at port 8080");
});
  
