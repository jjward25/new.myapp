"use client";
import { useEffect, useState } from 'react';
import axios from 'axios';
import { SunIcon, CloudIcon, CloudRainIcon } from '@heroicons/react/24/outline';

const Weather = () => {
  const [temperature, setTemperature] = useState(null);
  const [weatherCondition, setWeatherCondition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const response = await axios.get('/api/weather');
        if (response.data.error) {
          throw new Error(response.data.error);
        }
        // Remove the "+" sign from the temperature value and set state
        const temp = response.data.temperature.replace('+', '');
        setTemperature(temp);
        setWeatherCondition(response.data.weatherCondition);
      } catch (error) {
        console.error('Error fetching weather data:', error);
        setError('Failed to load weather data.');
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, []);

  const renderWeatherIcon = () => {
    if (!weatherCondition) return null;

    const condition = weatherCondition.toLowerCase();

    if (condition.includes('clear') || condition.includes('sunny')) {
      return <SunIcon className="w-6 h-6 text-yellow-500" aria-label="Sunny weather" />;
    } else if (condition.includes('cloudy') || condition.includes('patchy')) {
      return <CloudIcon className="w-6 h-6 text-gray-500" aria-label="Cloudy or Patchy weather" />;
    } else if (condition.includes('rain')) {
      return <CloudRainIcon className="w-6 h-6 text-blue-500" aria-label="Rainy weather" />;
    }
    return null;
  };

  const getTextColorClass = (tempNum) => {
    const temp = parseFloat(tempNum);
    if (temp < 70) return 'text-blue-400';
    if (temp >= 50 && temp < 70) return 'text-cyan-400';
    if (temp >= 70 && temp < 80) return 'text-neutral-400';
    if (temp >= 80 && temp < 85) return 'text-yellow-300';
    if (temp >= 85 && temp < 90) return 'text-orange-300';
    return 'text-red-400'; // temp >= 90
  };

  if (loading) return <div className="text-neutral-400">Loading weather data...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  const tempNum = temperature.replace('°F', '');
  const textColorClass = getTextColorClass(tempNum);

  return (
    <div className="flex items-center space-x-2 mb-10">
      <div className={` ${textColorClass}`}>
        {temperature ? `${temperature}` : 'Data not available'}
      </div>
      <p className='text-neutral-400'>
          {temperature ? ` in NYC, ${weatherCondition}` : 'Data not available'}
      </p>
      <div className='w-auto'>
        {renderWeatherIcon()}
      </div>
    </div>
  );
};

export default Weather;
