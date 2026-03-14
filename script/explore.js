const scentsGrid = document.getElementById("scentsGrid");
const familyFilter = document.getElementById("familyFilter");
const searchInput = document.getElementById("searchInput");

let scents = [];

document.addEventListener("DOMContentLoaded", async () => {

const res = await fetch("../data/scents.json");
const data = await res.json();

scents = data.scents || [];

renderScents(scents);

familyFilter.addEventListener("change", applyFilters);
searchInput.addEventListener("input", applyFilters);

});


function applyFilters(){

let filtered = [...scents];

const family = familyFilter.value;
const search = searchInput.value.toLowerCase();

if(family !== "all"){

filtered = filtered.filter(s =>
s.tags.includes(family)
);

}

if(search){

filtered = filtered.filter(s =>
s.name.toLowerCase().includes(search)
);

}

renderScents(filtered);

}


function renderScents(list){

if(!list.length){

scentsGrid.innerHTML = `
<p>No scents found.</p>
`;

return;

}

scentsGrid.innerHTML = list.map(scent => `

<div class="scent-card">

<h3 class="scent-name">${scent.name}</h3>

<p class="scent-meta">

${prettyTags(scent.tags)}

</p>

<div class="scent-actions">

<button
class="btn btn-primary"
onclick='orderSingle(${JSON.stringify(scent)})'
>

Order

</button>

<button
class="btn btn-ghost"
onclick='mixSingle(${JSON.stringify(scent)})'
>

Mix

</button>

</div>

</div>

`).join("");

}


function orderSingle(scent){

sessionStorage.setItem(
"singleScentOrder",
JSON.stringify(scent)
);

sessionStorage.removeItem("mixBlend");

window.location.href = "./order.html";

}


function mixSingle(scent){

sessionStorage.setItem(
"mixPool",
JSON.stringify([scent])
);

window.location.href = "./mix.html?mode=direct";

}


function prettyTags(tags){

return tags
.slice(0,3)
.join(", ");

}