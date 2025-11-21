import bcrypt from "bcrypt";

import { verifyOTP } from "./otp.js";
import { addUser } from "../models/userModel.js";
import { deleteOtp } from "../models/otpModel.js";

const createUser = async (req, res) => {
    const { email, otp, password, full_name, address } = req.body;
    try {
        const isValid = await verifyOTP(email, otp); 

        if (!isValid) {
            return res.status(400).json({ error: "Mã OTP không hợp lệ hoặc đã hết hạn." });
        }

        const hash = await bcrypt.hash(password, 10);
        // add into db
        const { data, error } = await addUser(full_name, email, address, hash);

        if (error) {
            console.error(error);
            return res.status(400).json({ error: error.message });
        }

        // Xóa OTP đã sử dụng
        await deleteOtp(email, otp);

        res.json({ message: "Đăng ký thành công!", user: data });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
};

export { createUser };