import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import otpGenerator from 'otp-generator'
import chatbotOTP from '../models/chatbotOTP.js'
import users from "../models/user.js";
import loginInfo from "../models/loginInfo.js";
import nodemailer from 'nodemailer'

export const signup = async (req, res) => {
  const { name, email, password,deviceInfo } = req.body;
  try {
    const existinguser = await users.findOne({ email });
    if (existinguser) {
      return res.status(404).json({ message: "User already Exist." });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = await users.create({
      name,
      email,
      password: hashedPassword,
    });
    const loginInfoObj = { ...deviceInfo, id: newUser._id }
    await loginInfo.create(loginInfoObj)
    const token = jwt.sign(
      { email: newUser.email, id: newUser._id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    res.status(200).json({ result: newUser, token });
  } catch (error) {
    res.status(500).json("Something went worng...");
  }
};

export const login = async (req, res) => {
  const { email, password, deviceInfo } = req.body;

  try {
    const existinguser = await users.findOne({ email });
    if (!existinguser) {
      return res.status(404).json({ message: "User don't Exist." });
    }
    const isPasswordCrt = await bcrypt.compare(password, existinguser.password);
    if (!isPasswordCrt) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const loginInfoObj = { ...deviceInfo, id: existinguser._id }
    const token = jwt.sign(
      { email: existinguser.email, id: existinguser._id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    await loginInfo.create(loginInfoObj)
    res.status(200).json({ result: existinguser, token });
  } catch (error) {
    res.status(500).json("Something went worng...");
  }
};

const sendEmail = async(email, OTP) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD
    }
  })
  try {
    await transporter.sendMail({
      from: `Stackoverflow clone <${process.env.SMTP_EMAIL}>`,
      to: email,
      subject: "Chatbot OTP",
      html:`<!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Document</title>
      </head>
      <body style="text-align: center;">
          <p style="font-size: large;"><span style="font-size: xx-large; color: red;">${OTP}</span> is your OTP to ask question to chatbot.</p>
          <p style="font-size: medium;color: rgb(60, 60, 60);">Do not share this OTP to anyone.</p>
      </body>
      </html>`
    })
  } catch (error) {
    console.log(error)
  }
}

export const generateOTP = async (req, res) => {
  const { email } = req.body;
  try {
    const OTP=otpGenerator.generate(6,{upperCaseAlphabets:false,specialChars:false,lowerCaseAlphabets:false})
    await sendEmail(email,OTP)
    await chatbotOTP.findOneAndReplace({email},{email,OTP,expiresAt: Date.now()},{upsert: true})
    res.status(200).json({message:`OTP sent successfully to ${email}`})
  } catch (error) {
    console.log(error)
    res.status(500).json({message:"Internal Server Error."})
  }
}

export const verifyOTP=async(req,res) => {
  const {OTP,email} = req.body;
  try {
    const storedDetails=await chatbotOTP.findOne({email})
    if (!storedDetails) {
      return res.status(404).json({message:"OTP expired."})
    }
    const storedOTP=storedDetails.OTP;
    if (storedOTP!==OTP) {
      return res.status(401).json({message:"incorrect OTP."})
    }
    await chatbotOTP.findOneAndDelete({email})
    res.status(200).json({message:"OTP matched."})

  } catch (error) {
    console.log(error)
    res.status(500).json({message:"Internal Server Error."})
  }
}

