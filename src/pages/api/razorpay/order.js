import Razorpay from "razorpay";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    try {
        const { amount, currency = "INR" } = req.body;

        if (!amount) {
            return res.status(400).json({ message: "Amount is required" });
        }

        const instance = new Razorpay({
            key_id: process.env.RAZORPAY_API,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });

        const options = {
            amount: Math.round(amount * 100), 
            currency,
            receipt: `receipt_${Date.now()}`,
        };

        const order = await instance.orders.create(options);

        if (!order) {
            return res.status(500).json({ message: "Some error occured" });
        }

        res.status(200).json(order);
    } catch (error) {
        console.error("Razorpay Order Error:", error);
        res.status(500).json({ message: error.message });
    }
}
