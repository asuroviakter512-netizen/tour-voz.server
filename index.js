
import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import "dotenv/config";
import cors from "cors";
import authRoutes from "./auth.js";
import verifyToken, { verifyAdmin } from "./verifyToken.js";

const app = express();
const PORT = 8000;

app.use(cors());
app.use(express.json());

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("MONGODB_URI is missing from .env file");
}

const client = new MongoClient(uri);

// Authentication Routes
app.use("/auth", authRoutes(client));

// =====================================
// Protected Profile API
// =====================================
app.get("/profile", verifyToken, async (req, res) => {
  try {
    const db = client.db("tour-voz");

    const user = await db.collection("users").findOne(
      { email: req.user.email },
      { projection: { password: 0 } }
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json({
      message: "Protected profile accessed successfully!",
      user,
    });
  } catch (error) {
    console.error("Profile error:", error);

    res.status(500).json({
      message: "Failed to load profile",
    });
  }
});

// =====================================
// My Bookings - Logged-in User Only
// =====================================
app.get("/my-bookings", verifyToken, async (req, res) => {
  try {
    const db = client.db("tour-voz");

    const result = await db.collection("bookings")
      .find({
        email: req.user.email.toLowerCase(),
      })
      .sort({ createdAt: -1 })
      .toArray();

    res.json(result);
  } catch (error) {
    console.error("My bookings error:", error);

    res.status(500).json({
      message: "Failed to fetch your bookings",
    });
  }
});

// =====================================
// Home Route
// =====================================
app.get("/", (req, res) => {
  res.json({
    message: "Server is running fine!",
  });
});

// =====================================
// Get All Destinations - Public
// =====================================
app.get("/destinations", async (req, res) => {
  try {
    const db = client.db("tour-voz");

    const result = await db
      .collection("destination")
      .find()
      .toArray();

    res.json(result);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed to fetch destinations",
    });
  }
});

// =====================================
// Get One Destination - Public
// =====================================
app.get("/destinations/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid destination ID",
      });
    }

    const db = client.db("tour-voz");

    const result = await db.collection("destination").findOne({
      _id: new ObjectId(id),
    });

    if (!result) {
      return res.status(404).json({
        message: "Destination not found",
      });
    }

    res.json(result);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed to fetch destination",
    });
  }
});

// =====================================
// Add Destination - Admin Only
// =====================================
app.post(
  "/add-destination",
  verifyToken,
  verifyAdmin,
  async (req, res) => {
    try {
      const db = client.db("tour-voz");

      const result = await db
        .collection("destination")
        .insertOne(req.body);

      res.status(201).json({
        message: "Destination added successfully",
        insertedId: result.insertedId,
      });
    } catch (err) {
      console.error(err);

      res.status(500).json({
        message: "Failed to add destination",
      });
    }
  }
);

// =====================================
// Update Destination - Admin Only
// =====================================
app.put(
  "/destinations/:id",
  verifyToken,
  verifyAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({
          message: "Invalid destination ID",
        });
      }

      const {
        name,
        destination,
        country,
        location,
        price,
        duration,
        image,
        description,
      } = req.body;

      const updateData = {};

      if (name !== undefined) updateData.name = name;
      if (destination !== undefined) updateData.destination = destination;
      if (country !== undefined) updateData.country = country;
      if (location !== undefined) updateData.location = location;
      if (price !== undefined) updateData.price = Number(price);
      if (duration !== undefined) updateData.duration = duration;
      if (image !== undefined) updateData.image = image;
      if (description !== undefined) updateData.description = description;

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          message: "No destination information provided",
        });
      }

      updateData.updatedAt = new Date();

      const db = client.db("tour-voz");

      const result = await db.collection("destination").updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({
          message: "Destination not found",
        });
      }

      res.json({
        message: "Destination updated successfully",
      });
    } catch (err) {
      console.error("Update destination error:", err);

      res.status(500).json({
        message: "Failed to update destination",
      });
    }
  }
);

// =====================================
// Delete Destination - Admin Only
// =====================================
app.delete(
  "/destinations/:id",
  verifyToken,
  verifyAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({
          message: "Invalid destination ID",
        });
      }

      const db = client.db("tour-voz");

      const result = await db.collection("destination").deleteOne({
        _id: new ObjectId(id),
      });

      if (result.deletedCount === 0) {
        return res.status(404).json({
          message: "Destination not found",
        });
      }

      res.json({
        message: "Destination deleted successfully",
      });
    } catch (err) {
      console.error("Delete destination error:", err);

      res.status(500).json({
        message: "Failed to delete destination",
      });
    }
  }
);

