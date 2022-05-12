/* 
1. show / hide button 
---------------------
*/
// create variables
const toggleBtn = document.querySelector('#toggleBtn')
const divList = document.querySelector('.listHolder')

// action to be taken when clicked on hide list button
toggleBtn.addEventListener('click', () => {
  if (divList.style.display === 'none') {
    divList.style.display = 'block'
    toggleBtn.innerHTML = 'Hide List'
  } else {
    divList.style.display = 'none'
    toggleBtn.innerHTML = 'Show List'
  }
})

/* 
2. add list items
-----------------
*/
// create variables
const addInput = document.querySelector('#addInput')
const addBtn = document.querySelector('#addBtn')

function addLists () {
  const ul = divList.querySelector('ul')
  const li = document.createElement('li')
  li.innerHTML

  addInput.value = ''
  ul.appendChild(li)
  createBtn(li)
}

const savebtn = document.querySelector('#savebtn')
savebtn.addEventListener('click', () => {
  var lis2 = document.querySelectorAll('ul li'),
    i = 0,
    jData = []
  for (var li of lis2) {
    var divs = li.getElementsByTagName('div'),
      liObj = {}
    for (var span of divs) liObj[span.className] = span.textContent
    jData.push(liObj)
  }
  // jData = JSON.stringify(jData)
  for (var i = 0; i < jData.length; i++) {
    console.log(jData[i].div)
    $('#email-result').val(jData[i].div)
  }
})

// add list when clicked on add item button
addBtn.addEventListener('click', () => {
  addLists()
})

// add list when pressed enter
addInput.addEventListener('keyup', event => {
  if (event.which === 13) {
    addLists()
  }
})

/* 
3. create action buttons
------------------------
*/
// create variables
const listUl = document.querySelector('.list')
console.log(listUl.innerText)
const lis = listUl.children

// loop to add buttons in each li
for (var i = 0; i < lis.length; i++) {
  createBtn(lis[i])
}

/* 
4. enabling button actions (to move item up, down or delete)
------------------------------------------------------------
*/
divList.addEventListener('click', event => {
  if (event.target.tagName === 'BUTTON') {
    const button = event.target
    const li = button.parentNode
    const ul = li.parentNode
    if (button.className === 'btn-icon remove') {
      ul.removeChild(li)
    } else if (button.className === 'btn-icon down') {
      const nextLi = li.nextElementSibling
      if (nextLi) {
        ul.insertBefore(nextLi, li)
      }
    } else if (button.className === 'btn-icon up') {
      const prevLi = li.previousElementSibling
      if (prevLi) {
        ul.insertBefore(li, prevLi)
      }
    }
  }
})
