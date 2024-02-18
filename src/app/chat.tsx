'use client';

import React, { useState, useRef } from 'react';
import { useChat } from 'ai/react';

const apiOptions = [
  { label: 'Search with Yelp', value: 'yelp' },
  { label: 'Search with Google', value: 'google' },
];

const restaurantOptions = [
  { label: 'Mexican', value: 'mexican' },
  { label: 'Italian', value: 'italian' },
  { label: 'Sports Bar', value: 'sportsbar' },
  { label: 'Japanese Sushi', value: 'japanese' },
  { label: 'Vegetarian', value: 'vegetarian' },
  { label: 'Chinese', value: 'chinese' },
  { label: 'Indian', value: 'indian' },
  { label: 'French Bistro', value: 'french' },
  { label: 'Steakhouse', value: 'steakhouse' },
  { label: 'Seafood', value: 'seafood' },
];

export function Chat({ handler }: { handler: any }) {
  const { messages, setInput, handleSubmit } = useChat({ api: handler });
  const [selectedApi, setSelectedApi] = useState('');
  const [selectedRestaurantType, setSelectedRestaurantType] = useState('');
  const [zipCode, setZipCode] = useState('');
  const searchFormRef = useRef<HTMLFormElement>(null);

  const handleApiSelection = (value: string) => {
    setSelectedApi(value);
  };

  const handleRestaurantTypeSelection = (value: string) => {
    setSelectedRestaurantType(value);
    if (selectedApi && zipCode) {
      triggerSearch(value);
    }
  };

  const handleZipCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setZipCode(e.target.value);
  };

  const triggerSearch = (restaurantType: string) => {
    const searchQuery = `${selectedApi} ${restaurantType} in ${zipCode}`;
    setInput(searchQuery);
    if (searchFormRef.current) {
      searchFormRef.current.dispatchEvent(
        new Event('submit', { cancelable: true, bubbles: true })
      );
    }
  };

  const handleSearchClick = () => {
    if (selectedApi && zipCode && selectedRestaurantType) {
      triggerSearch(selectedRestaurantType);
    } else {
      alert(
        'Please select an API, enter a zip code, and choose a restaurant type.'
      );
    }
  };

  const isSelected = (value: string, type: string) => {
    return type === value ? 'bg-green-700' : 'bg-green-500';
  };

  return (
    <div className="flex flex-col w-full max-w-4xl py-24 mx-auto">
      <ul className="mb-16">
        {messages.map((m, index) => (
          <li key={index} className="mb-2">
            <span
              className={m.role === 'user' ? 'text-white' : 'text-gray-300'}
            >
              {m.role === 'user' ? m.content : m.ui}
            </span>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap gap-2 mb-4">
        {apiOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => handleApiSelection(option.value)}
            className={`text-white font-bold py-2 px-4 rounded ${isSelected(option.value, selectedApi)}`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <input
        type="text"
        placeholder="Enter Zip Code"
        value={zipCode}
        onChange={handleZipCodeChange}
        className="w-full p-3 mb-4 rounded text-gray-200 bg-gray-700 border border-gray-600 focus:border-green-500 focus:ring-green-500 shadow"
      />

      <div className="flex flex-wrap gap-2 mb-4">
        {restaurantOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => handleRestaurantTypeSelection(option.value)}
            className={`text-white font-bold py-2 px-4 rounded ${isSelected(option.value, selectedRestaurantType)}`}
          >
            {option.label}
          </button>
        ))}
      </div>
      <form
        ref={searchFormRef}
        onSubmit={handleSubmit}
        style={{ display: 'none' }}
      >
        <input type="submit" />
      </form>

      <button
        onClick={handleSearchClick}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Search
      </button>
    </div>
  );
}
