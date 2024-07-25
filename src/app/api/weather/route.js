// src/app/api/weather/route.js
export async function GET() {
    const url = 'https://wttr.in/New+York?format=%t %C'; // Fetch temperature and weather condition
  
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.text();
      
      // Check if data contains expected format
      const parts = data.split(' ');
      if (parts.length < 2) {
        throw new Error('Unexpected response format');
      }
      
      const temperature = parts[0].trim();
      const weatherCondition = parts.slice(1).join(' ').trim(); // Join the rest in case condition has spaces
  
      return new Response(
        JSON.stringify({ temperature, weatherCondition }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Error fetching weather data' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
}
