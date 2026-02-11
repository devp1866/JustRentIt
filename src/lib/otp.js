import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export const generateOTP = () => {
    return crypto.randomInt(100000, 999999).toString();
};

export const hashOTP = async (otp) => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(otp, salt);
};

export const verifyOTP = async (inputOtp, storedHash) => {
    return await bcrypt.compare(inputOtp, storedHash);
};
