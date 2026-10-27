const name = "amir";
const age = 20
console.log(`name: ${name}, age: ${age}`)

console.log(process.argv)

const nameMe = process.argv[2]
const ageMe = process.argv[3]

console.log(`name: ${nameMe}, age: ${ageMe}`)

export function sum(a,b){
    return a + b;
}