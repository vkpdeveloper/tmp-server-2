// SORTING BASED ON WORD SEARCH IN STRING.

let search = "potato";

let products = [

  "potato (packed) 1kg",
  "lays chips potato",
  "i am new pathak",
  "chips have inside potato it",
  "hello vaibhav",
  "baby potato",
  "potato (packed) 1kg",
  "i know you potato",
  "i am vaibhav"

];

const getProductPos = string => string.split(' ').indexOf(search);

function sortBaseOnSearch(products, search) {

  const nonSearchProducts = products.filter(a =>
    !a.includes(search)
  )

  const withSearchProducts = products.filter(a => a.includes(search))

  let namesSortedBySearch =  withSearchProducts.sort((a, b) => {
    const indexOne = a.indexOf(search);
    const indexTwo = b.indexOf(search);
    return indexOne - indexTwo;
  })

  return [...namesSortedBySearch, ...nonSearchProducts]

}

console.log(sortBaseOnSearch(products, search))



