const h1 = document.querySelector("h1");
const btnRed = document.querySelector(".btn-red");

console.log(h1);

btnRed.addEventListener("click", function () {
  h1.style.backgroundColor = "red";
});
