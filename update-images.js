
import "dotenv/config";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

const images = {
  Beijing: "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=900&q=80",
  Chengdu: "https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?auto=format&fit=crop&w=900&q=80",
  Guangzhou: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=900&q=80",
  Guilin: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=900&q=80",
  Hainan: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=900&q=80",
  Hangzhou: "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=900&q=80",
  Huangshan: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=900&q=80",
  "Inner Mongolia": "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
  Shanghai: "https://images.unsplash.com/photo-1548919973-5cef591cdbc9?auto=format&fit=crop&w=900&q=80",
  Shenzhen: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=900&q=80",
  Suzhou: "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=900&q=80"
};

async function main() {
  try {
    await client.connect();

    const collection = client
      .db("tour-voz")
      .collection("destination");

    for (const [name, image] of Object.entries(images)) {
      const result = await collection.updateMany(
        { name: name },
        { $set: { image: image } }
      );

      console.log(
        `${name}: matched ${result.matchedCount}, updated ${result.modifiedCount}`
      );
    }

    console.log("Image update finished!");
  } catch (error) {
    console.error(error);
  } finally {
    await client.close();
  }
}

main();
