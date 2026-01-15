'use client';

import { useEffect, useState } from 'react';

export default function TestCensusPage() {
  const [result, setResult] = useState<string>('Testing...');
  const [counties, setCounties] = useState<any[]>([]);

  useEffect(() => {
    async function test() {
      try {
        console.log('🧪 Testing Census API route...');
        const response = await fetch('/api/census?stateFips=06');
        console.log('🧪 Response status:', response.status);
        
        if (!response.ok) {
          const error = await response.text();
          setResult(`Error: ${response.status} - ${error}`);
          console.error('🧪 API Error:', error);
          return;
        }
        
        const data = await response.json();
        console.log('🧪 Received data:', data.length, 'counties');
        setCounties(data.slice(0, 5)); // Show first 5
        setResult(`✅ Success! Loaded ${data.length} counties`);
        
        // Check Alameda specifically
        const alameda = data.find((c: any) => c.name.includes('Alameda'));
        if (alameda) {
          console.log('🧪 Alameda County:', alameda);
          setResult(`✅ Success! Alameda income: $${alameda.medianIncome.toLocaleString()}`);
        }
      } catch (error) {
        console.error('🧪 Test error:', error);
        setResult(`❌ Error: ${error}`);
      }
    }
    
    test();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Census API Test</h1>
      <p>{result}</p>
      {counties.length > 0 && (
        <div>
          <h2>Sample Counties:</h2>
          <ul>
            {counties.map((county, i) => (
              <li key={i}>
                {county.name}: ${county.medianIncome.toLocaleString()} 
                (FIPS: {county.stateFips}{county.countyFips.padStart(3, '0')})
              </li>
            ))}
          </ul>
        </div>
      )}
      <p style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
        Check the browser console (F12) for detailed logs
      </p>
    </div>
  );
}
