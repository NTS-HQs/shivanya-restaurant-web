import axios from "axios";

const API_BASE_URL = "/api/user/auth";

export const sendOTP = async (phoneNumber: string) => {
  const response = await axios.post(`${API_BASE_URL}/send-otp`, {
    phoneNumber,
  });
  return response.data;
};

export const verifyOTP = async (
  phoneNumber: string,
  otp: string,
  name?: string
) => {
  const response = await axios.post(`${API_BASE_URL}/verify-otp`, {
    phoneNumber,
    otp,
    name,
  });
  return response.data;
};
