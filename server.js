const fetch = require('node-fetch');  // For making HTTP requests to the API
require("dotenv").config();  // Loads environment variables from a .env file
const express = require("express");  // Web framework for building the server
const app = express();  // Create an express application

// Get environment variables from the .env file
const PORT = process.env.PORT;  // Server port
const appKey = process.env.OPENWEATHER_API_KEY;  // API key for OpenWeatherMap

// Log the API key to ensure it has been loaded correctly (for debugging)
console.log(process.env.OPENWEATHER_API_KEY);

// Serve static files from the "public" directory
app.use(express.static("public"));

// Start the server and listen on the defined port
app.listen(PORT, () => 
    console.log(`Listening on port ${PORT}`)
);

// Function to fetch geocoding data (latitude and longitude) for a city and state
async function getGeocoding(city, state) {
    const baseUrl = "https://api.openweathermap.org/geo/1.0/direct";  // Geocoding API endpoint
    const apiKey = process.env.OPENWEATHER_API_KEY;  // API key from environment variables
    const query = `${city},${state},US`;  // Build the query string using city, state, and country (US)
    const url = `${baseUrl}?q=${encodeURIComponent(query)}&appid=${apiKey}`;  // Complete URL with parameters

    console.log('Geocoding API URL:', url);  // Log URL for debugging

    try {
        // Fetch the geocoding data from the API
        const response = await fetch(url);

        // Check if the response is successful (status code 200)
        if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
        }

        // Parse the response JSON data
        const data = await response.json();

        // If no data is found (empty array), return null to indicate that the city wasn't found
        if (data.length === 0) {
            console.log("City not found!");
            return null;
        }

        // Extract latitude and longitude from the geocoding data
        const { lat, lon } = data[0];
        console.log(`Coordinates for ${city}, ${state}: Latitude ${lat}, Longitude ${lon}`);
        // Now, use the coordinates to fetch the weather data
        return getWeatherData(lat, lon);
    } catch (error) {
        // Catch any errors that occur during the fetch process
        console.error('Error fetching geocoding data: ', error);
        return null;  // Return null in case of error
    }
}

