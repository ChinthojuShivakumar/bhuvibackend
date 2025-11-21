// src/middlewares/authMiddleware.js
// const jwtUtils = require('../utils/jwtUtils');
const { verifyToken } = require("../utils/jwtUtils");
const { getUserById } = require("../services/userService");
const db = require("../models");

const isAdminOrSuperadmin = async (req, res, next) => {
  try {
    // Get the JWT token from the request headers
    const token = req.headers.authorization.split(" ")[1];

    if (!token) {
      return res
        .status(401)
        .json({ message: "Authentication token is missing" });
    }

    // Verify the token
    const decodedToken = verifyToken(token);

    // Get the user ID from the decoded token
    // const user_id = decodedToken.user_id;
    const user_type_mapping_id = decodedToken.user_type_mapping_id;

    // Retrieve the user from the database
    // const user = await getUserById(user_id);

    const query = `
      SELECT u.*, utm.*, ut.user_type_category_id
      FROM user_type_mapping AS utm
      INNER JOIN user AS u ON utm.user_id = u.user_id
      LEFT JOIN user_type AS ut ON utm.user_type_id = ut.user_type_id
      WHERE utm.user_type_mapping_id = ${user_type_mapping_id}
    `;

    // const [results, metadata] = await db.sequelize.query(query, {
    //   replacements: { user_type_mapping_id },
    //   type: db.sequelize.QueryTypes.SELECT,
    // });

    // if (results.length === 0) {
    //   throw new Error('User not found');
    // }

    // const user = results[0];
    const users = await db.sequelize.query(query, {
      replacements: {},
      type: db.sequelize.QueryTypes.SELECT,
    });
    const user = users[0];

    // console.error(user)

    // Remove the password field for security
    delete user.password;

    // Check if the user is valid and has admin or superadmin privileges
    if (user && (user.is_admin || user.is_superadmin)) {
      req.user = user; // Add user details to req.user
      // Forward the request to the respective route
      next();
    } else {
      // Throw an error for unauthorized access
      throw new Error("Unauthorized Access");
    }
  } catch (error) {
    // Throw an error for invalid or expired token
    console.error(error);
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

const authenticateToken = (req, res, next) => {
  const token = req.headers["authorization"];

  if (!token) {
    return res.status(401).json({ message: "Authentication token is missing" });
  }

  try {
    const decoded = jwtUtils.verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid authentication token" });
  }
};

const addUserToRequest = async (req, res, next) => {
  try {
    // Get the JWT token from the request headers
    const token = req.headers.authorization.split(" ")[1];

    if (!token) {
      return res
        .status(401)
        .json({ message: "Authentication token is missing" });
    }

    // Verify the token
    const decodedToken = verifyToken(token);

    // Get the user ID from the decoded token
    // const user_id = decodedToken.user_id;
    const user_type_mapping_id = decodedToken.user_type_mapping_id;

    // Retrieve the user from the database
    // const user = await getUserById(user_id);

    const query = `
      SELECT u.*, utm.*, ut.user_type_category_id
      FROM user_type_mapping AS utm
      INNER JOIN user AS u ON utm.user_id = u.user_id
      LEFT JOIN user_type AS ut ON utm.user_type_id = ut.user_type_id
      WHERE utm.user_type_mapping_id = ${user_type_mapping_id}
    `;

    // const [results, metadata] = await db.sequelize.query(query, {
    //   replacements: { user_type_mapping_id },
    //   type: db.sequelize.QueryTypes.SELECT,
    // });

    // if (results.length === 0) {
    //   throw new Error('User not found');
    // }

    // const user = results[0];
    const users = await db.sequelize.query(query, {
      replacements: {},
      type: db.sequelize.QueryTypes.SELECT,
    });
    const user = users[0];

    // console.error(user)

    // Remove the password field for security
    delete user.password;

    // Check if the user is valid and has admin or superadmin privileges
    if (user) {
      req.user = user; // Add user details to req.user
      // Forward the request to the respective route
      next();
    } else {
      // Throw an error for unauthorized access
      throw new Error("User doesn't exist");
    }
  } catch (error) {
    // Throw an error for invalid or expired token
    console.error(error);
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

module.exports = {
  authenticateToken,
  isAdminOrSuperadmin,
  addUserToRequest,
};