// =====================================
// Test Booking API - Public
// =====================================
app.get("/bookings", (req, res) => {
  res.json({
    message: "Booking API is working!",
  });
});

// =====================================
// Get All Bookings - Admin Only
// =====================================
app.get(
  "/all-bookings",
  verifyToken,
  verifyAdmin,
  async (req, res) => {
    try {
      const db = client.db("tour-voz");

      const result = await db.collection("bookings")
        .find()
        .sort({ createdAt: -1 })
        .toArray();

      res.json(result);
    } catch (err) {
      console.error(err);

      res.status(500).json({
        message: "Failed to fetch bookings",
      });
    }
  }
);

// =====================================
// Create Booking - Public
// =====================================
app.post("/bookings", async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      people,
      date,
      destinationId,
    } = req.body;

    if (
      !name?.trim() ||
      !email?.trim() ||
      !phone?.trim() ||
      !Number.isInteger(Number(people)) ||
      Number(people) < 1 ||
      !date
    ) {
      return res.status(400).json({
        message: "Please provide valid booking information",
      });
    }

    const db = client.db("tour-voz");

    let destinationInfo = null;

    if (destinationId) {
      if (!ObjectId.isValid(destinationId)) {
        return res.status(400).json({
          message: "Invalid destination ID",
        });
      }

      destinationInfo = await db.collection("destination").findOne({
        _id: new ObjectId(destinationId),
      });

      if (!destinationInfo) {
        return res.status(404).json({
          message: "Destination not found",
        });
      }
    }

    const totalPrice = destinationInfo
      ? Number(destinationInfo.price) * Number(people)
      : 0;

    const booking = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      people: Number(people),
      date,

      destinationId: destinationInfo
        ? destinationInfo._id.toString()
        : "",

      destinationName: destinationInfo?.name || "",
      destinationImage: destinationInfo?.image || "",
      destinationLocation: destinationInfo?.location || "",
      destinationCountry: destinationInfo?.country || "",
      destinationDuration: destinationInfo?.duration || "",

      destinationPrice: destinationInfo
        ? Number(destinationInfo.price)
        : 0,

      totalPrice,

      status: "pending",
      createdAt: new Date(),
    };

    const result = await db
      .collection("bookings")
      .insertOne(booking);

    res.status(201).json({
      message: "Booking submitted successfully!",
      bookingId: result.insertedId,
      booking,
    });
  } catch (err) {
    console.error("Booking error:", err);

    res.status(500).json({
      message: "Failed to submit booking",
    });
  }
});

// =====================================
// Update Booking Status - Admin Only
// =====================================
app.patch(
  "/bookings/:id",
  verifyToken,
  verifyAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({
          message: "Invalid booking ID",
        });
      }

      if (!["pending", "confirmed", "cancelled"].includes(status)) {
        return res.status(400).json({
          message: "Invalid booking status",
        });
      }

      const db = client.db("tour-voz");

      const result = await db.collection("bookings").updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            status,
            updatedAt: new Date(),
          },
        }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({
          message: "Booking not found",
        });
      }

      res.json({
        message: "Booking status updated successfully",
        status,
      });
    } catch (err) {
      console.error("Update booking error:", err);

      res.status(500).json({
        message: "Failed to update booking status",
      });
    }
  }
);

// =====================================
// Delete Booking - Admin Only
// =====================================
app.delete(
  "/bookings/:id",
  verifyToken,
  verifyAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({
          message: "Invalid booking ID",
        });
      }

      const db = client.db("tour-voz");

      const result = await db.collection("bookings").deleteOne({
        _id: new ObjectId(id),
      });

      if (result.deletedCount === 0) {
        return res.status(404).json({
          message: "Booking not found",
        });
      }

      res.json({
        message: "Booking deleted successfully",
      });
    } catch (err) {
      console.error("Delete booking error:", err);

      res.status(500).json({
        message: "Failed to delete booking",
      });
    }
  }
);

// =====================================
// Connect MongoDB and Start Server
// =====================================
async function startServer() {
  try {
    await client.connect();

    console.log("You successfully connected to MongoDB!");

    app.listen(PORT, () => {
      console.log(`Server is running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("MongoDB connection failed:", err);
  }
}

startServer();
