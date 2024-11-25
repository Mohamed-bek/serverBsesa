import { Router } from "express";
import {
  createOrder,
  getOrderAnalyst,
  getOrderById,
  getOrders,
} from "../controllers/OrderController.js";
import { authenticateToken, authorizeRoles } from "../middleware/Auth.js";

const OrderRouter = Router();

OrderRouter.post("/order", authenticateToken, createOrder);
OrderRouter.get(
  "/orders",
  authenticateToken,
  authorizeRoles(["admin"]),
  getOrders
);
OrderRouter.get(
  "/order/:orderId",
  authenticateToken,
  authorizeRoles(["admin"]),
  getOrderById
);
OrderRouter.get(
  "/order_analytics",
  authenticateToken,
  authorizeRoles(["admin"]),
  getOrderAnalyst
);

export default OrderRouter;
