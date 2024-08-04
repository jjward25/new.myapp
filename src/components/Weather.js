"use client"
// components/WeatherClient.js
import React, { useState, useEffect } from 'react';
import Image from 'next/image';

// Convert Celsius to Fahrenheit
const celsiusToFahrenheit = (celsius) => (celsius * 9/5) + 32;

// Fetch weather data client-side
const fetchWeatherData = async () => {
  const url = 'https://api.open-meteo.com/v1/forecast?latitude=40.7128&longitude=-74.0060&current_weather=true';
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    const { temperature: tempCelsius, weathercode } = data.current_weather;

    // Convert temperature to Fahrenheit
    const temperature = celsiusToFahrenheit(tempCelsius).toFixed(0);

    // Map weather codes to text descriptions
    const weatherCondition = getWeatherCondition(weathercode);

    return { temperature, weatherCondition };
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return { temperature: null, weatherCondition: null };
  }
};

// Map weather codes to descriptions
const getWeatherCondition = (code) => {
  switch (code) {
    case 0: return 'Clear sky';
    case 1: return 'Mainly clear';
    case 2: return 'Partly cloudy';
    case 3: return 'Overcast';
    case 45: return 'Fog';
    case 51: return 'Light rain';
    case 61: return 'Light rain';
    case 81: return 'Light rain';
    case 53: return 'Moderate rain';
    case 63: return 'Moderate rain';
    case 55: return 'Heavy rain';
    case 65: return 'Heavy rain';
    case 82: return 'Heavy rain';
    case 95: return 'Thunderstorms';
    case 71: return 'Light snow';
    case 85: return 'Light snow';
    case 73: return 'Moderate snow';
    case 75: return 'Heavy snow';
    case 86: return 'Heavy snow';
    default: return 'Unknown';
  }
};

const WeatherClient = () => {
  const [weatherData, setWeatherData] = useState({ temperature: null, weatherCondition: null });

  useEffect(() => {
    const getWeather = async () => {
      const data = await fetchWeatherData();
      setWeatherData(data);
    };

    getWeather();
  }, []); // Empty dependency array to fetch data only on mount

  const { temperature, weatherCondition } = weatherData;

  const renderWeatherIcon = () => {
    if (!weatherCondition) return null;
    const condition = weatherCondition;
    if (condition.includes('Clear sky') || condition.includes('Mainly clear')) {
      return <Image src="/icoSunny.svg" width={15} height={10} alt="Sunny" />;
    } else if (condition.includes('Partly cloudy') || condition.includes('Overcast') || condition.includes('Fog')) {
      return <Image src="/icoCloudy.svg" width={15} height={10} alt="Cloudy" />;
    } else if (condition.includes('Light rain')) {
      return <Image src="/icoLightRain.svg" width={15} height={10} alt="Light Rain" />;
    } else if (condition.includes('Moderate rain')) {
      return <Image src="/icoModerateRain.svg" width={15} height={10} alt="Rain" />;
    } else if (condition.includes('Heavy rain')) {
      return <Image src="/icoHeavyRain.svg" width={15} height={10} alt="Heavy Rain" />;
    } else if (condition.includes('Thunderstorms')) {
      return <Image src="/icoThunderstorm.svg" width={15} height={10} alt="Thunderstorms" />;
    } else if (condition.includes('Light snow') || condition.includes('Moderate Snow') || condition.includes('Heavy Snow')) {
      return <Image src="/icoSnowBlue.svg" width={15} height={10} alt="Snow" />;
    }
    return null;
  };

  const getTextColorClass = (tempNum) => {
    const temp = parseFloat(tempNum);
    if (temp < 70) return 'text-blue-400';
    if (temp >= 50 && temp < 70) return 'text-cyan-400';
    if (temp >= 70 && temp < 80) return 'text-green-400';
    if (temp >= 80 && temp < 85) return 'text-yellow-300';
    if (temp >= 85 && temp < 90) return 'text-orange-300';
    return 'text-red-400'; // temp >= 90
  };

  const textColorClass = temperature ? getTextColorClass(temperature) : '';

  return (
    <div className="flex items-center space-x-2 mb-12">
      <div className={`${textColorClass}`}>
        {temperature ? `${temperature}°F` : 'Data not available'}
      </div>
      <p className='text-neutral-400'>
        {weatherCondition ? ` in NYC, ${weatherCondition}` : 'Data not available'}
      </p>
      <div className='w-auto'>
        {renderWeatherIcon()}
      </div>
    </div>
  );
};

export default WeatherClient;
