// src/controllers/utilsController.js
const db = require("../models");

exports.getPincodeData = async (req, res) => {
  try {
    const { state, city, pincode } = req.query;

    // Check if at least one of 'state', 'city', or 'pincode' parameters exists in the query
    if (!state && !city && !pincode) {
      return res
        .status(400)
        .json({
          error:
            "At least one of state, city, or pincode is required in the query",
        });
    }

    // Build the where condition based on the available parameters
    const whereCondition = {};
    if (state) {
      whereCondition.state = state;
    }
    if (city) {
      whereCondition.city = city;
    }
    if (pincode) {
      whereCondition.pincode = pincode;
    }

    // Find all rows from the 'pincode' table where is_active=1 and the provided conditions match
    const pincodes = await db.Pincode.findAll({
      where: {
        is_active: 1,
        ...whereCondition,
      },
    });

    res.status(200).json({ pincodes });
    console.log("pincodes==" + JSON.stringify(pincodes));
  } catch (error) {
    console.error(error);
    //   res.status(500).json({ error: 'Failed to get pincode information' });
    res.status(500).json({ message: error.message });
  }
};
