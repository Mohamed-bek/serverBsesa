import Membership from "../models/MemeberShipModel.js";

export const createMembership = async (req, res) => {
  try {
    const {
      name,
      price,
      duration,
      description,
      benefits,
      discount,
      paymentId,
      link,
    } = req.body;
    if (discount && (0 > discount || discount > 100)) {
      res.status(500).json({
        message:
          " The Discount Should Be In The Range Of 0% - 100%  and  your discount is : " +
          discount +
          "%",
      });
    }
    const newMembership = new Membership({
      paymentId,
      name,
      link,
      duration,
      price,
      description,
      benefits,
      discount,
    });
    await newMembership.save();
    res.status(201).json({ message: true, data: newMembership });
  } catch (error) {
    res.status(500).json({ message: false, err: error.message });
  }
};

export const getAllMemberships = async (req, res) => {
  try {
    const memberships = await Membership.find();
    res.status(200).json({ plans: memberships });
  } catch (error) {
    res
      .status(500)
      .json({ message: "failed To get MemeberShips", err: error.message });
  }
};

export const getMembershipById = async (req, res) => {
  try {
    const { id } = req.params;
    const membership = await Membership.findById(id);

    if (!membership) {
      return res
        .status(404)
        .json({ success: false, message: "Membership not found" });
    }

    res.status(200).json({ membership });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Fail To get MemeberShip", err: error.message });
  }
};

export const updateMembership = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updatedMembership = await Membership.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!updatedMembership) {
      return res
        .status(404)
        .json({ success: false, message: "Membership not found" });
    }

    res.status(200).json({ memebership: updatedMembership });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

export const deleteMembership = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedMembership = await Membership.findByIdAndDelete(id);

    if (!deletedMembership) {
      return res.status(404).json({ message: "Membership not found" });
    }

    res.status(200).json({ message: "Membership deleted" });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};
