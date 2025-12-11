const bcrypt = require("bcryptjs");

async function main() {
  const plain = "admin123"; // cambia si quieres
  const hash = await bcrypt.hash(plain, 10);
  console.log("HASH:", hash);
}

main();