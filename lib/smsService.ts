import axios from "axios";

// 2Factor API Configuration
const TWOFACTOR_API_KEY =
  process.env.TWOFACTOR_API_KEY || "68289a55-4d40-11f0-a562-0200cd936042";
const TWOFACTOR_BASE_URL = "https://2factor.in/API/V1";

export const send2FactorOTP = async (
  phoneNumber: string,
  otp: string | null = null
) => {
  try {
    const cleanPhoneNumber = phoneNumber
      .replace(/^\+91/, "")
      .replace(/\D/g, "");

    if (cleanPhoneNumber.length !== 10) {
      throw new Error("Invalid phone number format. Must be 10 digits.");
    }

    let apiUrl;
    if (otp) {
      apiUrl = `${TWOFACTOR_BASE_URL}/${TWOFACTOR_API_KEY}/SMS/${cleanPhoneNumber}/${otp}`;
    } else {
      apiUrl = `${TWOFACTOR_BASE_URL}/${TWOFACTOR_API_KEY}/SMS/${cleanPhoneNumber}/AUTOGEN`;
    }

    const response = await axios.get(apiUrl, {
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.data && response.data.Status === "Success") {
      return {
        success: true,
        sessionId: response.data.Details,
        message: "OTP sent successfully via 2Factor",
        phoneNumber: cleanPhoneNumber,
      };
    } else {
      throw new Error(
        `2Factor API Error: ${response.data?.Details || "Unknown error"}`
      );
    }
  } catch (error: any) {
    console.error("2Factor SMS Error:", error.message || error);
    return {
      success: false,
      error: "Failed to send SMS",
      details: error.message,
    };
  }
};

export const verify2FactorOTP = async (sessionId: string, otp: string) => {
  try {
    const apiUrl = `${TWOFACTOR_BASE_URL}/${TWOFACTOR_API_KEY}/SMS/VERIFY/${sessionId}/${otp}`;

    const response = await axios.get(apiUrl, {
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.data && response.data.Status === "Success") {
      return {
        success: true,
        message: "OTP verified successfully",
        details: response.data.Details,
      };
    } else {
      return {
        success: false,
        error: "Invalid OTP",
        details: response.data?.Details || "OTP verification failed",
      };
    }
  } catch (error: any) {
    console.error("2Factor OTP Verification Error:", error.message || error);
    return {
      success: false,
      error: "Failed to verify OTP",
      details: error.message,
    };
  }
};
