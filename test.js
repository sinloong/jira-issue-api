// Online Javascript Editor for free
// Write, Edit and Run your Javascript code using JS Online Compiler

var cars = {
  label: 'Autos',
  subs: [
    {
      label: 'SUVs',
      subs: []
    },
    {
      label: 'Trucks',
      subs: [
        {
          label: '2 Wheel Drive',
          subs: []
        },
        {
          label: '4 Wheel Drive',
          subs: [
            {
              label: 'Ford',
              subs: []
            },
            {
              label: 'Chevrolet',
              subs: []
            }
          ]
        }
      ]
    },
    {
      label: 'Sedan',
      subs: []
    }
  ]
}

const iterate = (obj) => {
    let textArray = [];
    Object.keys(obj).forEach(key => {

        console.log(`key: ${key}, value: ${obj[key]}`)
        
        if (typeof obj[key] === 'object' && obj[key] !== null) {
            const temp = iterate(obj[key])
            if (temp.length > 0) textArray = textArray.concat(temp)
        }

        if (key === "label") {
            textArray.push(obj[key])
        } 
        //console.log(textArray)
    })
    return textArray
}
const b = iterate(cars)
console.log(b)
console.log("Welcome to Programiz!");