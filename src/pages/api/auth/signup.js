import dbConnect from "../../../utils/db";
import User from "../../../models/User";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    await dbConnect();
    const { full_name, email, password, user_type, phone } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const query = { $or: [{ email }] };
    if (phone) {
      query.$or.push({ phone });
    }

    const existingUser = await User.findOne(query);
    if (existingUser) {
      return res.status(400).json({ error: "User with this email or phone already exists" });
    }

    const newUser = await User.create({
      full_name,
      email,
      password, // plain
      user_type: user_type || "renter",
      phone: phone || undefined,
      is_verified: !!phone,
    });

    return res.status(201).json({
      message: "User registered",
      user: {
        email: newUser.email,
        full_name: newUser.full_name,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
}
