export const LOCATIONS = [
  { name: "Mr Wash – Tysons", address: "8218 Leesburg Pike", city: "Vienna", state: "VA", zip: "22182" },
  { name: "Mr Wash – Alexandria (Mount Vernon Ave)", address: "3407 Mount Vernon Ave", city: "Alexandria", state: "VA", zip: "22305" },
  { name: "Mr Wash – Alexandria (Van Dorn St)", address: "420 S Van Dorn St", city: "Alexandria", state: "VA", zip: "22304" },
  { name: "Mr Wash – Arlington (Four Mile Run)", address: "4148 S Four Mile Run Dr", city: "Arlington", state: "VA", zip: "22206" },
  { name: "Mr Wash – Arlington (Glebe Rd)", address: "101 N Glebe Rd", city: "Arlington", state: "VA", zip: "22203" },
  { name: "Mr Wash – Baileys Crossroads", address: "5901 Columbia Pike", city: "Falls Church", state: "VA", zip: "22041" },
  { name: "Mr Wash – Centreville", address: "13817 Route 29 (Lee Hwy)", city: "Centreville", state: "VA", zip: "20121" },
  { name: "Mr Wash – Falls Church (Gallows Rd)", address: "3013 Gallows Rd", city: "Falls Church", state: "VA", zip: "22042" },
  { name: "Mr Wash – Kensington", address: "3817 Dupont Ave", city: "Kensington", state: "MD", zip: "20895" },
  { name: "Mr Wash – Silver Spring", address: "7996 Georgia Ave", city: "Silver Spring", state: "MD", zip: "20910" },
  { name: "Mr Wash – Rehoboth Beach", address: "19898 Hebron Rd", city: "Rehoboth Beach", state: "DE", zip: "19971" }
];

export const LOCATIONS_LIST_TEXT =
  "We have 11 convenient locations:\n" +
  LOCATIONS.map((l, i) =>
    `${i+1}. ${l.name}, ${l.address}, ${l.city}, ${l.state} ${l.zip}`
  ).join("\n") +
  "\n\nShare your ZIP code or city and I can point you to the nearest Mr Wash.";
