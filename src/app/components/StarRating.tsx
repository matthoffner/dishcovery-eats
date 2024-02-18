import React from 'react';

const StarRating = ({ rating }: any) => {
  const starIcons = [];
  const totalStars = 5; // Change this to the total number of stars you want to display

  for (let i = 1; i <= totalStars; i++) {
    starIcons.push(
      <svg
        key={i}
        className={`w-4 h-4 fill-current ${
          i <= rating ? 'text-yellow-500' : 'text-gray-400'
        }`}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M10 2.5a.5.5 0 01.474.342l1.743 6.573 6.175.45a.5.5 0 01.278.858l-5.091 3.71 1.938 6.294a.5.5 0 01-.768.558L10 16.899l-6.517 3.67a.5.5 0 01-.768-.558l1.937-6.294-5.091-3.71a.5.5 0 01.278-.858l6.175-.45 1.743-6.573a.5.5 0 01.476-.342z"
          clipRule="evenodd"
        />
      </svg>
    );
  }

  return <div className="flex">{starIcons}</div>;
};

export default StarRating;
