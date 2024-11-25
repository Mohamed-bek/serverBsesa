import jwt from "jsonwebtoken";
import User from "../models/User.js";
import bcrypt from "bcrypt";
import { generateTokens } from "../utitlitis/token.js";
import validator from "validator";
import Order from "../models/Order.js";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import ejs from "ejs";
import { transporter } from "../utitlitis/sendMail.js";
import generateMonthlyData from "../utitlitis/analytics.js";
import uploadToSpaces, {
  deleteFromSpaces,
} from "../utitlitis/awsDigitalOcean.js";
import QuizResponse from "../models/QuizResponse.js";

const CreateToken = (user) => {
  const activation = Math.floor(1000 + Math.random() * 9000).toString();
  const token = jwt.sign({ user, activation }, `${process.env.TOKEN_SECRET}`);
  return { token, activation };
};

export const CreateUser = async (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  console.log(firstName, lastName);
  try {
    const userExist = await User.findOne({ email });
    if (userExist) {
      return res.status(500).json({ message: `User already exist` });
    }
    const { token, activation } = CreateToken({
      firstName,
      lastName,
      email,
      password,
    });

    const actiavtionUrl = `${process.env.FRONTEND_URL}/activate_account/${token}`;

    const template = fs.readFileSync(
      path.join(__dirname, "../mail/mail.ejs"),
      "utf8"
    );

    const html = ejs.render(template, {
      actiavtionUrl,
      username: email,
      activationCode: activation,
    });

    await transporter.sendMail({
      from: `Elearning <${process.env.SMTP_MAIL}>`,
      to: email,
      subject: `Activation Code is ${activation}`,
      html,
    });

    res.cookie("jwt", token, { maxAge: 3600 });
    res.status(200).json({ token, activation });
  } catch (err) {
    console.log(err);
    res.status(500).json({ err: err });
  }
};

export const ActivateUser = async (req, res) => {
  let { activationCode, token } = req.body;
  if (!token) {
    token = req.cookies.jwt;
  }
  if (!token) return res.status(403).json({ err: "You Must provide a Token" });
  try {
    const { user, activation } = jwt.verify(
      token,
      `${process.env.TOKEN_SECRET}`
    );
    if (activation != activationCode) {
      throw new Error(`Invalid activation code`);
    }
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const { firstName, lastName, email } = user;
    const newUser = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
    });

    if (!newUser) {
      return res.status(400).json({ message: "User creation failed" });
    }
    const { accessToken, refreshToken } = generateTokens(newUser);

    newUser.refreshToken = refreshToken;
    await newUser.save();

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({ user: newUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const Login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Email Dosen't exist" });
    }
    if (!(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Password incorrect" });
    }

    const { accessToken, refreshToken } = generateTokens(user);

    user.refreshToken = refreshToken;
    await user.save();

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({ message: "Login successful", user });
  } catch (error) {
    res.status(error.status || 500).json({ err: error.message });
  }
};

export const RefreshToken = (req, res) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) return res.sendStatus(401);

    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
      async (err, userData) => {
        if (err) return res.sendStatus(403);
        console.log("the user : ", userData);
        const userId = userData.id;

        const user = await User.findById(userId);
        if (!user || user.refreshToken !== refreshToken)
          return res.sendStatus(403);

        const newTokens = generateTokens(user);
        user.refreshToken = newTokens.refreshToken;

        await user.save();
        res.cookie("accessToken", newTokens.accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.cookie("refreshToken", newTokens.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        res.status(200).json({ message: "Refresh token Succeeded" });
      }
    );
  } catch (error) {
    res.status(error.status || 400).json({ err: error.message });
  }
};

export const LogOut = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) return res.sendStatus(401);

    await User.findOneAndUpdate(
      { refreshToken },
      { $unset: { refreshToken: "" } }
    );

    res.cookie("accessToken", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: -1,
      expires: new Date(0),
    });

    res.cookie("refreshToken", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: -1,
      expires: new Date(0),
    });

    res.status(204).json({ message: "Log Out Successfully" });
  } catch (error) {
    res.status(error.status || 404).json({ err: error.message });
  }
};

export const UpdateAvatar = async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User Not Found" });
    }
    const OldPath = user.image;

    const imageUrl = await uploadToSpaces(file, "/UsersAvatars");

    user.image = imageUrl;
    await user.save();

    if (OldPath) {
      await deleteFromSpaces(OldPath);
    }
    res.status(200).json({ message: "Upload Success", user });
  } catch (error) {
    console.error("Error uploading avatar:", error);
    res.status(error.status || 500).json({ err: error.message });
  }
};

