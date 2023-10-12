const mySql = require("mysql");

const connection = mySql.createConnection({
  host: "localhost",
  user: "mwsampur_app",
  password: "mwsampur_app",
  database: "mwsampur_app",
});
connection.connect();

connection.on("connect", (err) => {
  if (err) {
    // console.log(err)
  } else {
    console.log("MySQL Connected");
    fillVoucherCodes();
  }
});

const products = [
  {
    item_code: "Aavante Bar 1280",
    discount: 53,
  },
  {
    item_code: "FNKEFREW6H15SDST",
    discount: 29,
  },
  {
    item_code: "KMMIX50N3SDBB",
    discount: 46,
  },
  {
    item_code: "KNZES10T1PDBM",
    discount: 43,
  },
  {
    item_code: "KNZES10R1PDBM",
    discount: 43,
  },
  {
    item_code: "KNGLP10W1MDBM",
    discount: 49,
  },
  {
    item_code: "Aavante Bar 4000DA",
    discount: 28,
  },
  {
    item_code: "KGSFAB15GHHR0-CMA",
    discount: 39,
  },
  {
    item_code: "HTL1045",
    discount: 27,
  },
  {
    item_code: "Aavante Bar 1198",
    discount: 59,
  },
  {
    item_code: 603,
    discount: 22,
  },
  {
    item_code: 680014,
    discount: 26,
  },
  {
    item_code: 680006,
    discount: 17,
  },
  {
    item_code: "KOTG30SSKMR0-CGO",
    discount: 28,
  },
  {
    item_code: 510015,
    discount: 6,
  },
  {
    item_code: "678-104-A",
    discount: 33,
  },
  {
    item_code: "HE0603-04",
    discount: 33,
  },
  {
    item_code: "19020B",
    discount: 30,
  },
  {
    item_code: "PC92-B",
    discount: 33,
  },
  {
    item_code: "27O (0) 08 001",
    discount: 57,
  },
  {
    item_code: "LD1 (0) 01 003",
    discount: 57,
  },
  {
    item_code: "FK6 (0) 09 001",
    discount: 53,
  },
  {
    item_code: "FK6 (0) 08 001",
    discount: 53,
  },
  {
    item_code: "FH3 (0) 08 001",
    discount: 53,
  },
  {
    item_code: "FH3 (0) 01 001",
    discount: 53,
  },
  {
    item_code: 5587111408,
    discount: 40,
  },
  {
    item_code: 3576310405,
    discount: 40,
  },
  {
    item_code: 2728640417,
    discount: 40,
  },
  {
    item_code: "FD6 (0) 08 001",
    discount: 43,
  },
  {
    item_code: "AH9098",
    discount: 52,
  },
  {
    item_code: "FX1 (0) 09 101",
    discount: 65,
  },
  {
    item_code: "24N (0) 09 003",
    discount: 32,
  },
  {
    item_code: "FD7 (0) 09 001",
    discount: 67,
  },
  {
    item_code: "FV6 (0) 01 101",
    discount: 38,
  },
  {
    item_code: "FT5 (0) 09 001",
    discount: 51,
  },
  {
    item_code: "FNKEFUMG3H22SDST",
    discount: 19,
  },
  {
    item_code: "Aavante Bar 1803",
    discount: 54,
  },
  {
    item_code: "Aavante Bar 3100D",
    discount: 40,
  },
  {
    item_code: "KRMPR18W2SCJJ",
    discount: 40,
  },
  {
    item_code: "Ujjwal Plus",
    discount: 10,
  },
  {
    item_code: "MMS6080B",
    discount: 17,
  },
  {
    item_code: "KKB10C3PDBH",
    discount: 35,
  },
  {
    item_code: "GNM002",
    discount: 10,
  },
  {
    item_code: "GNM003",
    discount: 28,
  },
  {
    item_code: "SN95",
    discount: 59,
  },
  {
    item_code: "NATLOXY",
    discount: 74,
  },
  {
    item_code: 41269,
    discount: 34,
  },
  {
    item_code: "HL1631/00",
    discount: 18,
  },
  {
    item_code: "HD4929/01",
    discount: 27,
  },
  {
    item_code: "FESCVC",
    discount: 24,
  },
  {
    item_code: "FTNVC",
    discount: 23,
  },
  {
    item_code: "FLV",
    discount: 16,
  },
  {
    item_code: "PGN093",
    discount: 33,
  },
  {
    item_code: "PIG12053",
    discount: 16,
  },
  {
    item_code: 36806,
    discount: 25,
  },
  {
    item_code: 36314,
    discount: 24,
  },
  {
    item_code: 30731,
    discount: 24,
  },
  {
    item_code: 20234,
    discount: 26,
  },
  {
    item_code: 41767,
    discount: 15,
  },
  {
    item_code: 36301,
    discount: 24,
  },
  {
    item_code: 30712,
    discount: 24,
  },
  {
    item_code: "GC1920/28",
    discount: 18,
  },
  {
    item_code: 30726,
    discount: 24,
  },
  {
    item_code: 35037,
    discount: 25,
  },
  {
    item_code: "AP12WL",
    discount: 21,
  },
  {
    item_code: 41971,
    discount: 32,
  },
  {
    item_code: "HDER695238M3",
    discount: 77,
  },
  {
    item_code: "HDES798078M3",
    discount: 77,
  },
  {
    item_code: "HDES798106M3",
    discount: 77,
  },
  {
    item_code: "HDES798019M3",
    discount: 77,
  },
  {
    item_code: "HEFQ068096M4",
    discount: 77,
  },
  {
    item_code: "HEFQ068083M4",
    discount: 77,
  },
  {
    item_code: "S96920",
    discount: 64,
  },
  {
    item_code: "CY6240",
    discount: 59,
  },
  {
    item_code: "CD3041",
    discount: 58,
  },
  {
    item_code: "LX175",
    discount: 30,
  },
  {
    item_code: "RAT011",
    discount: 33,
  },
  {
    item_code: "BF-630A-A",
    discount: 30,
  },
  {
    item_code: 5995202459,
    discount: 56,
  },
  {
    item_code: 5617606406,
    discount: 40,
  },
  {
    item_code: 7737202156,
    discount: 65,
  },
  {
    item_code: "HXDC517095N2",
    discount: 61,
  },
  {
    item_code: "FS2 (0) 09 001",
    discount: 49,
  },
  {
    item_code: "DM7787",
    discount: 50,
  },
];

const generateVoucherCode = () => {
  let alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  alphabet = alphabet.split("");
  let voucherCode = "";
  for (let segIndex = 0; segIndex < 9; segIndex++) {
    const randomIndex = Math.floor(Math.random() * alphabet.length);
    voucherCode += alphabet[randomIndex];
  }
  return voucherCode;
};

const fillVoucherCodes = async () => {
  for (let product of products) {
    const index = products.findIndex((e) => e.item_code === product.item_code);
    const code = generateVoucherCode();
    const dataObject = {
      id: index + 30,
      code: code,
      uid: 0,
      status: 0,
      amount: 0,
      percentage: product.discount,
      delivery_charge: 0,
      zero_delivery_amount: 0,
      type: "app",
      link_type: "product",
      link_id: product.item_code,
    };
    connection.query(
      "INSERT INTO coupon SET ?",
      dataObject,
      (err, results, fields) => {
        console.log(err, results, fields);
      }
    );
  }
};
