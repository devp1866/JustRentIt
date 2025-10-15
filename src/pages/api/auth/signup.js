import dbConnect from "../../../utils/db";
import User from "../../../models/User";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    await dbConnect();
    const { email, password, full_name } = req.body;
    if (!email || !password || !full_name) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: "User already exists" });
    }

    const user = await User.create({
      email,
      password,
      full_name,
      user_type: "renter",
    });

    return res
      .status(201)
      .json({ message: "User registered", user: { email: user.email, full_name: user.full_name } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
}
