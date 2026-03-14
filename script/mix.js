const mixPerfumeList = document.getElementById("mixPerfumeList");
const startMixQuizBtn = document.getElementById("startMixQuizBtn");
const mixHint = document.getElementById("mixHint");

const mixQuizArea = document.getElementById("mixQuizArea");
const mixQuestionCard = document.getElementById("mixQuestionCard");
const mixNextBtn = document.getElementById("mixNextBtn");
const mixBackBtn = document.getElementById("mixBackBtn");

const mixResultArea = document.getElementById("mixResultArea");
const mixResultCard = document.getElementById("mixResultCard");

const restartMixBtn = document.getElementById("restartMixBtn");

const mixPool =
JSON.parse(sessionStorage.getItem("mixPool")) || [];

let selectedScents = [];
let mixAnswers = [];
let mixIndex = 0;

const MIX_QUIZ = [

{
text:"What kind of blend do you want?",
options:[
{label:"Fresh and clean"},
{label:"Sweet and cozy"},
{label:"Bold and intense"},
{label:"Balanced everyday scent"}
]
},

{
text:"How noticeable should the blend be?",
options:[
{label:"Soft and subtle"},
{label:"Balanced"},
{label:"Strong"}
]
},

{
text:"When will you wear this blend?",
options:[
{label:"Daytime"},
{label:"Night"},
{label:"Special occasions"}
]
}

];

renderMixChoices();

function renderMixChoices(){

mixPerfumeList.innerHTML = mixPool.map((p,i)=>`

<div class="check-item">

<input type="checkbox" id="mix_${i}" data-name="${p.name}">

<label for="mix_${i}">${p.name}</label>

</div>

`).join("");

mixPerfumeList.querySelectorAll("input").forEach(cb=>{

cb.addEventListener("change",()=>{

const name = cb.dataset.name;

if(cb.checked){

if(selectedScents.length >= 5){

cb.checked=false;
alert("You can mix up to 5 scents.");

return;

}

selectedScents.push(name);

}else{

selectedScents = selectedScents.filter(s=>s!==name);

}

updateMixState();

});

});

}

function updateMixState(){

const count = selectedScents.length;

if(count < 2){

mixHint.textContent = "Select at least 2 scents.";

startMixQuizBtn.disabled = true;

return;

}

mixHint.textContent = `${count} scents selected`;

startMixQuizBtn.disabled = false;

}

startMixQuizBtn.addEventListener("click",()=>{

mixQuizArea.hidden = false;
mixIndex = 0;
mixAnswers = [];

renderMixQuestion();

});

function renderMixQuestion(){

const q = MIX_QUIZ[mixIndex];

mixQuestionCard.innerHTML = `

<h4 class="q-title">${q.text}</h4>

<div class="options">

${q.options.map((opt,i)=>`

<label class="option">

<input type="radio" name="mixOption" value="${opt.label}">

<span>${opt.label}</span>

</label>

`).join("")}

</div>

`;

}

mixNextBtn.addEventListener("click",()=>{

const chosen = document.querySelector('input[name="mixOption"]:checked');

if(!chosen){

alert("Please choose an option.");

return;

}

mixAnswers[mixIndex] = chosen.value;

if(mixIndex < MIX_QUIZ.length - 1){

mixIndex++;

renderMixQuestion();

}else{

showMixResult();

}

});

mixBackBtn.addEventListener("click",()=>{

if(mixIndex === 0){

mixQuizArea.hidden = true;
return;

}

mixIndex--;

renderMixQuestion();

});

function showMixResult(){

mixQuizArea.hidden = true;
mixResultArea.hidden = false;

const ratio = Math.floor(100/selectedScents.length);

mixResultCard.innerHTML = `

<div class="mix-result">

<p><strong>Your Blend:</strong></p>

${selectedScents.map(s=>`

<p>${s} — ${ratio}%</p>

`).join("")}

</div>

`;

sessionStorage.setItem(
"mixBlend",
JSON.stringify({
scents:selectedScents,
ratio:ratio
})
);

}

restartMixBtn.addEventListener("click",()=>{

location.reload();

});