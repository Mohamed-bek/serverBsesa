import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
dotenv.config();

export const authenticateToken = (req, res, next) => {
  const { accessToken } = req.cookies;

  if (!accessToken) return res.sendStatus(401);

  jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

export const authorizeRoles = (allowedRoles) => {
  return async (req, res, next) => {
    const id = req.user.id;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!allowedRoles.includes(user.role)) {
      return res
        .status(401)
        .json({ message: `Access denied for role: ${user.role}` });
    }
    req.user.role = user.role;
    next();
  };
};

export const getIdUser = (req, res, next) => {
  try {
    const { accessToken } = req.cookies;
    if (!accessToken) return next();

    const user = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    req.userId = user.id;
    next();
  } catch (error) {
    next();
  }
};
