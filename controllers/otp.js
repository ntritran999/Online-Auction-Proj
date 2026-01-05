import nodemailer from "nodemailer";
import crypto from "crypto";
import * as otpModel from "../models/otpModel.js";

const adminGmail = process.env.EMAIL_USER;
const adminGmailPass = process.env.EMAIL_PASS;

// OTP function
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth:{
    user: adminGmail,
    pass: adminGmailPass,
  }
});
const generateOTP = () =>{
  return crypto.randomInt(100000, 999999).toString();
};

const sendOTP = async(email) => {
  const otp = generateOTP();
  const expiredAt = new Date(Date.now() + 2 * 60 * 1000);
  // insert otp into db
  const error = await otpModel.addOtp(email, otp, expiredAt);
  if(error){
    console.log('Error insert otp db', error);
    return;
  }

  const mailOptions = {
    from: adminGmail,
    to: email,
    subject: 'Your OTP code',
    text: `Your OTP code is ${otp}`,
  };
  transporter.sendMail(mailOptions, (error, info) =>{
    if(error){
      console.log('Error send email', error);
      return;
    }
    console.log('OTP sent');
  });
};

const verifyOTP = async (email, otp) => {
  const { data, error } = await otpModel.findUnexpiredOtp(email, otp);
  if(!data || data.length === 0){
    console.log('OTP invalid or expired.');
    return false;
  }

  if(error){
    console.error('Error verifying OTP:', error.message);
    return false;
  }
  return true;
}

// Hàm xóa OTP hết hạn
const cleanExpiredOTPs = async () => {
  const { data, error } = await otpModel.deleteExpiredOtps();
  if(error) 
      console.error('Error deleting expired OTPs:', error);
  else 
      console.log('Expired OTPs deleted:', data);
  
};

const generateRandomPassword = () => {
  return crypto.randomBytes(4).toString('hex');
};


const sendNewPasswordEmail = async (email, newPassword) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: '[Admin] Đặt lại mật khẩu thành công',
        html: `
            <p>Chào bạn,</p>
            <p>Quản trị viên đã đặt lại mật khẩu cho tài khoản của bạn.</p>
            <p>Mật khẩu mới là: <strong>${newPassword}</strong></p>
            <p>Vui lòng đăng nhập và đổi mật khẩu ngay để đảm bảo an toàn.</p>
        `
    };
    return transporter.sendMail(mailOptions);
};

export {sendOTP, verifyOTP, cleanExpiredOTPs, generateRandomPassword, sendNewPasswordEmail}