import { uploadToS3 } from "../../lib/s3";
import formidable from "formidable";
import fs from "fs";

export const config = {
    api: {
        bodyParser: false, 
    },
};

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    try {
        const form = formidable({});

        const [fields, files] = await form.parse(req);

        const type = fields.type?.[0];
        const propertyName = fields.propertyName?.[0];
        const file = files.file?.[0];

        if (!file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        if (!type) {
            return res.status(400).json({ message: "Upload type is required" });
        }

        let folderPath = "";
        let fileName = file.originalFilename;

        if (type === "property" || type === "room") {
            if (!propertyName) {
                return res.status(400).json({ message: "Property name is required for property/room images" });
            }
            const safePropertyName = propertyName.replace(/[^a-zA-Z0-9-_]/g, "_");
            folderPath = `property-images/${safePropertyName}`;
        } else if (type === "landlord") {
            folderPath = "landlord-identity";
        } else {
            return res.status(400).json({ message: "Invalid upload type" });
        }

        const url = await uploadToS3(file, folderPath, fileName);

        return res.status(200).json({ url });
    } catch (error) {
        console.error("Upload error:", error);
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
}
