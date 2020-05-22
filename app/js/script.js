const jokesSection = document.getElementById('jokes');
const favSection = document.getElementById('favourite');

const menuButtonOpen = document.getElementById('open');
const menuButtonClose = document.getElementById('close');

const controlSection = document.getElementById('control-menu');
const radioButtons = controlSection.querySelectorAll('input[type="radio"]');
const categoryButtons = document.getElementById('buttons');
const searchInput = document.getElementById('search-input');

const loadingText = document.getElementById('loading');
const fillFormWarn = document.getElementById("fill-form-warn");
const ifEmptyText = document.getElementById('emptyFavSection');
const overlay = document.getElementById("overlay");

const urlList = {
  categoryList: 'https://api.chucknorris.io/jokes/categories',
  category: 'https://api.chucknorris.io/jokes/random?category=',
  random: 'https://api.chucknorris.io/jokes/random',
  search: 'https://api.chucknorris.io/jokes/search?query='
}

const jokes = [];
let favJokes = [];

init(); //get jokes from storage and render

// open or close favourite section
menuButtonOpen.addEventListener('click', toggleFavSection);
menuButtonClose.addEventListener('click', toggleFavSection);
overlay.addEventListener('click', toggleFavSection);

// search jokes
controlSection.addEventListener('click', setSearch);
searchInput.addEventListener('keydown', (e) => {if (e.key === 'Enter') getJoke();});

// like or dislike joke
jokesSection.addEventListener('click', markJoke);
favSection.addEventListener('click', markJoke);


// FUNCTIONS
function init() {
  getLocalStorageData(); //get saved favourite jokes
  getCategories(); //get categories and create buttons
  ifEmptyFavSection(); //check if the favSection is empty
}

//get saved favourite jokes;
function getLocalStorageData() {
  const savedFavJokes = localStorage.getItem("favJokes");

  if (savedFavJokes !== null && savedFavJokes !== "null") {
    favJokes = JSON.parse(savedFavJokes);
    favJokes.forEach(joke => {createJokeEl(joke, favSection)});
  }
}

//get categories and create buttons
function getCategories() {
  fetch(urlList.categoryList)
    .then((resp) => resp.json())
    .then((data) => {
      createButtons(data);
      loadingText.style.display = "none";
    })

    .catch(function(error) {
      loadingText.style.display = "none";

      let p = document.createElement('p');
      p.innerHTML = `Can't receive categories (${error})`;
      categoryButtons.append(p);

      console.log(error); //eslint-disable-line
    });
}

//check if the favSection is empty then show or hide information text
function ifEmptyFavSection() {
  if (favJokes.length !== 0) {
    ifEmptyText.style.display = 'none';
  } else {
    ifEmptyText.style.display = 'block';
  }
}

//create category buttons
function createButtons(data) {
  data.map(category => {
    let button = document.createElement('button');

    button.type = 'button';
    button.innerHTML = category;
    button.className = 'btn category';
    button.value = category;

    categoryButtons.append(button);
  });
}

// open or close favourite section
function toggleFavSection() {
  let button = this;
  let opositeButton;

  // if click open button
  if (button === menuButtonOpen) {
    opositeButton = menuButtonClose;

    favSection.classList.add('slide');
    overlay.style.display = "block";

    // disable scrolling body when favSection is open
    document.body.style.overflowY = "hidden";

  } else {
    // if click close button
    button = menuButtonClose; // in case when click on overlay
    opositeButton = menuButtonOpen;

    favSection.classList.remove('slide');
    overlay.style.display = "none";
    // allow scrolling body when favSection is closed
    document.body.style.overflowY = "auto";
  }

  // hide menu button
  button.style.opacity = "0";
  // show opposite button after transition
  favSection.ontransitionend = (e) => {
    if (e.target === favSection) {
      opositeButton.style.opacity = "1";
    }
  };
}

// when click on buttons inside control block
function setSearch(e) {
  const targetClass = e.target.classList;

  //if click on button with a category
  if (targetClass.contains('category')) {
    selectCategory(e.target);

  //if click on radio button (Random, From categories, Search)
  } else if (targetClass.contains('opt-radio')) {
    showOptions();
  // if submit a form (Get a joke)
  } else if (targetClass.contains('get-joke')) {
    getJoke();
  }
}

//if click on button with a category
function selectCategory(target) {
  //remove active status from current active button
  let currentActive = target.parentElement.getElementsByClassName('active')[0];
  if (currentActive) currentActive.classList.remove('active');
  // make the button active
  target.classList.add('active');
}

//if click on radio button (Random, From categories, Search)
function showOptions() {
  //find checked radio
  for (let btn of radioButtons) {
    const optional = btn.parentElement.getElementsByClassName('optional')[0];

    //for From categories and Search
    if (btn.checked && optional) {
      optional.style.display = "block";
      optional.firstElementChild.focus();

    //for Random
    } else if (!btn.checked && optional) {
      optional.style.display = "none";
    }
  }
}

