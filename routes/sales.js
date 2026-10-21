
const express = require("express");
const Sale = require("../models/Sale");

const router = express.Router();

// GET: Retrieve all sales
router.get("/", async (req, res) => {
  try {
    const sales = await Sale.find().sort({ saleDate: -1 });
    res.json(sales);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST: Add a new sale
router.post("/", async (req, res) => {
  try {
    const sale = await Sale.create(req.body);
    res.status(201).json(sale);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// GET: Business analytics summary
router.get("/summary", async (req, res) => {
  try {
    const result = await Sale.aggregate([
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalUnits: { $sum: "$quantity" },
          totalRevenue: {
            $sum: { $multiply: ["$quantity", "$unitPrice"] }
          }
        }
      }
    ]);

    res.json(result[0] || {
      totalOrders: 0,
      totalUnits: 0,
      totalRevenue: 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

 // GET: Monthly sales analytics
router.get("/monthly", async (req, res) => {
  try {
    const monthlySales = await Sale.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$saleDate" },
            month: { $month: "$saleDate" }
          },
          revenue: {
            $sum: {
              $multiply: ["$quantity", "$unitPrice"]
            }
          },
          orders: { $sum: 1 }
        }
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1
        }
      },
      {
        $project: {
          _id: 0,
          year: "$_id.year",
          month: "$_id.month",
          revenue: 1,
          orders: 1
        }
      }
    ]);

    res.json(monthlySales);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/categories", async (req, res) => {
  try {
    const categorySales = await Sale.aggregate([
      {
        $group: {
          _id: "$category",
          revenue: {
            $sum: {
              $multiply: ["$quantity", "$unitPrice"]
            }
          },
          orders: { $sum: 1 }
        }
      },
      {
        $sort: { revenue: -1 }
      },
      {
        $project: {
          _id: 0,
          category: "$_id",
          revenue: 1,
          orders: 1
        }
      }
    ]);

    res.json(categorySales);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT: Update a sale
router.put("/:id", async (req, res) => {
  try {
    const sale = await Sale.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!sale) {
      return res.status(404).json({ message: "Sale not found" });
    }

    res.json(sale);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE: Remove a sale
router.delete("/:id", async (req, res) => {
  try {
    const sale = await Sale.findByIdAndDelete(req.params.id);

    if (!sale) {
      return res.status(404).json({ message: "Sale not found" });
    }

    res.json({ message: "Sale deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
