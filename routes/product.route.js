const express = require("express");
const productRouter = express.Router();
const productModel = require("../models/product.model");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

// Multer setup for handling image uploads (not used directly here)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB limit
});

// Add a new product
productRouter.post("/", async (req, res) => {
  try {
    const { productName, categoryName, subcategoryName, imageBase64, status } = req.body;

    // Check if all required fields are provided
    if (!productName || !categoryName || !subcategoryName || !imageBase64 || !status) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Create a directory to store the Base64 images as text files
    const imageTextDir = path.join(__dirname, "../ImageText");
    fs.mkdirSync(imageTextDir, { recursive: true });
    const id = Math.floor(Math.random() * 9000) + 1000;
    const filePath = path.join(imageTextDir, `${id}.txt`);

    // Decode the base64 image and save it as a file
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    fs.writeFileSync(filePath, base64Data, "base64");

    // Prepare product data for insertion
    const productData = {
      productName,
      categoryName,
      subcategoryName,
      image: `ImageText/${id}.txt`, // Save the image as a file path
      id,
      status,
    };

    // Insert the new product into the database
    const result = await productModel.create(productData);
    const newProduct = await productModel.findById(result.insertId);
    res.status(201).json(newProduct); // Return the newly created product
  } catch (error) {
    // Handle server errors
    res.status(500).json({ message: error.message });
  }
});

// Update an existing product
productRouter.put("/:id", async (req, res) => {
  try {
    const { productName, categoryName, subcategoryName, status, image } = req.body;

    // Check if required fields are provided
    if (!productName || !categoryName || !subcategoryName || !status) {
      return res.status(400).json({ message: "Required fields are missing." });
    }

    // Prepare the updated product data
    const updatedProductData = {
      productName,
      categoryName,
      subcategoryName,
      status,
      imageBase64: image, // Base64 image for update
    };

    // Update the product in the database
    const result = await productModel.update(req.params.id, updatedProductData);

    // If no product was updated, return a 404
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Product not found." });
    }

    // Fetch and return the updated product
    const updatedProduct = await productModel.findById(req.params.id);
    res.status(200).json(updatedProduct);
  } catch (error) {
    // Handle server errors
    res.status(500).json({ message: error.message });
  }
});

// Get all products
productRouter.get("/", async (req, res) => {
  try {
    // Fetch all products from the database
    const products = await productModel.getAll();

    // Map through products and decode Base64 image data
    const productsWithImages = products.map((product) => {
      const filePath = path.join(__dirname, "..", product.image);
      const imageBase64 = fs.readFileSync(filePath, "base64");
      return {
        ...product,
        image: `data:image/jpeg;base64,${imageBase64}`, // Convert to Base64 image string
      };
    });

    res.json(productsWithImages); // Return the products with images
  } catch (error) {
    // Handle server errors
    res.status(500).json({ message: error.message });
  }
});

// Delete a product by ID
productRouter.delete("/:id", async (req, res) => {
  try {
    // Delete the product from the database
    const result = await productModel.delete(req.params.id);

    // If no product was deleted, return a 404
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Product not found." });
    }

    res.status(200).json({ message: "Product deleted successfully." }); // Return success message
  } catch (error) {
    // Handle server errors
    res.status(500).json({ message: error.message });
  }
});

module.exports = productRouter;