// if submit a form (Get a joke)
function getJoke() {
  let searchType;
  //find checked radio
  for (let btn of radioButtons) {
    if (btn.checked) {
      searchType = btn.value;
    }
  }

  // get url for API
  const url = getUrl(searchType);
  // show popup "Fill form" if form is not full
  if (!url) {
    fillFormWarn.style.display = 'block';
    setTimeout(function() {
      fillFormWarn.style.display = 'none';
    }, 1000);
    return;
  }

  // receive data from API
  getData(url);
}

// get url for API according to search type
function getUrl(type) {
  let url;
  let input;

  switch (type) {
    case "random":
      url = urlList.random;
      break;

    case "category":
      input = document.getElementsByClassName('active')[0];

      if (!input) return; //if category is not choosen return

      url = urlList.category + input.value;
      break;

    case "search":
      input = document.getElementsByClassName('search')[0];

      if (!input.value) return; //if search input is empty
      url = urlList.search + input.value;
      break;
    default: //if radio button is not choosen
      return;
  }
  return url;
}

// receive data from API
function getData(url) {

  fetch(url)
    .then((resp) => resp.json())
    .then((data) => {
      let result = [];

      // search with free text has result obj in receiving data
      if (data.hasOwnProperty("result")) {
        result = data.result;
      } else {
        result = [data];
      }
      //add data to joke obj
      jokes.push(...result);

      // render new jokes
      result.forEach(joke => {createJokeEl(joke, jokesSection)});
    })
    .catch(function(error) {
      console.log(error); //eslint-disable-line
    });
}

// create joke and render
function createJokeEl(data, divToAppend) {
  // get template from DOM and clone it
  const temp = document.getElementsByTagName('template')[0];
  const clon = temp.content.cloneNode(true);

  // append clone to DOM
  divToAppend.insertBefore(clon, divToAppend.firstChild)

  const joke = divToAppend.firstElementChild;

  // edit joke according to received data
  const mark = joke.getElementsByClassName('save')[0];
  mark.setAttribute('data-id', data.id);

  // change heart image
  // if joke is added to favourite section
  if (divToAppend.classList.contains("favourite")) {
    mark.src = "./images/heart-fill.svg";

    // if joke is added to joke section
  } else {
    mark.src = "./images/heart.svg";
  }

  const link = joke.getElementsByClassName('joke-link')[0];
  link.href = data.url;
  link.textContent = data.id;

  const text = joke.getElementsByClassName('text')[0];
  text.textContent = data.value;

  // calculate difference between current and a joke updated date
  const date = joke.getElementsByClassName('hours')[0];

  const currentDate = new Date();
  const updatedDate = new Date(data.updated_at);

  const diffTime = currentDate - updatedDate;
  const diffHours = Math.round(diffTime / (1000 * 60 * 60));

  date.textContent = diffHours + " hours ago";

  // add button with category type if exist
  if (data.categories.length) {
    let button = document.createElement('button');
    button.type = 'button';
    button.innerHTML = data.categories[0];
    button.className = 'btn';
    joke.getElementsByClassName('footer')[0].append(button);
  }

  return joke;
}

// like or dislike the joke
function markJoke(e) {
  const heartImg = e.target;

  if (heartImg.className !== 'save') return;

  let joke;

  //if remove (dislike)
  if (heartImg.src.includes("fill.svg")) {
    heartImg.src = "./images/heart.svg";

    // update favJoke obj
    favJokes = favJokes.filter(el => {
      return el.id !== heartImg.dataset.id;
    });

    let favJoke;
    // remove joke from DOM
    // if dislike in a favourite section
    if (e.target.closest(".favourite")) {
      favJoke = heartImg.closest(".joke");

      // dislike same joke from a joke section
      // find all jokes in jokesSection and convert HTMLCollesction to array
      const heartArr =[...jokesSection.getElementsByClassName('save')];

      const markedHeartImg = heartArr.filter(el => {
        return el.dataset.id === heartImg.dataset.id;
      });

      // if fav joke is not from local storage - dislike it from a joke section
      if (markedHeartImg[0]) {
        markedHeartImg[0].src = "./images/heart.svg";
      }

    // if dislike in a joke section
    } else {
      // find all jokes in favSection and convert HTMLCollesction to array
      const heartArr =[...favSection.getElementsByClassName('save')];

      const markedHeartImg = heartArr.filter(el => {
        return el.dataset.id === heartImg.dataset.id
      });

      favJoke = markedHeartImg[0].closest(".joke");
    }

    favJoke.remove();
  // if add to fav (like)
  } else {
    heartImg.src = "./images/heart-fill.svg";
    // update favJoke obj
    joke = jokes.filter(el => {
      return el.id === heartImg.dataset.id;
    });

    favJokes.push(...joke);

    //add it to DOM
    createJokeEl(...joke, favSection);
  }

  // if there are no joke - show information text
  ifEmptyFavSection();
  // add favourite joke to local storage
  localStorage.setItem("favJokes", JSON.stringify(favJokes));
}
