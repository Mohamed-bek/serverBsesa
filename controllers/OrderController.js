import Course from "../models/Course.js";
import Order from "../models/Order.js";
import UserMembership from "../models/UserMembership.js";
import generateLast6MonthsData from "../utitlitis/analytics.js";

export const createOrder = async (req, res) => {
  try {
    const { courseId } = req.body;
    const userId = req.user.id;
    if (!userId)
      return res.status(401).json({ error: "You have to create an account" });
    const course = await Course.findById(courseId);
    if (!course) return res.status(401).json({ error: "Course not found" });
    const isPurchased = await Order.findOne({
      user: userId,
      course: course._id,
    });
    if (isPurchased?.paymentStatus === "completed") {
      return res.status(401).json({ error: "The order has already been" });
    }

    const userMembership = await UserMembership.findOne({
      userId,
      status: "active",
    }).populate({
      path: "membershipId",
      select: "discount",
    });
    let discount = 0;
    let amount = course.price;
    if (userMembership) {
      discount = userMembership.membershipId.discount;
      amount = amount - (amount * discount) / 100;
    }
    if (isPurchased?.paymentStatus === "pending") {
      return res.status(201).json({ order: isPurchased, amount });
    }
    const newOrder = new Order({
      user: userId,
      course: course._id,
    });

    await newOrder.save();
    res.status(201).json({ order: newOrder, amount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

export const getOrders = async (req, res) => {
  try {
    const { paymentStatus, course, user, startDate } = req.query;

    let query = {};
    if (startDate) {
      const start = new Date(startDate);
      query = {
        createdAt: { $gte: start },
      };
    }
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (course) query.course = course;
    if (user) query.user = user;

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .populate({ path: "user", select: "firstName lastName image" })
      .populate({ path: "course", select: "title thumbnail" });
    res.status(200).json({ orders });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId)
      .populate({ path: "user", select: "firstName lastName image" })
      .populate({ path: "course", select: "title thumbnail" });
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.status(200).json({ order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getOrderAnalyst = async (req, res) => {
  try {
    const { months, counts } = await generateLast6MonthsData(Order);
    res.status(200).json({ months, counts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