// Function to fetch weather data based on latitude and longitude
async function getWeatherData(lat, lon) {
    const apiKey = process.env.OPENWEATHER_API_KEY;  // Your OpenWeather API key
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${apiKey}`;  // Weather API URL

    console.log(url);  // Log the API URL for debugging

    try {
        // Fetch the weather data from the API
        const response = await fetch(url);

        // Check if the response is successful (status code 200)
        if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
        }

        // Parse the weather data JSON response
        const weatherData = await response.json();
        console.log(`Weather in ${weatherData.name}: ${weatherData.weather[0].description}, Temperature: ${weatherData.main.temp}°F`);

        // Return the weather data so it can be used later
        return weatherData;
    } catch (error) {
        // Catch any errors during the fetch process for weather data
        console.error('Error fetching weather data: ', error);
        return null;  // Return null if there is an error
    }
}

// Route to handle the '/weather' endpoint
app.get("/weather", async (req, res) => {
    try {
        const { city, state } = req.query;  // Get the city and state from query parameters

        // Server-side validation
        if (!city || !state) {
            return res.status(400).json({ error: 'City and state query parameters are required.' });
        }

        // Call the geocoding function to get the coordinates for the city and state
        const weatherData = await getGeocoding(city, state);
        
        // If weather data is not found (null), show an error message on the page
        if (!weatherData) {
            const errorMessage = "We couldn't find the location. Please check the city and state.";

            // Render the error message on the page
            return res.send(`
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Weather App</title>
                    <style>
                        #weather {
                            text-align: center;
                        }
                        form {
                            font-size: 25px;
                        }
                        input {
                            width: 200px;
                            font-size: 20px;
                            height: 35px;
                            border-radius: 10px;
                            border: 3px solid black;
                            background-color: white;
                        }
                        button {
                            width: 150px;
                            font-size: 20px;
                            height: 35px;
                            border: 3px solid black;
                            background-color: white;
                            border-radius: 10px;
                        }
                        h2 {
                            font-size: 40px;
                        }
                        p {
                            font-size: 25px;
                        }
                    </style>
                </head>
                <body id="weather">
                    <h1>Weather App</h1>
                    <form action="/weather" method="Get">
                        <input type="text" id="city" name="city" placeholder="Enter City" pattern="[A-Za-z\s]+" required title="City name should only contain letters and spaces.">
                        <input type="text" id="state" name="state" placeholder="Enter State (e.g., WA)" pattern="[A-Za-z]{2}" required title="State should be a 2-letter abbreviation (e.g., 'WA')">
                        <button type="submit">Get Weather</button>
                    </form>
                    <p style="color: red; font-size: 20px;">${errorMessage}</p> <!-- Display error message -->
                </body>
                </html>
            `);
        }

        // Process the weather data based on the weather description
        let icon = "";  // Default icon
        let color = "white";  // Default background color
        const weatherDescription = weatherData.weather[0].description;  // Get the weather description

        // Set the icon and color based on the weather description
        if (weatherDescription.includes("broken clouds")) {
            color = "#607D8B";  // Muted blue for broken clouds
            icon = "broken-clouds";
        } else if (weatherDescription.includes("cloud")) {
            color = "#607D8B";  // Muted blue for clouds
            icon = "cloudy";
        } else if (weatherDescription.includes("rain")) {
            color = "#66959f";  // Muted gray-blue for rain
            icon = "rain";
        } else if (weatherDescription.includes("sunny")) {
            color = "yellow";  // Yellow for sunny weather
            icon = "sunny";
        } else if (weatherDescription.includes("smoke") ) {
            color = "grey";  // Gray for smoke
            icon = "smoke";
        } else if (weatherDescription.includes("clear")) {
            color = "#fbf8ae";  // Sky blue for clear sky
            icon = "clear-sky";
        } else if (weatherDescription.includes("fog")){
            color = "#a6a6a6";  // Sky blue for clear sky
            icon = "fog";
        } else if (weatherDescription.includes("storm")) {
            color = "#a6a6a6";  // Sky blue for clear sky
            icon = "storm";
        }

        // Send the weather details back to the client
        res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Weather App</title>
                <style>
                    #weather {
                        background-color:${color};
                        text-align: center;
                    }
                    form {
                        font-size: 25px;
                    }
                    input {
                        width: 200px;
                        font-size: 20px;
                        height: 35px;
                        border-radius: 10px;
                        border: 3px solid white;
                        background-color: white;
                    }
                    button {
                        width: 150px;
                        font-size: 20px;
                        height: 35px;
                        border: 3px solid white;
                        background-color: white;
                        border-radius: 10px;
                    }
                    h2 {
                        font-size: 40px;
                    }
                    p {
                        font-size: 25px;
                    }
                </style>
            </head>
            <body id="weather">
                <h1>Weather App</h1>
                <form action="/weather" method="Get">
                    <input type="text" id="city" name="city" placeholder="Enter City" pattern="[A-Za-z\s]+" required title="City name should only contain letters and spaces.">
                    <input type="text" id="state" name="state" placeholder="Enter State (e.g., WA)" pattern="[A-Za-z]{2}" required title="State should be a 2-letter abbreviation (e.g., 'WA')">
                    <button type="submit">Get Weather</button>
                </form>
                <h2>Weather in ${city}, ${state}</h2>
                <p>${weatherData.weather[0].description}</p>
                <p>Temperature: ${weatherData.main.temp}°F</p>
                <p>Humidity: ${weatherData.main.humidity}%</p>
                <img src="/icons/${icon}.svg" alt="${icon}" width="200" height="200">
            </body>
            </html>
        `);

    } catch (error) {
        console.error('Error fetching weather data: ', error);
        res.status(500).send('Server Error: Something went wrong while fetching weather data.');
    }
});