export const UpdateUserData = async (req, res) => {
  try {
    // Extract user ID and new data from request
    const userId = req.user.id; // Assuming you have user ID from authentication middleware
    const { firstName, lastName } = req.body;

    // Find user and update data
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Update firstName if provided
    if (firstName) {
      user.firstName = firstName;
    }

    // Update lastName if provided
    if (lastName) {
      user.lastName = lastName;
    }

    // Save updated user data
    await user.save();

    // Send success response
    res.status(200).json({ message: "User data updated successfully.", user });
  } catch (error) {
    console.error("Error updating user data:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const UpdateEmail = async (req, res) => {
  try {
    const userId = req.user.id;
    const { email, password } = req.body;

    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: "Invalid email format." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser._id !== userId) {
      return res
        .status(409)
        .json({ message: "Email already in use by another account." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (!(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    user.email = email;
    await user.save();

    res.status(200).json({ message: "Email updated successfully." });
  } catch (error) {
    console.error("Error updating email:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

const isStrongPassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password); // Check for uppercase letters
  const hasLowerCase = /[a-z]/.test(password); // Check for lowercase letters
  const hasNumbers = /[0-9]/.test(password); // Check for numbers
  const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password); // Check for special characters

  // Check if password meets all criteria
  const isValidLength = password.length >= minLength;

  return (
    isValidLength &&
    hasUpperCase &&
    hasLowerCase &&
    hasNumbers &&
    hasSpecialChars
  );
};

export const UpdatePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { password, newPassword } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (!(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Password Inccorect" });
    }
    if (!isStrongPassword(newPassword)) {
      return res.status(401).json({
        message:
          "Password Is Not Strong ,Must Have a number uppercase letters lowercase letters special characters and minimum length of 8",
      });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;

    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error updating email:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

const __dirname = path.dirname(new URL(import.meta.url).pathname);

export const initiatePasswordRecovery = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const token = crypto.randomBytes(32).toString("hex");
    user.resetToken = token;
    user.resetTokenExpiration = Date.now() + 3600000;
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;

    const template = fs.readFileSync(
      path.join(__dirname, "../mail/resetPassword.ejs"),
      "utf8"
    );

    const html = ejs.render(template, { resetUrl, username: email });

    await transporter.sendMail({
      from: `Elearning <${process.env.SMTP_MAIL}>`,
      to: email,
      subject: "Password Reset Request",
      html,
    });

    res.status(200).json({ message: "Reset link sent to your email." });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  try {
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiration: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token." });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpiration = undefined;
    await user.save();

    res.status(200).json({ message: "Password has been reset." });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

// async function makeApiRequest(url, options = {}) {
//   // Retrieve the access token and refresh token from your storage (e.g., local storage, cookies)
//   let accessToken = localStorage.getItem('accessToken'); // Assuming you're using local storage
//   const refreshToken = localStorage.getItem('refreshToken'); // Get refresh token

//   // Set the Authorization header for the request
//   options.headers = {
//     ...options.headers,
//     'Authorization': `Bearer ${accessToken}`,
//   };

//   // Function to refresh the access token
//   const refreshAccessToken = async () => {
//     const response = await fetch('http://localhost:3000/refresh', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({ refreshToken }),
//     });

//     if (!response.ok) {
//       throw new Error('Failed to refresh access token');
//     }

//     const data = await response.json();
//     // Store the new access token
//     localStorage.setItem('accessToken', data.accessToken);
//     return data.accessToken;
//   };

//   try {
//     // Make the initial request
//     const response = await fetch(url, options);

//     // Check if the response indicates an expired token (401 Unauthorized)
//     if (response.status === 401) {
//       // Try to refresh the access token
//       accessToken = await refreshAccessToken();

//       // Retry the original request with the new access token
//       options.headers['Authorization'] = `Bearer ${accessToken}`;
//       const retryResponse = await fetch(url, options);

//       // If the retry is successful, return the response data
//       if (retryResponse.ok) {
//         return await retryResponse.json();
//       } else {
//         throw new Error('Failed to fetch data after refreshing token');
//       }
//     }

//     // If the original request was successful, return the response data
//     return await response.json();
//   } catch (error) {
//     console.error('Error during API request:', error);
//     throw error; // Rethrow the error for further handling if needed
//   }
// }

// async function getProtectedData() {
//   try {
//     const data = await makeApiRequest('http://localhost:3000/protected', {
//       method: 'GET',
//     });
//     console.log('Protected Data:', data);
//   } catch (error) {
//     console.error('Failed to fetch protected data:', error);
//   }
// }

export const getUserAnalytics = async (req, res) => {
  try {
    const { months, counts } = await generateMonthlyData(User);
    res.status(200).json({ months, counts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const userCertificate = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log("User: " + userId);
    const userQuizes = await QuizResponse.find({ userId })
      .select("certificate")
      .populate({ path: "courseId", select: "title thumbnail" });
    res.status(200).json({ certificate: userQuizes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const userCourses = async (req, res) => {
  try {
    const userId = req.user.id;
    const courses = await Order.find({
      user: userId,
      paymentStatus: "completed",
    }).populate({
      path: "course",
      select: "title thumbnail description",
    });
    res.status(200).json({ courses });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
