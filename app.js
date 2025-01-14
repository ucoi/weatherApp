
let wetaherForm = document.querySelector('.weatherForm');
let cityInput = document.querySelector('.cityInput');
let card = document.querySelector('.card');
let apiKey = '165ae638de5cb73e8a5b37895517e08e'

wetaherForm.addEventListener('submit', async event => {
    event.preventDefault()
    let city = cityInput.value;
    if(city){
        try{
            let data = await getweatherData(city)
            displayWeatherInfo(data)
        }catch(error){
            displayError('An error occured while fetching the data')
        }

    }else{
        displayError('City name is required')
    }
})

async function  getweatherData(city){
    let url  = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}`
    let response = await fetch(url)
    
    if(!response.ok){
        throw new Error('An error occured while fetching the data')
    }
    return await response.json()
}

function displayWeatherInfo(data){
    let {name : city ,
         main : {temp , humidity},
         weather :[{description , id}] } = data;

         card.textContent = '';
         card.style.display = 'flex';

         let cityName = document.createElement('h1');
         let tempDisplay = document.createElement('p');
         let weatherEmoji = document.createElement('p');
         let humidityDisplay = document.createElement('p');
         let descriptionDisplay = document.createElement('p');

         cityName.textContent = city;
         tempDisplay.textContent = `Temperature: ${(temp - 273.15).toFixed(1)}°C`;
         humidityDisplay.textContent = `Humidity: ${humidity}%`;
         descriptionDisplay.textContent = `Description: ${description}`;
         weatherEmoji.textContent = getweatheremoji(id);

        cityName.classList.add('cityDisplay');
        tempDisplay.classList.add('tempDisplay');
        humidityDisplay.classList.add('humidityDisplay');
        descriptionDisplay.classList.add('descriptionDisplay');
        weatherEmoji.classList.add('weatherEmoji');

        card.appendChild(cityName);
        card.appendChild(tempDisplay);
        card.appendChild(descriptionDisplay);
        card.appendChild(humidityDisplay);
        card.appendChild(weatherEmoji);

}


function getweatheremoji(weatherId){
    switch(true){
        case weatherId >= 200 && weatherId < 300:
            return '⛈️';
        case weatherId >= 300 && weatherId < 400:
            return '🌧️';
        case weatherId >= 500 && weatherId < 600:
            return '🌧️';
        case weatherId >= 600 && weatherId < 700:
            return '❄️';
        case weatherId >= 701 && weatherId < 800:
            return '🌫️';
        case weatherId === 800:
            return '☁️';
        case weatherId >= 801 && weatherId < 810:
            return '☁️';
        default:
            return '??';
    }
}

function displayError(message) {
    let error = document.createElement('p');
    error.textContent = message;
    error.classList.add('errorDisplay');

    card.textContent = '';
    card.style.display = 'flex';
    card.appendChild(error);
}

